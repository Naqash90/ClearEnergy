"""ClearEnergy API built with FastAPI and SQLite."""

import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import sqlite3

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
DATABASE_DIR = ROOT / "database"
DATABASE_PATH = DATABASE_DIR / "clearenergy.db"
PORT = int(os.environ.get("PORT", "4173"))
COOKIE = "clearenergy_session"
SESSIONS: dict[str, int] = {}
DATABASE_DIR.mkdir(exist_ok=True)

app = FastAPI(title="ClearEnergy API")


def open_db():
    db = sqlite3.connect(DATABASE_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db


def create_tables():
    with open_db() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
          salt TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS calculations (
          id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
          device TEXT NOT NULL, power REAL NOT NULL, hours REAL NOT NULL,
          days REAL NOT NULL, price REAL NOT NULL, monthly_cost REAL NOT NULL,
          yearly_cost REAL NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
        CREATE TABLE IF NOT EXISTS email_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
          recipient TEXT NOT NULL, device TEXT NOT NULL, monthly_cost REAL NOT NULL,
          sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
        """)


create_tables()


def password_hash(password, salt):
    return hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64).hex()


def current_user(request, db):
    token = request.cookies.get(COOKIE)
    user_id = SESSIONS.get(token) if token else None
    if user_id is None:
        return None
    row = db.execute(
        "SELECT id,name,email,role,created_at FROM users WHERE id=?", (user_id,)
    ).fetchone()
    return dict(row) if row else None


def require_user(request, db):
    user = current_user(request, db)
    if not user:
        raise HTTPException(401, "Please sign in first.")
    return user


class RegisterData(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str
    password: str = Field(min_length=8, max_length=200)


class LoginData(BaseModel):
    email: str
    password: str


class CalculationData(BaseModel):
    device: str = "Other"
    power: float = Field(ge=0)
    hours: float = Field(ge=0)
    days: float = Field(ge=0)
    price: float = Field(ge=0)
    monthlyCost: float = Field(ge=0)
    yearlyCost: float = Field(ge=0)


class EmailLogData(CalculationData):
    recipient: str


@app.post("/api/register", status_code=201)
def register(data: RegisterData, response: Response):
    name, email = data.name.strip(), data.email.strip().lower()
    if len(name) < 2 or "@" not in email:
        raise HTTPException(400, "Enter a valid name and email.")
    with open_db() as db:
        if db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
            raise HTTPException(409, "This email is already registered.")
        role = "admin" if db.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0 else "user"
        salt = secrets.token_hex(16)
        cursor = db.execute(
            "INSERT INTO users(name,email,password_hash,salt,role) VALUES(?,?,?,?,?)",
            (name, email, password_hash(data.password, salt), salt, role),
        )
        db.commit()
    user = {"id": cursor.lastrowid, "name": name, "email": email, "role": role}
    token = secrets.token_hex(32)
    SESSIONS[token] = user["id"]
    response.set_cookie(COOKIE, token, httponly=True, samesite="lax", max_age=86400)
    return {"user": user, "message": "Account created."}


@app.post("/api/login")
def login(data: LoginData, response: Response):
    with open_db() as db:
        row = db.execute("SELECT * FROM users WHERE email=?", (data.email.strip().lower(),)).fetchone()
    if not row or not hmac.compare_digest(row["password_hash"], password_hash(data.password, row["salt"])):
        raise HTTPException(401, "Incorrect email or password.")
    user = {key: row[key] for key in ("id", "name", "email", "role")}
    token = secrets.token_hex(32)
    SESSIONS[token] = user["id"]
    response.set_cookie(COOKIE, token, httponly=True, samesite="lax", max_age=86400)
    return {"user": user}


@app.post("/api/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE)
    if token:
        SESSIONS.pop(token, None)
    response.delete_cookie(COOKIE)
    return {"ok": True}


@app.get("/api/me")
def me(request: Request):
    with open_db() as db:
        return {"user": current_user(request, db)}


@app.get("/api/email-config")
def email_config(request: Request):
    with open_db() as db:
        require_user(request, db)
    path = DATABASE_DIR / "email-config.json"
    if not path.exists():
        raise HTTPException(503, "Email is not configured.")
    config = json.loads(path.read_text(encoding="utf-8"))
    keys = ("serviceId", "templateId", "publicKey")
    if config.get("provider") != "emailjs" or any(not config.get(key) for key in keys):
        raise HTTPException(503, "EmailJS configuration is incomplete.")
    return {key: config[key] for key in keys}


@app.post("/api/calculations", status_code=201)
def save_calculation(data: CalculationData, request: Request):
    with open_db() as db:
        user = require_user(request, db)
        cursor = db.execute(
            """INSERT INTO calculations
            (user_id,device,power,hours,days,price,monthly_cost,yearly_cost)
            VALUES(?,?,?,?,?,?,?,?)""",
            (user["id"], data.device, data.power, data.hours, data.days,
             data.price, data.monthlyCost, data.yearlyCost),
        )
        db.commit()
    return {"id": cursor.lastrowid, "message": "Result saved."}


@app.get("/api/calculations")
def calculations(request: Request):
    with open_db() as db:
        user = require_user(request, db)
        rows = db.execute(
            "SELECT * FROM calculations WHERE user_id=? ORDER BY id DESC LIMIT 20", (user["id"],)
        ).fetchall()
    return {"calculations": [dict(row) for row in rows]}


@app.get("/api/admin/calculations")
def admin_calculations(request: Request):
    with open_db() as db:
        user = require_user(request, db)
        if user["role"] != "admin":
            raise HTTPException(403, "Administrator access only.")
        rows = db.execute("""SELECT c.*,u.name,u.email FROM calculations c
            JOIN users u ON u.id=c.user_id ORDER BY c.id DESC LIMIT 100""").fetchall()
    return {"calculations": [dict(row) for row in rows]}


@app.post("/api/email-result")
def email_result(data: EmailLogData, request: Request):
    recipient = data.recipient.strip().lower()
    if "@" not in recipient or "." not in recipient.rsplit("@", 1)[-1]:
        raise HTTPException(400, "Enter a valid recipient email.")
    with open_db() as db:
        user = require_user(request, db)
        db.execute(
            "INSERT INTO email_logs(user_id,recipient,device,monthly_cost) VALUES(?,?,?,?)",
            (user["id"], recipient, data.device, data.monthlyCost),
        )
        db.commit()
    return {"message": f"Email sent to {recipient}."}


@app.get("/{file_path:path}", include_in_schema=False)
def website(file_path: str = ""):
    path = (ROOT / (file_path or "index.html")).resolve()
    blocked = {"server.py", "START.bat", "requirements.txt"}
    if (not path.is_relative_to(ROOT) or path.is_relative_to(DATABASE_DIR)
            or path.name in blocked or not path.is_file()):
        raise HTTPException(404, "File not found.")
    return FileResponse(path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=PORT, reload=True)

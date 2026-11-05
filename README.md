# ClearEnergy

ClearEnergy is a student web application about saving energy, renewable energy and electricity costs. It supports **SDG 7: Affordable and Clean Energy**.

The website includes:

- practical energy-saving tips;
- information about renewable energy;
- an electricity cost calculator;
- user registration and login;
- saved calculation history;
- an administrator view;
- calculator results sent by email.

## Run on Windows

1. Double-click `START.bat`.
2. If Python is already installed, the launcher uses it automatically.
3. If Python is missing, press `Y` when the launcher asks for permission to install it.
4. On the first run, FastAPI and uvicorn are installed automatically.
5. The website opens at `http://127.0.0.1:4173/`.

Keep the server window open while using the website. Press `Ctrl+C` to stop it.

The automatic installation requires Windows and an internet connection. Python is downloaded from the official `python.org` website.

## Run in GitHub Codespaces

1. Open the repository on GitHub.
2. Select **Code**, then **Codespaces**.
3. Select **Create codespace on main**.
4. Wait for the environment to finish preparing.
5. In the terminal run:

   ```bash
   uvicorn server:app --reload --host 0.0.0.0 --port 4173
   ```

6. Open the forwarded port named **ClearEnergy website**.

Codespaces installs Python, FastAPI and uvicorn automatically, so nothing needs to be installed on the lab computer.

## Database and accounts

The project uses SQLite. Data is stored in `database/clearenergy.db` and remains available after restarting the server.

Administrator account:

- Email: `admin@clearenergy.test`
- Password: `Demo123!`

Other visitors can select **Register** to create a standard user account.

## Important

Opening `index.html` directly only displays a basic preview. Registration, login, saved results, database access and email sending require `START.bat` or GitHub Codespaces.

## Technology

HTML, CSS, JavaScript, Python, FastAPI, uvicorn, SQLite and EmailJS.


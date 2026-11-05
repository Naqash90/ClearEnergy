@echo off
setlocal
cd /d "%~dp0"
title ClearEnergy Server

:detect_python
set "PYTHON_EXE="
set "PYTHON_ARGS="
where py >nul 2>nul
if not errorlevel 1 (
    py -3 -c "import sys; assert sys.version_info >= (3,10)" >nul 2>nul
    if not errorlevel 1 (
        set "PYTHON_EXE=py"
        set "PYTHON_ARGS=-3"
    )
)

if not defined PYTHON_EXE (
    where python >nul 2>nul
    if not errorlevel 1 (
        python -c "import sys; assert sys.version_info >= (3,10)" >nul 2>nul
        if not errorlevel 1 set "PYTHON_EXE=python"
    )
)

if not defined PYTHON_EXE (
    for /d %%D in ("%LocalAppData%\Programs\Python\Python3*") do (
        if exist "%%~fD\python.exe" set "PYTHON_EXE=%%~fD\python.exe"
    )
)

if not defined PYTHON_EXE (
    echo ============================================================
    echo  ClearEnergy could not start because Python is not installed.
    echo ============================================================
    echo.
    choice /C YN /N /M "Download and install Python automatically? [Y/N]: "
    if errorlevel 2 goto :end
    echo.
    echo Downloading Python from python.org...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$url='https://www.python.org/ftp/python/3.13.17/python-3.13.17-amd64.exe'; $file=Join-Path $env:TEMP 'python-3.13.17-amd64.exe'; Invoke-WebRequest -Uri $url -OutFile $file; if ((Get-FileHash -Algorithm SHA256 $file).Hash -ne '5DA012101BA2E17113A9A1CD901E9CE1441086F2B7ECB5DE06EC94163899A190') { Remove-Item $file -Force; throw 'The Python installer checksum is invalid.' }; $process=Start-Process -FilePath $file -ArgumentList '/quiet InstallAllUsers=0 PrependPath=1 Include_test=0 Include_launcher=1' -Wait -PassThru; Remove-Item $file -Force; exit $process.ExitCode"
    if errorlevel 1 (
        echo.
        echo Python installation failed. Check your internet connection and try again.
        pause
        goto :eof
    )
    echo Python was installed successfully.
    echo.
    goto :detect_python
)

"%PYTHON_EXE%" %PYTHON_ARGS% -c "import sys; assert sys.version_info >= (3,10)" >nul 2>nul
if errorlevel 1 (
    echo Python 3.10 or newer is required.
    pause
    goto :eof
)

echo ClearEnergy is running at http://127.0.0.1:4173/
echo Keep this window open. Press Ctrl+C to stop the server.
echo.

"%PYTHON_EXE%" %PYTHON_ARGS% -c "import fastapi, uvicorn" >nul 2>nul
if errorlevel 1 (
    echo Installing FastAPI and uvicorn for the first run...
    "%PYTHON_EXE%" %PYTHON_ARGS% -m pip install -r "%~dp0requirements.txt"
    if errorlevel 1 (
        echo.
        echo The required packages could not be installed.
        pause
        goto :eof
    )
)

start "" "http://127.0.0.1:4173/"
"%PYTHON_EXE%" %PYTHON_ARGS% -m uvicorn server:app --reload --host 0.0.0.0 --port 4173

echo.
echo The ClearEnergy server has stopped.
:end
pause


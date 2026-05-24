@echo off
SETLOCAL

SET "SCRIPT_DIR=%~dp0"
PUSHD "%SCRIPT_DIR%.."
SET "PROJECT_ROOT=%CD%"
POPD

IF NOT EXIST "%PROJECT_ROOT%\package.json" (
    echo [ERROR] package.json not found in: %PROJECT_ROOT%
    pause
    EXIT /B 1
)

start "Munchies - Backend"  cmd /k "cd /d "%PROJECT_ROOT%" && npm run dev --workspace backend"
timeout /t 2 /nobreak >nul
start "Munchies - Frontend" cmd /k "cd /d "%PROJECT_ROOT%" && npm run dev --workspace frontend"
start "" "http://localhost:3000"

ENDLOCAL
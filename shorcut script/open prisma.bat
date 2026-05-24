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

PUSHD "%PROJECT_ROOT%"
npm exec --workspace backend prisma studio
POPD

ENDLOCAL
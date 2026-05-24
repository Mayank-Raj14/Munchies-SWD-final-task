@echo off
title Munchies Prisma Studio
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%.." >nul || (
    echo [ERROR] Could not resolve project root from "%SCRIPT_DIR%".
    pause
    exit /b 1
)
set "PROJECT_ROOT=%CD%"
popd >nul

set "PRISMA_STUDIO_PORT=5555"
set "PRISMA_HIDE_UPDATE_MESSAGE=true"

if not exist "%PROJECT_ROOT%\package.json" (
    echo [ERROR] package.json not found in:
    echo   %PROJECT_ROOT%
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%\backend\prisma\schema.prisma" (
    echo [ERROR] Prisma schema not found at backend\prisma\schema.prisma
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%\backend\.env" (
    echo [WARN] Missing backend\.env
    echo        Copy backend\.env.example to backend\.env and set DATABASE_URL.
    echo.
)

pushd "%PROJECT_ROOT%" >nul || (
    echo [ERROR] Could not enter project root.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing workspace dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        goto :FAIL
    )
)

echo Freeing Prisma Studio port...
call :KILL_PORT %PRISMA_STUDIO_PORT% "Prisma Studio"

echo Generating Prisma client...
call npm run prisma:generate --workspace backend
if errorlevel 1 goto :FAIL

echo Applying Prisma migrations...
call npm run prisma:migrate:deploy --workspace backend
if errorlevel 1 (
    echo [WARN] Migrations failed. Studio may still open if the database is reachable.
    echo        Check backend\.env DATABASE_URL and PostgreSQL.
    echo.
)

echo Opening Prisma Studio at http://localhost:%PRISMA_STUDIO_PORT% ...
call npm run prisma:studio --workspace backend
if errorlevel 1 (
    popd >nul
    goto :FAIL
)

popd >nul
endlocal
exit /b 0

:FAIL
popd >nul 2>nul
pause
endlocal
exit /b 1

:KILL_PORT
set "PORT=%~1"
set "LABEL=%~2"
set "FOUND=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /I ":%PORT%" ^| findstr /I "LISTENING"') do (
    set "FOUND=1"
    taskkill /F /PID %%a >nul 2>nul
    echo Stopped %LABEL% on port %PORT% ^(PID %%a^).
)
if "!FOUND!"=="0" echo No listener on port %PORT%.
exit /b 0

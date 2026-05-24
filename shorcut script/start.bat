@echo off
title Start Munchies
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%.." >nul || (
    echo [ERROR] Could not resolve project root from "%SCRIPT_DIR%".
    pause
    exit /b 1
)
set "PROJECT_ROOT=%CD%"
popd >nul

set "FRONTEND_PORT=3000"
set "BACKEND_PORT=5000"
set "PRISMA_STUDIO_PORT=5555"
set "PRISMA_HIDE_UPDATE_MESSAGE=true"
set "NEXT_PUBLIC_API_BASE_URL=http://localhost:%BACKEND_PORT%/api"

if not exist "%PROJECT_ROOT%\package.json" (
    echo [ERROR] package.json not found in:
    echo   %PROJECT_ROOT%
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%\backend\.env" (
    echo [WARN] Missing backend\.env
    echo        Copy backend\.env.example to backend\.env and set DATABASE_URL.
    echo.
)

if not exist "%PROJECT_ROOT%\frontend\.env.local" (
    if exist "%PROJECT_ROOT%\frontend\.env.example" (
        echo [INFO] Creating frontend\.env.local from frontend\.env.example
        copy /Y "%PROJECT_ROOT%\frontend\.env.example" "%PROJECT_ROOT%\frontend\.env.local" >nul
    )
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

echo Freeing development ports...
call :KILL_PORT %FRONTEND_PORT% "Frontend"
call :KILL_PORT %BACKEND_PORT% "Backend API"
call :KILL_PORT %PRISMA_STUDIO_PORT% "Prisma Studio"

call :PRISMA_GENERATE
if errorlevel 1 goto :FAIL

echo Applying Prisma migrations...
call npm run prisma:migrate:deploy --workspace backend
if errorlevel 1 (
    echo [ERROR] Prisma migrations failed. Check PostgreSQL and backend\.env DATABASE_URL.
    goto :FAIL
)

echo Starting backend on port %BACKEND_PORT%...
start "Munchies - Backend API" cmd /k "cd /d ""%PROJECT_ROOT%"" && set PORT=%BACKEND_PORT% && npm run dev --workspace backend"

echo Starting frontend on port %FRONTEND_PORT%...
start "Munchies - Frontend" cmd /k "cd /d ""%PROJECT_ROOT%"" && set NEXT_PUBLIC_API_BASE_URL=%NEXT_PUBLIC_API_BASE_URL% && npm run dev --workspace frontend -- -p %FRONTEND_PORT%"

echo Waiting for backend...
call :WAIT_FOR "http://localhost:%BACKEND_PORT%/api/health" 45
if errorlevel 1 (
    echo [WARN] Backend is not responding yet. Check the backend window.
) else (
    echo Backend is ready.
)

echo Waiting for frontend...
call :WAIT_FOR "http://localhost:%FRONTEND_PORT%" 45
if errorlevel 1 (
    echo [WARN] Frontend is not responding yet. Opening the browser anyway.
) else (
    echo Frontend is ready.
)

start "" "http://localhost:%FRONTEND_PORT%"

echo.
echo Munchies is running.
echo   Frontend: http://localhost:%FRONTEND_PORT%
echo   API:      http://localhost:%BACKEND_PORT%/api
echo Close the Backend and Frontend terminal windows to stop.
echo.
popd >nul
pause
endlocal
exit /b 0

:FAIL
popd >nul 2>nul
pause
endlocal
exit /b 1

:WAIT_FOR
set "URL=%~1"
set "TRIES=%~2"
for /l %%i in (1,1,%TRIES%) do (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; try { Invoke-WebRequest -UseBasicParsing '%URL%' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
    if not errorlevel 1 exit /b 0
    timeout /t 1 /nobreak >nul
)
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

:PRISMA_GENERATE
echo Generating Prisma client...
call npm run prisma:generate --workspace backend
if not errorlevel 1 exit /b 0

echo [WARN] Prisma generate failed. Retrying after clearing client cache...
call :KILL_PORT %BACKEND_PORT% "Backend API"
call :KILL_PORT %PRISMA_STUDIO_PORT% "Prisma Studio"
timeout /t 2 /nobreak >nul
if exist "%PROJECT_ROOT%\node_modules\.prisma\client" (
    rmdir /s /q "%PROJECT_ROOT%\node_modules\.prisma\client" 2>nul
)
call npm run prisma:generate --workspace backend
exit /b %ERRORLEVEL%

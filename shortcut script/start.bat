@echo off
setlocal EnableDelayedExpansion

set "PROJECT_DIR=%~dp0"
set "FRONTEND_URL=http://localhost:3000"
set "API_HEALTH_URL=http://localhost:5000/api/health"
cd /d "%PROJECT_DIR%"

echo Stopping old Munchies dev servers...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%P >nul 2>nul
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%P >nul 2>nul

echo Clearing stale Next.js cache...
if exist "%PROJECT_DIR%frontend\.next" rmdir /s /q "%PROJECT_DIR%frontend\.next"

echo Starting PostgreSQL...
if exist "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" (
  call "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "C:\Program Files\PostgreSQL\18\data" start
) else (
  echo PostgreSQL 18 pg_ctl was not found. Make sure PostgreSQL is already running.
)

timeout /t 5 >nul

echo Updating database and Prisma client...
call npm run prisma:generate --workspace backend
if errorlevel 1 (
  echo Prisma generate failed. Close old backend windows and run this file again.
  pause
  exit /b 1
)

call npm exec --workspace backend prisma migrate deploy
if errorlevel 1 (
  echo Database migration failed. Check PostgreSQL and DATABASE_URL in backend\.env.
  pause
  exit /b 1
)

echo Starting Backend...
start "Munchies Backend" /D "%PROJECT_DIR%" cmd /k "npm run dev --workspace backend"

echo Waiting for API on port 5000...
set "API_READY=0"
for /L %%I in (1,1,30) do (
  netstat -ano | findstr ":5000" | findstr "LISTENING" >nul
  if not errorlevel 1 (
    set "API_READY=1"
    goto :api_ready
  )
  timeout /t 2 >nul
)
:api_ready
if "!API_READY!"=="0" (
  echo Warning: Backend may still be starting. Check the Munchies Backend window.
) else (
  echo Backend is listening.
)

echo Starting Frontend...
start "Munchies Frontend" /D "%PROJECT_DIR%" cmd /k "npm run dev --workspace frontend"

echo Waiting for Next.js on port 3000...
set "WEB_READY=0"
for /L %%I in (1,1,45) do (
  netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
  if not errorlevel 1 (
    set "WEB_READY=1"
    goto :web_ready
  )
  timeout /t 2 >nul
)
:web_ready
if "!WEB_READY!"=="0" (
  echo Warning: Frontend may still be compiling. Opening browser anyway...
  timeout /t 10 >nul
) else (
  echo Frontend is listening.
  timeout /t 3 >nul
)

echo Opening Munchies website in your default browser...
start "" "%FRONTEND_URL%"

echo.
echo   Website:  %FRONTEND_URL%
echo   API:      %API_HEALTH_URL%
echo.
echo Munchies is running. Close the Backend and Frontend terminal windows to stop.
pause

@echo off
title Kill Dev Ports
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%.." >nul || (
    echo [ERROR] Could not resolve project root.
    pause
    exit /b 1
)
popd >nul

call :KILL_PORT 3000 "Frontend"
call :KILL_PORT 5000 "Backend API"
call :KILL_PORT 5555 "Prisma Studio"

echo.
echo Done.
pause
endlocal
exit /b 0

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

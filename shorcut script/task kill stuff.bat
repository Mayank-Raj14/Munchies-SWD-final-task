@echo off
title Kill Dev Ports

echo Killing port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /F /PID %%a

echo Killing port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /F /PID %%a

echo Done.
pause
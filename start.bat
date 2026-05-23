@echo off

echo Starting PostgreSQL...
start cmd /k ""C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "C:\Program Files\PostgreSQL\18\data" start"

timeout /t 5 >nul

echo Starting Backend...
start cmd /k "npm run dev --workspace backend"

echo Starting Frontend...
start cmd /k "npm run dev --workspace frontend"

echo Waiting for Next.js to compile...
timeout /t 15 >nul

start http://localhost:3000
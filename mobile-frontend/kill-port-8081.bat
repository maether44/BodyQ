@echo off
REM Find the PID using port 8081
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do (
    echo Killing process with PID %%a using port 8081...
    taskkill /PID %%a /F
)
echo Port 8081 should now be free.

@echo off
:retry
npx expo start --tunnel
if %errorlevel% neq 0 (
    echo Tunnel failed. Retrying in 60 seconds...
    timeout /t 60
    goto retry
)

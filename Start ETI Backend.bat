@echo off
echo Starting ETI backend server...

start "ETI Backend" cmd /k "cd %USERPROFILE%\OneDrive\Desktop\My Websites\Elora Tech Institute\backend && npm run dev"

:: Wait for backend to boot
timeout /t 5 /nobreak > NUL
echo Backend started. Opening frontend in Chrome...

:: Open localhost in Chrome
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:3000"

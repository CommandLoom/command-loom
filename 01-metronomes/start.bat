@echo off
chcp 65001 >nul
rem Command Loom 01 Metronomes: starts a local server, then opens the preview/export page in your browser.
cd /d "%~dp0"
start "Command Loom server - keep open until export finishes" /min py -m http.server 8770 --bind 127.0.0.1
timeout /t 2 /nobreak >nul
start "" "http://localhost:8770/Metronomes.html"
echo.
echo Page opened in your browser: http://localhost:8770/Metronomes.html
echo Keep the "Command Loom server" window on the taskbar open until the export finishes.
echo You can close that window when you are done.
echo.
pause

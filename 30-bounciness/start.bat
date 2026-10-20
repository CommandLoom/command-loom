@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem Command Loom: starts a local server and opens the preview / export page (long video and Shorts).
start "Command Loom server - keep open until export finishes" /min py -m http.server 8802 --bind 127.0.0.1
timeout /t 2 /nobreak >nul
rem ?t= forces the browser to load the latest page instead of a cached copy
start "" "http://127.0.0.1:8802/Bounciness.html?t=%RANDOM%%RANDOM%"
pause

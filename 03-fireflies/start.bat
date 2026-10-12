@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem Command Loom 03 Fireflies: starts a local server and opens the preview/export page.
rem Generate the model data first (see README): node engine/measure_fireflies.js
start "Command Loom 03 server - keep open until export finishes" /min py -m http.server 8773 --bind 127.0.0.1
timeout /t 2 /nobreak >nul
rem ?t= forces the browser to load the latest page instead of a cached copy
start "" "http://127.0.0.1:8773/Fireflies.html?t=%RANDOM%%RANDOM%"
pause

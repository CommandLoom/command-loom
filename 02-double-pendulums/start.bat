@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem Command Loom 02 Double Pendulums: starts a local server, then opens the preview/export page.
rem Generate the measured geometry first (see README): node engine/measure_revision.js and node engine/measure_sound.js
start "Command Loom 02 server - keep open until export finishes" /min py -m http.server 8772 --bind 127.0.0.1
timeout /t 2 /nobreak >nul
rem ?t= forces the browser to load the latest page instead of a cached copy
start "" "http://127.0.0.1:8772/DoublePendulums.html?t=%RANDOM%%RANDOM%"
echo Page opened in your browser. Keep the server window open until the export finishes.
pause

@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found in PATH.
  echo Install Node.js or run this folder from another local web server.
  echo.
  pause
  exit /b 1
)
node dev-server.mjs
if errorlevel 1 pause

@echo off
REM One-click installer: double-click this file to run the PowerShell installer and capture logs
pushd "%~dp0"
echo Running installer, output will be logged to "%~dp0install_and_smoke.log"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_and_smoke.ps1" > "%~dp0install_and_smoke.log" 2>&1
echo.
echo Installer finished. See "%~dp0install_and_smoke.log" for details.
pause
popd

@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-local.ps1" %*
if errorlevel 1 (
    echo.
    echo The application could not be started.
    pause
)
endlocal


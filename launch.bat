@echo off
REM Silent launcher: no console window. Used by desktop shortcut.
set "DIR=%~dp0"
powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%DIR%launch-silent.ps1"

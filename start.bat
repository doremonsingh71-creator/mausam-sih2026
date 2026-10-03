@echo off
title Mausam Persona-Aware App (SIH 2026)
echo Launching Mausam Application on http://localhost:3000...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause

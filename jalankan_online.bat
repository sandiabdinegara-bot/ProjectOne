@echo off
setlocal enabledelayedexpansion
title PDAM Online - One Click Deploy
cd /d "%~dp0"

echo ==========================================
echo    PDAM SMART - STARTING ONLINE SERVICE
echo ==========================================
echo.
echo [!] PENTING:
echo 1. Pastikan XAMPP (Apache ^& MySQL) SUDAH RUNNING.
echo 2. Pastikan jalankan_ai.bat SUDAH JALAN (untuk fitur AI).
echo.
echo [1/2] Menjalankan Server Vite (Preview) di port 5175...

:: Periksa lokasi vite.cmd
if exist "node_modules\.bin\vite.cmd" (
    set VITE_PATH=node_modules\.bin\vite.cmd
) else (
    set VITE_PATH=npx vite
)

start "Vite Preview" cmd /c "cd /d "%~dp0" && !VITE_PATH! preview --port 5175"

echo [2/2] Menjalankan Cloudflared Tunnel...
echo.
echo Tunggu sampai muncul link: https://...trycloudflare.com
echo.
npx.cmd cloudflared tunnel --url http://localhost:5175

pause

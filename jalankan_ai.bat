@echo off
title PDAM - Backend AI Service
cd /d "%~dp0backend_ai"

echo ==========================================
echo    PDAM SMART - STARTING AI SERVICE
echo ==========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak ditemukan! 
    echo Silakan instal Python terlebih dahulu.
    pause
    exit /b
)

echo [1/2] Memeriksa dependensi...
pip install flask flask-cors easyocr opencv-python numpy --quiet

echo [2/2] Menjalankan Server AI di http://localhost:5000...
echo.
echo JANGAN TUTUP JENDELA INI.
echo.

python app.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Terjadi kesalahan saat menjalankan server.
    pause
)

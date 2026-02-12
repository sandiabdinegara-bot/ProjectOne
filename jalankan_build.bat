@echo off
cd /d %~dp0
setlocal enabledelayedexpansion

echo ===========================================
echo   PROSES UPDATE PDAM APP KE XAMPP
echo ===========================================

echo [0/3] Memastikan keamanan file koding...
if not exist index.html.src (
    echo [!] PERINGATAN: index.html.src tidak ditemukan.
    echo Mencoba membuat cadangan dari index.html sekarang...
    copy /y index.html index.html.src > nul
)

echo [1/3] Menjalankan Vite Build...
copy /y index.html.src index.html > nul
echo (Jangan khawatir, file index.html akan terupdate otomatis)
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build gagal! Pastikan tidak ada kodingan yang salah.
    echo Pastikan file index.html asli ada di folder utama.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/3] Membersihkan assets lama dan menyalin file baru...
if exist assets (
    rd /s /q assets
)
if not exist assets mkdir assets

xcopy /s /e /y dist\assets\* assets\ > nul
copy /y dist\* . > nul
REM Restore dev entry so "npm run dev" loads source (not built assets)
copy /y index.html.src index.html > nul

echo [3/3] Selesai!
echo.
echo ===========================================
echo UPDATE BERHASIL! 
echo.
echo TIPS: Jika tampilan tidak berubah di browser, 
echo tekan CTRL + F5 di halaman localhost/PDAM_app
echo ===========================================
pause

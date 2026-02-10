@echo off
cd /d %~dp0
echo Menyiapkan lingkungan pengembangan...
copy /y index.html.src index.html > nul
echo Menjalankan Server Pengembangan (Vite)...
echo Preview instan tersedia di: http://localhost:5173
echo.
echo JANGAN TUTUP JENDELA INI SAAT SEDANG KODING.
echo Tekan Ctrl+C untuk berhenti.
echo.
call npm run dev
pause

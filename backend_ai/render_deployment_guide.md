# Panduan Deploy AI SiCater ke Render.com

Ikuti langkah-langkah berikut untuk menjalankan "otak" AI SiCater secara gratis dan stabil.

### 1. Persiapan Folder
Pastikan folder **`backend_ai`** di laptop Anda sudah berisi file-file berikut:
*   `app.py`
*   `requirements.txt` (sudah saya update dengan `gunicorn`)
*   `render.yaml` (sudah saya buatkan barusan)
*   `minimal_app.py` (opsional)

### 2. Upload ke GitHub (Cara Termudah)
1.  Buka [GitHub.com](https://github.com) dan buat repository baru (misal namanya: `sicater-ai`).
2.  Upload **ISI** dari folder `backend_ai` ke repository tersebut.
    *   *Tips: Anda bisa drag & drop file langsung ke browser GitHub.*

### 3. Koneksikan ke Render
1.  Buka [Render.com](https://dashboard.render.com) dan login (pakai Google).
2.  Klik tombol **"New"** > **"Blueprint"**.
3.  Hubungkan akun GitHub Anda, lalu pilih repository `sicater-ai` tadi.
4.  Klik **"Apply"**.
5.  Render akan otomatis membaca file `render.yaml` dan memulai instalasi AI.

### 4. Ambil URL Baru
*   Setelah statusnya **"Live"** (berwarna hijau), Render akan memberikan URL (misal: `https://sicater-ocr.onrender.com`).
*   **PENTING**: Berikan URL tersebut kepada saya via chat ini.

### 5. Langkah Terakhir (Saya yang kerjakan)
*   Saya akan mengupdate file `src/config.js` dengan URL tersebut.
*   Kita jalankan build ulang, lalu upload ke Rumahweb.

Jika ada kendala saat upload ke GitHub atau di Render, beri tahu saya ya Pak!

# Panduan AI SiCater - Hugging Face Spaces (Plan D)

Karena PythonAnywhere membatasi ruang disk hanya 512MB (tidak cukup untuk kecerdasan buatan), kita akan menggunakan **Hugging Face Spaces**. Ini adalah tempat terbaik untuk hosting AI secara **GRATIS, Tanpa Kartu Kredit, dan RAM besar (16GB)**.

### 1. Buat Akun & Space Dasar
1. Buka [huggingface.co](https://huggingface.co/join) dan daftar akun (Gratis).
2. Setelah login, klik profil Anda di pojok kanan atas > **"New Space"**.
3. Isi Nama Space: `sicater-ocr`.
4. Pilih SDK: **Docker**.
5. Pilih Template: **Blank**.
6. Pilih Space Hardware: **CPU Basic (FREE)**.
7. Pilih Visibility: **Public**.
8. Klik **Create Space**.

### 2. Upload File
Setelah Space dibuat, klik tab **"Files"** lalu **"Add file"** > **"Upload files"**. Masukkan file berikut dari folder `backend_ai` laptop Anda:
- `app.py`
- `requirements.txt`
- `Dockerfile` (Sudah saya buatkan khusus untuk Hugging Face)

### 3. Selesai & Ambil Link
1. Klik **"Commit changes"**.
2. Hugging Face akan membangun (Building) mesin AI Anda. Tunggu sampai muncul status **Running** (hijau).
3. Untuk mendapatkan linknya, klik tombol **"Embed this Space"** (tiga titik di pojok kanan atas > Embed) atau lihat alamat link space-nya.
4. **Link Anda akan terlihat seperti ini**: `https://NAMA_USER-sicater-ocr.hf.space/`

Berikan link tersebut kepada saya, lalu saya akan update kodingan websitenya agar fitur OCR langsung aktif!

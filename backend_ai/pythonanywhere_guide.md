# Panduan Deploy AI ke PythonAnywhere (Tanpa Kartu Kredit)

Jika Render meminta kartu kredit, kita gunakan **PythonAnywhere** yang benar-benar gratis tanpa syarat kartu.

### 1. Buat Akun
1. Buka [PythonAnywhere.com](https://www.pythonanywhere.com/).
2. Klik **"Pricing/signup"** -> Pilih **"Create a Beginner account"** (Gratis).

### 2. Upload File
1. Setelah login, klik tab **"Files"**.
2. Buat folder baru bernama `sicater_ai`.
3. Masuk ke folder itu, lalu klik **"Upload a file"** untuk memasukkan:
   * `app.py`
   * `requirements.txt`

### 3. Setup Web App
1. Klik tab **"Web"** di bagian atas.
2. Klik **"Add a new web app"**.
3. Pilih **Flask** -> Pilih **Python 3.10**.
4. Saat ditanya alamat file, arahkan ke: `/home/NAMA_USER_ANDA/sicater_ai/app.py`.

### 4. Instal Library (Penting)
1. Klik tab **"Consoles"** -> Klik **"Bash"**.
2. Ketik perintah ini:
   `pip install --user flask flask-cors easyocr opencv-python-headless numpy`
3. Tunggu sampai selesai (ini agak lama).

### 5. Selesai
* Link AI Anda akan menjadi: `http://NAMA_USER_ANDA.pythonanywhere.com/`
* Berikan link tersebut ke saya.

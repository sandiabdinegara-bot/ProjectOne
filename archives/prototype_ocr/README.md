# OCR Number Detection Prototype

Prototype ini dirancang untuk memvalidasi angka pada foto meteran air dengan angka yang diinput secara manual oleh petugas, lengkap dengan persentase kemiripan.

## Struktur Prototype
- `index.html`: File standalone (buka langsung di browser).
- `backend/app.py`: Server Python (EasyOCR).
- `frontend/OCRPrototype.jsx`: Source code komponen React (untuk referensi koding).

## Cara Menjalankan

### 1. Persiapan Backend (Python)
Pastikan Anda memiliki Python terinstal, lalu jalankan perintah berikut di terminal:

```bash
pip install easyocr flask flask-cors opencv-python torch torchvision torchaudio
```

Setelah library terinstal, jalankan server:
```bash
python prototype_ocr/backend/app.py
```
*Catatan: Pada saat pertama kali dijalankan, server akan mendownload model EasyOCR (sekitar 100MB).*

### 2. Membuka Frontend
Setelah backend berjalan pada `http://localhost:5000`, Anda bisa:
- Membuka file `prototype_ocr/index.html` langsung di browser Chrome/Edge.
- Atau, integrasikan `prototype_ocr/frontend/OCRPrototype.jsx` ke dalam project React utama Anda.

## Cara Kerja Logic
1. User mengupload foto dan mengetik angka target.
2. `EasyOCR` mendeteksi teks pada gambar dan memfilter hanya karakter angka.
3. `difflib.SequenceMatcher` membandingkan hasil deteksi dengan input user.
4. Sistem menampilkan **Kemiripan (%)** dan status **Sesuai/Tidak Sesuai**.

# 💧 PDAM SMART Dashboard

**PDAM SMART Dashboard** adalah platform manajemen data pelanggan dan pencatatan meteran air digital yang dirancang untuk meningkatkan efisiensi operasional PDAM. Aplikasi ini memungkinkan pengelolaan data pelanggan, petugas, serta proses pencatatan bulanan secara terintegrasi dan responsif.

---

---

## 🚀 Fitur Utama

### 1. **Data Pelanggan**
- Manajemen Lengkap (CRUD): Tambah, ubah, dan hapus data pelanggan.
- Metadata Lokasi: Penyimpanan data Longitude/Latitude untuk pemetaan.
- Upload Foto: Dokumentasi foto rumah dan foto meteran pelanggan.
- Pencarian Pintar: Filter berdasarkan Nama, Kode Area, Rute, hingga ID Tag.

### 2. **Pencatatan & Riwayat Meter**
- Input Stan Meter: Pencatatan angka meteran air bulanan.
- Status Monitoring: Tracking pelanggan yang sudah atau belum dicatat.
- Bukti Digital: Upload foto meteran sebagai bukti fisik saat pencatatan.
- Riwayat Lengkap: Akses cepat ke data pencatatan bulan-bulan sebelumnya.

### 3. **Analisa Baca Meter (AI Powered)**
- **Smart Filtering**: Filter data berdasarkan status OCR (Green/Yellow/Red).
- **Sub-Sequence Matching**: Deteksi angka meteran yang cerdas meski terdapat noise.
- **Review & Verifikasi**: Menu "Update Analisa" khusus untuk menangani hasil deteksi yang membutuhkan perhatian manusia.

### 4. **Manajemen Petugas & Cabang**
- Database Petugas: Kelola data petugas pencatat lapangan dengan penugasan rute per cabang.
- Status Aktif & Profil: Penanganan status aktif dan foto resmi petugas.

---

## 📋 Persyaratan Sistem

Sebelum menjalankan aplikasi, pastikan komputer Anda sudah terinstal:
1.  **XAMPP**: Untuk Apache (Server) dan MySQL (Database).
2.  **Node.js (v20+)**: Untuk menjalankan frontend React/Vite.
3.  **Python (v3.10+)**: Untuk menjalankan fitur AI (OCR).

---

## 🛠️ Cara Setup (Instalasi Pertama)

1.  **Clone Repository**: Unduh kodingan dari Git.
2.  **Frontend Dependencies**: Buka terminal di folder project, jalankan `npm install`.
3.  **Database**:
    - Buka **phpMyAdmin**.
    - Buat database baru bernama `sicater_db`.
    - Import file `sicater_db.sql` ke dalam database tersebut.
4.  **Konfigurasi Environment**:
    - Copy file `.env.example` menjadi `.env`.
    - Sesuaikan `DB_USER` dan `DB_PASS` (default XAMPP biasanya `root` dan tanpa password).

---

## 🕹️ Cara Menjalankan

### A. Mode Lokal (Development)
1.  Jalankan Apache & MySQL di Control Panel **XAMPP**.
2.  Klik 2x file **`jalankan_ai.bat`** (Tunggu sampai muncul *Server AI running*).
3.  Klik 2x file **`mulai_koding.bat`** (Aplikasi akan terbuka di browser lokal).

### B. Mode Presentasi (Online/Tunneling)
Jika ingin aplikasi bisa diakses dari HP atau jaringan luar tanpa hosting:
1.  Pastikan XAMPP dan `jalankan_ai.bat` sudah aktif.
2.  Klik 2x file **`jalankan_online.bat`**.
3.  Copy link **`https://...trycloudflare.com`** yang muncul di jendela hitam, lalu bagikan atau buka di device lain.

---

*Dikembangkan oleh @sandiabdinegara-bot*

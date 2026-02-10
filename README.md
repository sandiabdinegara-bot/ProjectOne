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

### 5. **Export & Laporan**
- Dukungan Multi-Format: Cetak laporan ke **PDF**, **Excel (XLSX)**, dan **CSV** dengan hasil yang rapi dan profesional.

---

## 🛠️ Alur Kerja Pengembangan

Untuk memastikan aplikasi berjalan lancar di lingkungan XAMPP:

1.  **`mulai_koding.bat`**: Gunakan saat ingin menambah fitur (Mode Development).
2.  **`jalankan_ai.bat`**: Wajib dijalankan untuk mengaktifkan fitur pembacaan foto meteran (OCR).
3.  **`jalankan_build.bat`**: Gunakan untuk memproses kodingan menjadi aplikasi siap pakai di XAMPP (`http://localhost/PDAM_app/`).

---

*Dikembangkan dengan ❤️ untuk Efisiensi Pelayanan Air Bersih.*

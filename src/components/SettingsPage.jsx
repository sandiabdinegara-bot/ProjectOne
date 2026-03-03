import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Shield,
  CreditCard,
  Image as ImageIcon,
  Database,
  History,
  Eye,
} from 'lucide-react';
import { BASE_URL } from '../config';
import { fetchWithAuth } from '../api';

const SECTIONS = [
  { id: 'profile', label: 'Profil & Keamanan', icon: User },
  { id: 'tariff', label: 'Tarif & Denda', icon: CreditCard },
  { id: 'backup', label: 'Backup & Database', icon: Database },
  { id: 'activity', label: 'Log Aktivitas', icon: History },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    nama: '',
    username: '',
  });
  const [initialProfile, setInitialProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const res = await fetchWithAuth(`${BASE_URL}/user/me`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showNotification(data.error || 'Gagal memuat profil pengguna', 'error');
        return;
      }
      const mapped = {
        nama: data.nama || data.name || '',
        username: data.username || '',
      };
      setProfileForm(mapped);
      setInitialProfile(mapped);
    } catch (err) {
      console.error('Failed to load profile', err);
      showNotification('Terjadi kesalahan saat memuat profil', 'error');
    } finally {
      setProfileLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async () => {
    if (!profileForm.username || !profileForm.nama) {
      showNotification('Nama dan username wajib diisi', 'error');
      return;
    }
    try {
      setProfileSaving(true);
      const body = {
        nama: profileForm.nama,
        username: profileForm.username,
      };
      const res = await fetchWithAuth(`${BASE_URL}/user/me/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showNotification(data.error || 'Gagal menyimpan profil', 'error');
        return;
      }
      showNotification('Profil berhasil disimpan');
      const updated = {
        nama: data.nama || body.nama,
        username: data.username || body.username,
      };
      setProfileForm(updated);
      setInitialProfile(updated);
    } catch (err) {
      console.error('Failed to save profile', err);
      showNotification('Terjadi kesalahan saat menyimpan profil', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleResetProfile = () => {
    if (initialProfile) {
      setProfileForm(initialProfile);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      showNotification('Semua field password wajib diisi', 'error');
      return;
    }
    if (passwordForm.next.length < 8) {
      showNotification('Password baru minimal 8 karakter', 'error');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      showNotification('Konfirmasi password tidak sama', 'error');
      return;
    }

    try {
      setPasswordSaving(true);
      const body = {
        current_password: passwordForm.current,
        new_password: passwordForm.next,
      };
      const res = await fetchWithAuth(`${BASE_URL}/user/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showNotification(data.error || 'Gagal mengganti password', 'error');
        return;
      }
      showNotification('Password berhasil diperbarui');
      setPasswordForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      console.error('Failed to change password', err);
      showNotification('Terjadi kesalahan saat mengganti password', 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Profil &amp; Keamanan</h2>
              <p>Kelola informasi akun administrator dan keamanan akses.</p>
            </div>
            <div className="settings-grid-2col">
              <div className="settings-panel">
                <h3>Informasi Akun</h3>
                {profileLoading ? (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                    Memuat profil...
                  </p>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Nama Lengkap</label>
                      <input
                        type="text"
                        value={profileForm.nama}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, nama: e.target.value }))
                        }
                        placeholder="Nama admin"
                      />
                    </div>
                    <div className="form-group">
                      <label>Username</label>
                      <input
                        type="text"
                        value={profileForm.username}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                        placeholder="admin"
                      />
                    </div>
                    <div className="settings-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleResetProfile}
                        disabled={!initialProfile || profileSaving}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveProfile}
                        disabled={profileSaving}
                      >
                        {profileSaving ? 'Menyimpan...' : 'Simpan Profil'}
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="settings-panel">
                <h3>Update Keamanan</h3>
                <div className="form-group">
                  <label>Password Saat Ini</label>
                  <div className="settings-input-with-icon">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.current}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          current: e.target.value,
                        }))
                      }
                    />
                    <Eye size={16} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Password Baru</label>
                  <input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={passwordForm.next}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        next: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Konfirmasi Password</label>
                  <input
                    type="password"
                    placeholder="Ulangi password baru"
                    value={passwordForm.confirm}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirm: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="settings-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleChangePassword}
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? 'Memproses...' : 'Ganti Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tariff':
        return (
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Tarif &amp; Denda</h2>
              <p>
                Konfigurasi daftar tarif air dan denda berdasarkan kategori
                pelanggan.
              </p>
            </div>
            <div className="settings-table-note">
              * Harga Blok 1/2/3 sesuai pemakaian bertingkat per m³
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Kategori</th>
                    <th>Status</th>
                    <th>Harga Blok 1 (Rp)</th>
                    <th>Harga Blok 2 (Rp)</th>
                    <th>Harga Blok 3 (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['1A', 'Hidran Umum', 'Aktif', '1200', '1500', '2000'],
                    ['1B', 'Sosial', 'Aktif', '1300', '1600', '2500'],
                    ['2A', 'Rumah Tipe-A', 'Aktif', '2500', '2750', '3000'],
                    ['2B', 'Rumah Tipe-B', 'Aktif', '2700', '3000', '3500'],
                    ['2C', 'Rumah Tipe-C', 'Aktif', '3000', '3500', '4000'],
                    ['3A', 'Bisnis Tipe-A', 'Aktif', '5000', '6000', '7000'],
                    ['3B', 'Bisnis Tipe-B', 'Aktif', '8000', '9000', '10000'],
                    ['3C', 'Bisnis Tipe-C', 'Aktif', '15000', '20000', '25000'],
                  ].map(([code, name, status, b1, b2, b3]) => (
                    <tr key={code}>
                      <td>{code}</td>
                      <td>{name}</td>
                      <td>
                        <span className="badge badge-success">{status}</span>
                      </td>
                      <td>{b1}</td>
                      <td>{b2}</td>
                      <td>{b3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Backup &amp; Database</h2>
              <p>
                Kelola backup manual database dan optimasi rutin untuk kinerja
                yang stabil.
              </p>
            </div>
            <div className="settings-grid-2col settings-backup-grid">
              <div className="settings-backup-panel settings-backup-panel--success">
                <div className="settings-backup-header">
                  <Database size={28} />
                  <div>
                    <h3>Backup Manual</h3>
                    <p>Export database ke file .sql</p>
                  </div>
                </div>
                <button type="button" className="btn btn-primary settings-backup-button">
                  Backup Sekarang
                </button>
                <div className="settings-backup-note">
                  Disarankan melakukan backup rutin sebelum melakukan perubahan
                  besar pada sistem.
                </div>
              </div>
              <div className="settings-backup-panel settings-backup-panel--danger">
                <div className="settings-backup-header">
                  <Shield size={28} />
                  <div>
                    <h3>Database Maintenance</h3>
                    <p>Membersihkan cache dan mengoptimalkan tabel.</p>
                  </div>
                </div>
                <button type="button" className="btn settings-backup-button settings-backup-button--danger">
                  Jalankan Optimasi
                </button>
                <div className="settings-backup-note">
                  Lakukan setelah backup untuk meminimalkan risiko kehilangan
                  data.
                </div>
              </div>
            </div>
            <div className="settings-backup-history">
              <h3>Riwayat Backup</h3>
              <p>Belum ada backup. Klik &quot;Backup Sekarang&quot; untuk membuat backup pertama.</p>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Log Aktivitas</h2>
              <p>Catatan aktivitas penting yang terjadi pada sistem.</p>
            </div>
            <div className="settings-log-toolbar">
              <input
                type="text"
                placeholder="Cari aksi, detail, user..."
                className="settings-log-search"
              />
              <div className="settings-log-filters">
                <input type="date" />
                <input type="date" />
                <button type="button" className="btn btn-outline">
                  Refresh
                </button>
              </div>
            </div>
            <div className="settings-log-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="settings-log-item">
                  <div className="settings-log-icon">
                    <History size={18} />
                  </div>
                  <div className="settings-log-content">
                    <div className="settings-log-title">
                      Inisialisasi Sistem
                    </div>
                    <div className="settings-log-meta">
                      oleh system • Tabel pengaturan berhasil dibuat.
                    </div>
                    <div className="settings-log-time">
                      3/3/2026, 11:39:{30 + i}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Aplikasi &amp; Logo</h2>
              <p>Sesuaikan identitas visual aplikasi dan informasi instansi.</p>
            </div>
            <div className="settings-grid-2col">
              <div className="settings-panel">
                <h3>Informasi Aplikasi</h3>
                <div className="form-group">
                  <label>Nama Aplikasi</label>
                  <input type="text" placeholder="PDAM Smart Metering" />
                </div>
                <div className="form-group">
                  <label>Nama Instansi</label>
                  <input type="text" placeholder="Perumda Air Minum Tirta ..." />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '0.9rem 1.4rem',
            borderRadius: 999,
            background:
              notification.type === 'success' ? '#10b981' : '#ef4444',
            color: '#ffffff',
            fontSize: '0.9rem',
            boxShadow:
              '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
          }}
        >
          {notification.message}
        </div>
      )}
      <header className="settings-header">
        <div>
          <h1>Pengaturan Sistem</h1>
          <p>Konfigurasi manajemen operasional dan pemeliharaan platform.</p>
        </div>
      </header>
      <div className="settings-layout">
        <aside className="settings-nav">
          <div className="settings-nav-title">Kategori</div>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`settings-nav-item ${
                activeSection === id ? 'settings-nav-item--active' : ''
              }`}
              onClick={() => setActiveSection(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </aside>
        <section className="settings-content">{renderSection()}</section>
      </div>
    </div>
  );
}


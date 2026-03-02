import React, { useState, useEffect } from 'react';
import {
    User, Shield, Monitor, Database, Terminal, Save,
    RefreshCw, Upload, HardDrive, Settings as SettingsIcon,
    Users, Plus, Search, Edit2, Trash2, Check, AlertTriangle,
    CreditCard, History, Download, Clock
} from 'lucide-react';

const Settings = () => {
    const [activeSection, setActiveSection] = useState('profile');
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [backupComplete, setBackupComplete] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const sections = [
        { id: 'profile', label: 'Profil & Keamanan', icon: <User size={18} /> },
        { id: 'users', label: 'Manajemen User', icon: <Users size={18} /> },
        { id: 'billing', label: 'Tarif & Denda', icon: <CreditCard size={18} /> },
        { id: 'display', label: 'Aplikasi & Logo', icon: <Monitor size={18} /> },
        { id: 'database', label: 'Backup & Database', icon: <Database size={18} /> },
        { id: 'logs', label: 'Log Aktivitas', icon: <History size={18} /> },
    ];

    const handleBackup = () => {
        setIsBackingUp(true);
        setTimeout(() => {
            setIsBackingUp(false);
            setBackupComplete(true);
            setTimeout(() => setBackupComplete(false), 5000);
        }, 3000);
    };

    const renderContent = () => {
        const panelStyle = {
            background: 'white',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.4s ease-out'
        };

        const headerStyle = {
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid #f1f5f9'
        };

        const labelStyle = {
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#64748b',
            marginBottom: '0.3rem'
        };

        const inputStyle = {
            width: '100%',
            padding: '0.6rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            fontSize: '0.875rem',
            color: '#1e293b',
            transition: 'border-color 0.2s'
        };

        const btnPrimary = {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
        };

        switch (activeSection) {
            case 'profile':
                return (
                    <div style={panelStyle}>
                        <div style={headerStyle}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Profil & Keamanan</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Informasi Akun</h4>
                                <div><label style={labelStyle}>Nama Lengkap</label><input type="text" defaultValue="Administrator" style={inputStyle} /></div>
                                <div><label style={labelStyle}>Username</label><input type="text" defaultValue="admin" style={inputStyle} /></div>
                                <div><label style={labelStyle}>Email</label><input type="email" defaultValue="admin@pdam-smart.com" style={inputStyle} /></div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '1px solid #f1f5f9', paddingLeft: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Update Keamanan</h4>
                                <div><label style={labelStyle}>Password Saat Ini</label><input type="password" placeholder="••••••••" style={inputStyle} /></div>
                                <div><label style={labelStyle}>Password Baru</label><input type="password" placeholder="Minimal 8 karakter" style={inputStyle} /></div>
                                <div><label style={labelStyle}>Konfirmasi Password</label><input type="password" placeholder="Ulangi password baru" style={inputStyle} /></div>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button style={{ ...btnPrimary, background: '#f1f5f9', color: '#475569' }}>Batal</button>
                            <button style={btnPrimary}><Check size={16} /> Simpan Perubahan</button>
                        </div>
                    </div>
                );

            case 'users':
                const mockUsers = [
                    { id: 1, name: 'Budi Santoso', role: 'Petugas', branch: 'Pusat', status: 'Aktif' },
                    { id: 2, name: 'Siti Aminah', role: 'Admin Cabang', branch: 'Sindang', status: 'Aktif' },
                    { id: 3, name: 'Agus Salim', role: 'Petugas', branch: 'Lohbener', status: 'Non-Aktif' },
                ];
                return (
                    <div style={panelStyle}>
                        <div style={{ ...headerStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Daftar Pengguna</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Kelola akses admin dan petugas lapangan</p>
                            </div>
                            <button style={btnPrimary}><Plus size={16} /> Tambah User</button>
                        </div>

                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Cari nama, role, atau cabang..."
                                style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                            />
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '0.5rem' }}>Nama</th>
                                        <th style={{ padding: '0.5rem' }}>Role</th>
                                        <th style={{ padding: '0.5rem' }}>Cabang</th>
                                        <th style={{ padding: '0.5rem' }}>Status</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody style={{ fontSize: '0.875rem' }}>
                                    {mockUsers.map(u => (
                                        <tr key={u.id} style={{ background: '#fcfdfe', border: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.name}</td>
                                            <td style={{ padding: '0.75rem' }}><span style={{ padding: '2px 8px', background: '#eff6ff', borderRadius: '4px', fontSize: '0.75rem', color: '#2563eb' }}>{u.role}</span></td>
                                            <td style={{ padding: '0.75rem' }}>{u.branch}</td>
                                            <td style={{ padding: '0.75rem' }}><span style={{ color: u.status === 'Aktif' ? '#10b981' : '#f43f5e' }}>● {u.status}</span></td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                <button style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', marginRight: '0.5rem' }}><Edit2 size={16} /></button>
                                                <button style={{ border: 'none', background: 'none', color: '#f43f5e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'billing':
                return (
                    <div style={panelStyle}>
                        <div style={headerStyle}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Tarif & Denda</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                            <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CreditCard size={18} color="#2563eb" /> Tarif Air (R1/RT)
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div><label style={labelStyle}>0 - 10 m³</label><input type="text" defaultValue="4.500" style={inputStyle} /></div>
                                    <div><label style={labelStyle}>11 - 20 m³</label><input type="text" defaultValue="5.200" style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Di atas 20 m³</label><input type="text" defaultValue="6.500" style={inputStyle} /></div>
                                </div>
                            </div>
                            <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertTriangle size={18} color="#f59e0b" /> Aturan Denda
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div><label style={labelStyle}>Denda Keterlambatan (Fixed)</label><input type="text" defaultValue="15.000" style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Jatuh Tempo (Tanggal)</label><input type="number" defaultValue="20" style={inputStyle} /></div>
                                    <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', background: '#fffbeb', padding: '8px', borderRadius: '6px' }}>
                                        Denda akan otomatis ditambahkan ke tagihan jika pembayaran melewati tanggal jatuh tempo.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-start' }}>
                            <button style={btnPrimary}><Save size={16} /> Update Konfigurasi</button>
                        </div>
                    </div>
                );

            case 'database':
                return (
                    <div style={panelStyle}>
                        <div style={headerStyle}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Backup & Database</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ padding: '8px', background: '#dcfce7', borderRadius: '10px', color: '#10b981' }}><Clock size={20} /></div>
                                            <div>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Backup Terakhir</h4>
                                                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>2 jam yang lalu (Otomatis)</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleBackup}
                                        disabled={isBackingUp}
                                        style={{ ...btnPrimary, width: '100%', justifyContent: 'center', background: isBackingUp ? '#94a3b8' : '#2563eb' }}
                                    >
                                        {isBackingUp ? <RefreshCw className="animate-spin" size={18} /> : <HardDrive size={18} />}
                                        {isBackingUp ? 'Sedang Memproses...' : 'Backup Sekarang (Manual)'}
                                    </button>

                                    {backupComplete && (
                                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>Backup Berhasil Dibuat!</span>
                                            <button style={{ padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Download size={14} /> Download
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ padding: '1rem', border: '1px solid #fee2e2', borderRadius: '12px', background: '#fff9f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <RefreshCw size={20} color="#ef4444" />
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#991b1b' }}>Database Maintenance</h4>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#b91c1c', marginBottom: '1rem' }}>Membersihkan index cache dan mengoptimalkan tabel yang terfragmentasi.</p>
                                    <button style={{ width: '100%', padding: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Jalankan Optimasi</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'logs':
                const mockLogs = [
                    { time: '10:45', action: 'Update Akun', user: 'admin', detail: 'Mengubah password administrator' },
                    { time: '09:12', action: 'Tambah User', user: 'admin', detail: 'Menambahkan petugas "Budi Santoso"' },
                    { time: '08:00', action: 'System Backup', user: 'System', detail: 'Backup database harian (Berhasil)' },
                    { time: 'Kemarin', action: 'Update Tarif', user: 'admin', detail: 'Mengubah tarif blok 0-10m3 R1' },
                ];
                return (
                    <div style={panelStyle}>
                        <div style={headerStyle}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Audit Log Aktivitas</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {mockLogs.map((log, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.75rem', borderBottom: i === mockLogs.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                    <div style={{ minWidth: '80px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>{log.time}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>{log.action}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>oleh <strong>{log.user}</strong></span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{log.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return (
                    <div style={panelStyle}>
                        <div style={headerStyle}><h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Konfigurasi Aplikasi</h3></div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div className="form-group"><label style={labelStyle}>Nama Aplikasi</label><input type="text" defaultValue="PDAM SMART APP" style={inputStyle} /></div>
                            <div className="form-group"><label style={labelStyle}>Cabang Utama</label><select style={inputStyle}><option>Pusat (Indramayu)</option></select></div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Logo Sistem</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', width: 'fit-content' }}>
                                    <img src="logo.png" alt="Logo" style={{ height: '32px' }} />
                                    <button style={{ padding: '0.4rem 0.8rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}><Upload size={14} /> Ganti</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .settings-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.7rem 0.875rem;
                    width: 100%;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 0.85rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-bottom: 0.2rem;
                    text-align: left;
                }
                .settings-nav-item:hover { background: #f1f5f9; color: #1e293b; }
                .settings-nav-item.active { background: #eff6ff; color: #2563eb; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}
            </style>

            <header style={{ marginBottom: '1.25rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
                    <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SettingsIcon size={24} color="var(--primary)" />
                    </div>
                    Pengaturan Sistem
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: 'calc(24px + 0.75rem + 0.5rem)' }}>
                    Konfigurasi manajemen operasional dan pemeliharaan platform.
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr', gap: '1.5rem', flex: 1, alignItems: 'start' }}>
                <aside style={{ background: 'white', borderRadius: '16px', padding: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ padding: '0 0.75rem 0.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kategori</span>
                    </div>
                    {sections.map(section => (
                        <button
                            key={section.id}
                            className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            {section.icon}
                            <span>{section.label}</span>
                        </button>
                    ))}
                </aside>

                <main style={{ minHeight: 'auto' }}>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Settings;

import React, { useState, useEffect, useCallback } from 'react';
import {
    User, Shield, Monitor, Database, Save,
    RefreshCw, Upload, HardDrive, Settings as SettingsIcon,
    Users, Plus, Search, Edit2, Trash2, Check, AlertTriangle,
    CreditCard, History, Download, Clock, X, Eye, EyeOff,
    ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';

// ─── Toast notification helper ────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
    const isSuccess = type === 'success';
    return (
        <div style={{
            position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
            background: isSuccess ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
            borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', color: isSuccess ? '#065f46' : '#991b1b',
            fontWeight: 600, fontSize: '0.875rem', minWidth: '260px', animation: 'fadeIn 0.3s ease-out'
        }}>
            {isSuccess ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
            <span style={{ flex: 1 }}>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: isSuccess ? '#065f46' : '#991b1b', cursor: 'pointer', padding: 0 }}><X size={16} /></button>
        </div>
    );
};

// ─── Shared styles ─────────────────────────────────────────────────────────────
const panelStyle = { background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', animation: 'fadeIn 0.3s ease-out' };
const headerStyle = { marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' };
const labelStyle = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' };
const inputStyle = { width: '100%', padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.875rem', color: '#1e293b', boxSizing: 'border-box', transition: 'border-color 0.2s', outline: 'none' };
const btnPrimary = { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(37,99,235,0.2)' };
const btnSecondary = { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s' };
const btnDanger = { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(239,68,68,0.2)' };
const badgeStyle = (type) => ({ display: 'inline-flex', padding: '0.25rem 0.65rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, background: type === 'success' ? '#ecfdf5' : type === 'warning' ? '#fffbeb' : type === 'danger' ? '#fef2f2' : '#eff6ff', color: type === 'success' ? '#047857' : type === 'warning' ? '#b45309' : type === 'danger' ? '#b91c1c' : '#1d4ed8', border: `1px solid ${type === 'success' ? '#a7f3d0' : type === 'warning' ? '#fde68a' : type === 'danger' ? '#fecaca' : '#bfdbfe'}` });
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginTop: '0.5rem', minWidth: '500px' };
const thStyle = { padding: '0.875rem 1rem', background: '#f8fafc', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' };
const tdStyle = { padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#334155', verticalAlign: 'middle', whiteSpace: 'nowrap' };
const btnActionStyle = (type) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: type === 'edit' ? '#eff6ff' : '#fef2f2', color: type === 'edit' ? '#2563eb' : '#ef4444', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' });

// ─── Section: Profil & Keamanan ────────────────────────────────────────────────
const ProfileSection = ({ showToast }) => {
    const [profile, setProfile] = useState({ id: 1, nama_lengkap: '', username: '', email: '' });
    const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

    useEffect(() => {
        fetch('/api/settings_profile.php')
            .then(r => r.json())
            .then(d => {
                if (d.id) {
                    setProfile({
                        id: d.id,
                        nama_lengkap: d.nama_lengkap || '',
                        username: d.username || '',
                        email: d.email || ''
                    });
                }
            })
            .catch(() => showToast('Gagal memuat profil.', 'error'))
            .finally(() => setLoading(false));
    }, []);

    const saveProfile = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings_profile.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_profile', ...profile }) });
            const d = await res.json();
            if (d.success) showToast(d.message, 'success');
            else showToast(d.error || 'Gagal menyimpan.', 'error');
        } catch { showToast('Terjadi kesalahan.', 'error'); }
        setSaving(false);
    };

    const savePassword = async () => {
        if (passwords.new_password.length < 8) { showToast('Password baru minimal 8 karakter.', 'error'); return; }
        if (passwords.new_password !== passwords.confirm_password) { showToast('Konfirmasi password tidak cocok.', 'error'); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/settings_profile.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'change_password', id: profile.id, ...passwords }) });
            const d = await res.json();
            if (d.success) { showToast(d.message, 'success'); setPasswords({ current_password: '', new_password: '', confirm_password: '' }); }
            else showToast(d.error || 'Gagal.', 'error');
        } catch { showToast('Terjadi kesalahan.', 'error'); }
        setSaving(false);
    };

    if (loading) return <div style={{ ...panelStyle, textAlign: 'center', padding: '3rem' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>;

    return (
        <div style={panelStyle} className="settings-panel">
            <div style={headerStyle}><h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={20} color="#2563eb" /> Profil & Keamanan</h3></div>
            <div className="settings-grid-2">
                {/* Info Akun */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Informasi Akun</h4>
                    <div><label style={labelStyle}>Nama Lengkap</label><input style={inputStyle} value={profile.nama_lengkap} onChange={e => setProfile({ ...profile, nama_lengkap: e.target.value })} /></div>
                    <div><label style={labelStyle}>Username</label><input style={inputStyle} value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} /></div>
                    <div><label style={labelStyle}>Email</label><input type="email" style={inputStyle} value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <button style={btnSecondary} onClick={() => setProfile({ ...profile })}>Batal</button>
                        <button style={btnPrimary} onClick={saveProfile} disabled={saving}>{saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />} Simpan Profil</button>
                    </div>
                </div>
                {/* Keamanan */}
                <div className="settings-security-col" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Update Keamanan</h4>
                    {['current_password', 'new_password', 'confirm_password'].map((key, i) => (
                        <div key={key}>
                            <label style={labelStyle}>{['Password Saat Ini', 'Password Baru', 'Konfirmasi Password'][i]}</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPass[['current', 'new', 'confirm'][i]] ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '2.5rem' }} placeholder={['••••••••', 'Minimal 8 karakter', 'Ulangi password baru'][i]} value={passwords[key]} onChange={e => setPasswords({ ...passwords, [key]: e.target.value })} />
                                <button onClick={() => setShowPass(p => ({ ...p, [['current', 'new', 'confirm'][i]]: !p[['current', 'new', 'confirm'][i]] }))} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                    {showPass[['current', 'new', 'confirm'][i]] ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    ))}
                    <button style={{ ...btnPrimary, marginTop: '0.5rem', alignSelf: 'flex-start' }} onClick={savePassword} disabled={saving}>
                        {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Shield size={16} />} Ganti Password
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Section: Manajemen User ────────────────────────────────────────────────────
const UsersSection = ({ showToast }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // null | {mode:'add'|'edit', data:{}}
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ nama_lengkap: '', username: '', email: '', role: 'operator', kode_cabang: '', status_aktif: 1, password: '', new_password: '' });

    const [permissions, setPermissions] = useState({});

    const fetchPermissions = useCallback(() => {
        fetch('/api/permissions.php')
            .then(r => r.json())
            .then(d => { if (d.success) setPermissions(d.data); });
    }, []);

    const fetchUsers = useCallback(async (q = '') => {
        setLoading(true);
        try {
            const res = await fetch(`/api/settings_users.php${q ? `?search=${encodeURIComponent(q)}` : ''}`);
            const d = await res.json();
            setUsers(Array.isArray(d) ? d : []);
        } catch { showToast('Gagal memuat data user.', 'error'); }
        setLoading(false);
    }, [showToast]);

    useEffect(() => {
        fetchUsers();
        fetchPermissions();
    }, [fetchUsers, fetchPermissions]);

    const openAdd = () => {
        setForm({ nama_lengkap: '', username: '', email: '', role: 'operator', kode_cabang: '', status_aktif: 1, password: 'password123', new_password: '' });
        setModal({ mode: 'add' });
        fetchPermissions();
    };
    const openEdit = u => {
        setForm({
            ...u,
            nama_lengkap: u.nama_lengkap || '',
            username: u.username || '',
            email: u.email || '',
            kode_cabang: u.kode_cabang || '',
            password: '',
            new_password: ''
        });
        setModal({ mode: 'edit', id: u.id });
        fetchPermissions();
    };

    const saveUser = async () => {
        setSaving(true);
        try {
            const url = modal.mode === 'edit' ? `/api/settings_users.php?id=${modal.id}` : '/api/settings_users.php';
            const body = { ...form };
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const d = await res.json();
            if (d.success) { showToast(d.message, 'success'); setModal(null); fetchUsers(search); }
            else showToast(d.error || 'Gagal menyimpan.', 'error');
        } catch { showToast('Terjadi kesalahan.', 'error'); }
        setSaving(false);
    };

    const deactivate = async (id) => {
        if (!window.confirm('Nonaktifkan user ini?')) return;
        const res = await fetch(`/api/settings_users.php?id=${id}`, { method: 'DELETE' });
        const d = await res.json();
        if (d.success) { showToast(d.message, 'success'); fetchUsers(search); }
        else showToast(d.error, 'error');
    };

    return (
        <div style={panelStyle} className="settings-panel">
            <div style={{ ...headerStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div><h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={20} color="#2563eb" /> Manajemen User</h3><p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Kelola akses pengguna sistem</p></div>
                <button style={btnPrimary} onClick={openAdd}><Plus size={16} /> Tambah User</button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" placeholder="Cari nama, username, atau role..." style={{ ...inputStyle, paddingLeft: '2.75rem' }} value={search} onChange={e => { setSearch(e.target.value); fetchUsers(e.target.value); }} />
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div> : (
                <div className="settings-table-container">
                    <table style={{ ...tableStyle, minWidth: '600px' }}>
                        <thead>
                            <tr>
                                {['Nama & Username', 'Role', 'Status', 'Aksi'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>Tidak ada data user</td></tr>
                            ) : users.map(u => (
                                <tr key={u.id}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{u.nama_lengkap}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>@{u.username} {u.cabang_nama ? ` • ${u.cabang_nama}` : ''}</div>
                                    </td>
                                    <td style={tdStyle}><span style={badgeStyle(u.role === 'superadmin' ? 'warning' : u.role === 'admin' ? 'primary' : 'success')}>{u.role}</span></td>
                                    <td style={tdStyle}><span style={{ ...badgeStyle(u.status_aktif ? 'success' : 'danger'), background: 'transparent' }}>● {u.status_aktif ? 'Aktif' : 'Non-aktif'}</span></td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button style={btnActionStyle('edit')} onClick={() => openEdit(u)} title="Edit"><Edit2 size={14} /></button>
                                            <button style={btnActionStyle('danger')} onClick={() => deactivate(u.id)} title="Nonaktifkan"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '480px', borderRadius: '16px', padding: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, margin: 0 }}>
                                    {modal.mode === 'add' ? <><Plus size={24} color="var(--primary)" /> Tambah User Baru</> : <><Edit2 size={24} color="var(--primary)" /> Edit User</>}
                                </h2>
                                <button
                                    onClick={() => setModal(null)}
                                    style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Nama Lengkap</label>
                                    <input value={form.nama_lengkap} onChange={e => setForm({ ...form, nama_lengkap: e.target.value })} placeholder="Masukkan nama lengkap" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Username</label>
                                        <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username login" />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Role</label>
                                        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                            <option value="superadmin">Super Admin</option>
                                            <option value="management">Management</option>
                                            <option value="cabang">Cabang</option>
                                            <option value="verificator">Verificator</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Email</label>
                                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>{modal.mode === 'add' ? 'Password' : 'Password Baru (kosongkan jika tidak diubah)'}</label>
                                    <input
                                        type="password"
                                        value={modal.mode === 'add' ? form.password : form.new_password}
                                        onChange={e => setForm({ ...form, [modal.mode === 'add' ? 'password' : 'new_password']: e.target.value })}
                                        placeholder="Minimal 8 karakter"
                                    />
                                </div>
                                {modal.mode === 'edit' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <input type="checkbox" id="status_aktif" checked={!!form.status_aktif} onChange={e => setForm({ ...form, status_aktif: e.target.checked ? 1 : 0 })} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary)' }} />
                                        <label htmlFor="status_aktif" style={{ fontWeight: 600, color: '#475569', cursor: 'pointer', marginBottom: 0 }}>Akun Aktif (Dapat Login)</label>
                                    </div>
                                )}

                                {/* Read-only Access Preview */}
                                <div style={{ marginTop: '0.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fdfdfd' }}>
                                    <label style={{ ...labelStyle, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Shield size={14} /> Preview Hak Akses ({form.role})
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        {[
                                            { key: 'dashboard', label: 'Dashboard' },
                                            { key: 'catat', label: 'Cek Meter' },
                                            { key: 'analisa', label: 'Analisa ABM' },
                                            { key: 'pelanggan', label: 'Data Pelanggan' },
                                            { key: 'cabang_parent', label: 'Manajemen Ops' },
                                            { key: 'laporan_parent', label: 'Report' },
                                            { key: 'pengaturan', label: 'Settings' }
                                        ].map(f => {
                                            const hasAccess = !!permissions[form.role]?.[f.key];

                                            return (
                                                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', opacity: hasAccess ? 1 : 0.4 }}>
                                                    <div style={{
                                                        width: '14px',
                                                        height: '14px',
                                                        borderRadius: '3px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: hasAccess ? '#2563eb' : '#f1f5f9',
                                                        color: 'white'
                                                    }}>
                                                        {hasAccess && <Check size={10} strokeWidth={4} />}
                                                    </div>
                                                    <span style={{ color: hasAccess ? '#1e293b' : '#94a3b8', fontWeight: hasAccess ? 600 : 400 }}>{f.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button type="button" className="btn btn-outline" style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', fontWeight: 600 }} onClick={() => setModal(null)}>Batal</button>
                            <button className="btn btn-primary" style={{ padding: '0.625rem 2rem', borderRadius: '8px', fontWeight: 600 }} onClick={saveUser} disabled={saving}>
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                                {modal.mode === 'add' ? 'Buat User' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

// ─── Section: Tarif & Denda ────────────────────────────────────────────────────
const BillingSection = ({ showToast }) => {
    const [tarif, setTarif] = useState([]);
    const [config, setConfig] = useState({ denda_keterlambatan: '', jatuh_tempo: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/settings_billing.php')
            .then(r => r.json())
            .then(d => { setTarif(d.tarif || []); setConfig(d.config || {}); })
            .catch(() => showToast('Gagal memuat data tarif.', 'error'))
            .finally(() => setLoading(false));
    }, []);

    const updateTarif = (idx, field, val) => setTarif(t => t.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings_billing.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tarif, ...config }) });
            const d = await res.json();
            if (d.success) showToast(d.message, 'success');
            else showToast(d.error || 'Gagal menyimpan.', 'error');
        } catch { showToast('Terjadi kesalahan.', 'error'); }
        setSaving(false);
    };

    if (loading) return <div style={{ ...panelStyle, textAlign: 'center', padding: '3rem' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>;

    return (
        <div style={panelStyle} className="settings-panel">
            <div style={headerStyle}><h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Tarif & Denda</h3></div>

            {/* Tarif Table */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={18} color="#2563eb" /> Daftar Tarif Air
                </h4>
                <div className="settings-table-container" style={{ background: 'white' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '850px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['Kode', 'Kategori', 'Status', 'Harga Blok 1 (Rp)', 'Harga Blok 2 (Rp)', 'Harga Blok 3 (Rp)'].map(h =>
                                    <th key={h} style={{ padding: '0.6rem 0.875rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {tarif.map((t, idx) => (
                                <tr key={t.kode_tarif} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.625rem 0.875rem', fontWeight: 700 }}>{t.kode_tarif}</td>
                                    <td style={{ padding: '0.625rem 0.875rem', color: '#475569' }}>{t.tarif}</td>
                                    <td style={{ padding: '0.625rem 0.875rem' }}>
                                        <span style={{ padding: '2px 8px', background: t.status_aktif === 'Aktif' ? '#dcfce7' : '#fef2f2', color: t.status_aktif === 'Aktif' ? '#166534' : '#991b1b', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>{t.status_aktif}</span>
                                    </td>
                                    {['harga_1', 'harga_2', 'harga_3'].map(field => (
                                        <td key={field} style={{ padding: '0.4rem 0.875rem' }}>
                                            <input type="number" style={{ ...inputStyle, padding: '0.4rem 0.6rem', maxWidth: '120px' }} value={t[field] || ''} onChange={e => updateTarif(idx, field, e.target.value)} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.5rem 0 0', fontStyle: 'italic' }}>
                    * Harga Blok 1/2/3 sesuai pemakaian bertingkat per m³
                </p>
            </div>

            {/* Denda Config */}
            <div style={{ padding: '1.25rem', border: '1px solid #fef3c7', borderRadius: '12px', background: '#fffbeb', marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} color="#f59e0b" /> Aturan Denda
                </h4>
                <div className="settings-billing-grid">
                    <div><label style={labelStyle}>Denda Keterlambatan (Rp)</label><input type="number" style={inputStyle} value={config.denda_keterlambatan || ''} onChange={e => setConfig({ ...config, denda_keterlambatan: e.target.value })} /></div>
                    <div><label style={labelStyle}>Jatuh Tempo (Tanggal tiap bulan)</label><input type="number" min={1} max={28} style={inputStyle} value={config.jatuh_tempo || ''} onChange={e => setConfig({ ...config, jatuh_tempo: e.target.value })} /></div>
                </div>
            </div>

            <button style={btnPrimary} onClick={save} disabled={saving}>{saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Update Konfigurasi</button>
        </div>
    );
};


// ─── Section: Aplikasi & Logo ─────────────────────────────────────────────────
const AppSection = ({ showToast }) => {
    const [config, setConfig] = useState({ app_name: '', app_tagline: '', logo_url: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);

    useEffect(() => {
        fetch('/api/settings_app.php')
            .then(r => r.json())
            .then(d => { setConfig(d); setPreview(d.logo_url); })
            .catch(() => showToast('Gagal memuat konfigurasi.', 'error'))
            .finally(() => setLoading(false));
    }, []);

    const onLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLogoFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const save = async () => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('app_name', config.app_name);
            fd.append('app_tagline', config.app_tagline);
            if (logoFile) fd.append('logo', logoFile);
            const res = await fetch('/api/settings_app.php', { method: 'POST', body: fd });
            const d = await res.json();
            if (d.success) showToast(d.message, 'success');
            else showToast(d.error || 'Gagal menyimpan.', 'error');
        } catch { showToast('Terjadi kesalahan.', 'error'); }
        setSaving(false);
    };

    if (loading) return <div style={{ ...panelStyle, textAlign: 'center', padding: '3rem' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>;

    return (
        <div style={panelStyle} className="settings-panel">
            <div style={headerStyle}><h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Monitor size={20} color="#2563eb" /> Aplikasi & Logo</h3></div>
            <div className="settings-app-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Informasi Aplikasi</h4>
                    <div><label style={labelStyle}>Nama Aplikasi</label><input style={inputStyle} value={config.app_name || ''} onChange={e => setConfig({ ...config, app_name: e.target.value })} /></div>
                    <div><label style={labelStyle}>Tagline / Slogan</label><input style={inputStyle} value={config.app_tagline || ''} onChange={e => setConfig({ ...config, app_tagline: e.target.value })} /></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logo Sistem</h4>
                    <div style={{ padding: '1.5rem', border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', transition: 'border-color 0.2s ease' }} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) onLogoChange({ target: { files: e.dataTransfer.files } }); }}>
                        {preview ? (
                            <img src={preview} alt="Logo" style={{ height: '80px', objectFit: 'contain', marginBottom: '1.25rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
                        ) : (
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#94a3b8' }}><Monitor size={32} /></div>
                        )}
                        <div>
                            <label style={{ ...btnSecondary, display: 'inline-flex', padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '999px', background: 'white' }}>
                                <Upload size={16} /> Pilih Logo Baru
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onLogoChange} />
                            </label>
                            <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>PNG, JPG, SVG, WEBP. Maks 2MB.<br />Bisa juga drag & drop file ke sini.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                <button style={btnPrimary} onClick={save} disabled={saving}>{saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Simpan Informasi Aplikasi</button>
            </div>
        </div>
    );
};

// ─── Section: Backup & Database ────────────────────────────────────────────────
const BackupSection = ({ showToast }) => {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [backing, setBacking] = useState(false);

    const fetchBackups = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings_backup.php');
            const d = await res.json();
            setBackups(Array.isArray(d) ? d : []);
        } catch { showToast('Gagal memuat daftar backup.', 'error'); }
        setLoading(false);
    };

    useEffect(() => { fetchBackups(); }, []);

    const runBackup = async () => {
        setBacking(true);
        showToast('Sedang membuat backup...', 'success');
        try {
            const res = await fetch('/api/settings_backup.php', { method: 'POST' });
            const d = await res.json();
            if (d.success) { showToast(`Backup berhasil! ${d.filename}`, 'success'); fetchBackups(); }
            else showToast(d.error || 'Backup gagal.', 'error');
        } catch { showToast('Terjadi kesalahan.', 'error'); }
        setBacking(false);
    };

    const download = (filename) => { window.open(`/api/settings_backup.php?action=download&file=${filename}`, '_blank'); };

    return (
        <div style={panelStyle} className="settings-panel">
            <div style={headerStyle}><h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Backup & Database</h3></div>
            {/* Backup Action */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', background: '#dcfce7', borderRadius: '12px', color: '#10b981' }}><HardDrive size={22} /></div>
                        <div>
                            <h4 style={{ margin: 0, fontWeight: 700 }}>Backup Manual</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Export database ke file .sql</p>
                        </div>
                    </div>
                    <button style={{ ...btnPrimary, width: '100%', justifyContent: 'center', background: backing ? '#94a3b8' : '#10b981' }} onClick={runBackup} disabled={backing}>
                        {backing ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Memproses...</> : <><HardDrive size={18} /> Backup Sekarang</>}
                    </button>
                </div>
                <div style={{ padding: '1.5rem', background: '#fff9f9', border: '1px solid #fecaca', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <RefreshCw size={20} color="#ef4444" />
                        <h4 style={{ margin: 0, fontWeight: 700, color: '#991b1b' }}>⚠️ Database Maintenance</h4>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#b91c1c', marginBottom: '1rem' }}>Membersihkan cache dan mengoptimalkan tabel. Lakukan setelah backup.</p>
                    <button style={{ width: '100%', padding: '0.6rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Jalankan Optimasi</button>
                </div>
            </div>
            {/* Backup History */}
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> Riwayat Backup</h4>
            {loading ? <div style={{ textAlign: 'center', padding: '1rem' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /></div>
                : backups.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>Belum ada backup. Klik "Backup Sekarang".</p>
                    : (
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                            {backups.map((b, i) => (
                                <div key={b.filename} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: i === backups.length - 1 ? 'none' : '1px solid #f1f5f9', background: 'white' }}>
                                    <Database size={16} style={{ marginRight: '0.75rem', color: '#10b981', flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{b.filename}</p>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>{b.date} · {b.size}</p>
                                    </div>
                                    <button style={{ ...btnSecondary, padding: '0.4rem 0.875rem', color: '#2563eb', background: '#eff6ff', border: 'none' }} onClick={() => download(b.filename)}>
                                        <Download size={14} /> Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
        </div>
    );
};

// ─── Section: Log Aktivitas ────────────────────────────────────────────────────
const LogsSection = ({ showToast }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchLogs = useCallback(async (p = 1, q = '', df = '', dt = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, search: q, date_from: df, date_to: dt });
            const res = await fetch(`/api/settings_logs.php?${params}`);
            const d = await res.json();
            setLogs(d.logs || []);
            setTotal(d.total || 0);
            setTotalPages(d.total_pages || 1);
            setPage(p);
        } catch { showToast('Gagal memuat log.', 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchLogs(1); }, [fetchLogs]);

    const actionColors = { 'Update Profil': '#2563eb', 'Tambah User': '#10b981', 'Non-aktif User': '#ef4444', 'Update Tarif & Denda': '#f59e0b', 'Backup Database': '#6366f1', 'Update Aplikasi & Logo': '#8b5cf6', 'Ganti Password': '#f43f5e', 'Inisialisasi Sistem': '#64748b' };

    return (
        <div style={panelStyle} className="settings-panel">
            <div style={{ ...headerStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Log Aktivitas</h3><p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Total {total.toLocaleString()} catatan</p></div>
                <button style={{ ...btnPrimary, background: '#f1f5f9', color: '#475569' }} onClick={() => fetchLogs(1, search, dateFrom, dateTo)}><RefreshCw size={15} /> Refresh</button>
            </div>
            {/* Filters */}
            <div className="settings-log-filters">
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input type="text" placeholder="Cari aksi, detail, user..." style={{ ...inputStyle, paddingLeft: '2.5rem' }} value={search} onChange={e => { setSearch(e.target.value); fetchLogs(1, e.target.value, dateFrom, dateTo); }} />
                </div>
                <input type="date" style={inputStyle} value={dateFrom} onChange={e => { setDateFrom(e.target.value); fetchLogs(1, search, e.target.value, dateTo); }} />
                <input type="date" style={inputStyle} value={dateTo} onChange={e => { setDateTo(e.target.value); fetchLogs(1, search, dateFrom, e.target.value); }} />
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
                : logs.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Tidak ada log aktivitas.</p>
                    : (
                        <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem', scrollbarWidth: 'thin' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {logs.map((log, i) => (
                                    <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.625rem 0.5rem', borderBottom: i === logs.length - 1 ? 'none' : '1px solid #f8fafc' }}>
                                        <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: (actionColors[log.action] || '#64748b') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <History size={14} color={actionColors[log.action] || '#64748b'} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>{log.action}</span>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>oleh <strong style={{ color: '#64748b' }}>{log.username}</strong></span>
                                                {log.ip_address && <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#94a3b8', padding: '1px 5px', borderRadius: '3px' }}>{log.ip_address}</span>}
                                            </div>
                                            <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>{log.detail}</p>
                                            <p style={{ margin: '0.05rem 0 0', fontSize: '0.68rem', color: '#cbd5e1' }}>{new Date(log.created_at).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <button style={{ ...btnSecondary, padding: '0.5rem 0.75rem' }} onClick={() => fetchLogs(page - 1, search, dateFrom, dateTo)} disabled={page === 1}><ChevronLeft size={16} /></button>
                    <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Halaman {page} dari {totalPages}</span>
                    <button style={{ ...btnSecondary, padding: '0.5rem 0.75rem' }} onClick={() => fetchLogs(page + 1, search, dateFrom, dateTo)} disabled={page === totalPages}><ChevronRight size={16} /></button>
                </div>
            )}
        </div>
    );
};

// ─── Section: Hak Akses (Permissions Matrix) ──────────────────────────────────
const AccessMatrixSection = ({ showToast }) => {
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // stores {role, feature} being saved

    const roles = ['superadmin', 'management', 'cabang', 'verificator'];
    const roleLabels = {
        superadmin: 'Super Admin',
        management: 'Management',
        cabang: 'Cabang',
        verificator: 'Verificator'
    };

    const features = [
        { key: 'dashboard', label: 'Dashboard Overview' },
        { key: 'catat', label: 'Pencatatan / Catat Meter' },
        { key: 'analisa', label: 'Analisa Baca Meter (ABM)' },
        { key: 'pelanggan', label: 'Data Pelanggan' },
        { key: 'cabang_parent', label: 'Manajemen Operasional' },
        { key: 'laporan_parent', label: 'Laporan & Report' },
        { key: 'pengaturan', label: 'Pengaturan Sistem' }
    ];

    const fetchPermissions = useCallback(() => {
        setLoading(true);
        fetch('/api/permissions.php')
            .then(r => r.json())
            .then(d => { if (d.success) setPermissions(d.data); })
            .catch(() => showToast('Gagal memuat hak akses.', 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

    const togglePermission = async (role, feature, current) => {
        setSaving({ role, feature });
        try {
            const res = await fetch('/api/permissions.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, feature_key: feature, can_access: !current })
            });
            const d = await res.json();
            if (d.success) {
                setPermissions(prev => ({
                    ...prev,
                    [role]: { ...prev[role], [feature]: !current ? 1 : 0 }
                }));
                showToast(d.message);
            } else {
                showToast(d.error, 'error');
            }
        } catch {
            showToast('Gagal mengubah hak akses.', 'error');
        }
        setSaving(null);
    };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}><div className="spinner" style={{ margin: '0 auto 1rem' }}></div>Memuat data...</div>;

    return (
        <div style={panelStyle} className="settings-panel">
            <div style={headerStyle}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={20} color="#2563eb" /> Pengaturan Hak Akses
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Klik kotak centang untuk langsung mengubah hak akses (Real-time)</p>
            </div>

            <div className="settings-table-container">
                <table style={{ ...tableStyle, minWidth: '700px' }}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '250px' }}>Fitur / Halaman</th>
                            {roles.map(r => (
                                <th key={r} style={{ ...thStyle, textAlign: 'center' }}>{roleLabels[r]}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {features.map(f => (
                            <tr key={f.key}>
                                <td style={{ ...tdStyle, fontWeight: 600, color: '#475569' }}>{f.label}</td>
                                {roles.map(r => {
                                    const val = permissions[r]?.[f.key];
                                    const isSaving = saving?.role === r && saving?.feature === f.key;
                                    return (
                                        <td key={`${r}-${f.key}`} style={{ ...tdStyle, textAlign: 'center' }}>
                                            <div
                                                onClick={() => !isSaving && togglePermission(r, f.key, val)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '8px',
                                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                                    background: val ? '#eff6ff' : '#f8fafc',
                                                    border: `1px solid ${val ? '#bfdbfe' : '#e2e8f0'}`,
                                                    color: val ? '#2563eb' : '#cbd5e1',
                                                    transition: 'all 0.2s ease',
                                                    opacity: isSaving ? 0.5 : 1
                                                }}
                                                className="permission-checkbox"
                                            >
                                                {isSaving ? (
                                                    <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></div>
                                                ) : val ? (
                                                    <Check size={16} strokeWidth={3} />
                                                ) : (
                                                    <X size={16} strokeWidth={3} />
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={14} />
                    <span>Perubahan pada tabel di atas akan langsung berakibat pada menu yang muncul di akun user terkait.</span>
                </p>
            </div>
        </div>
    );
};

// ─── Main Settings Component ───────────────────────────────────────────────────
const Settings = ({ user, canDo = () => true }) => {
    const [activeSection, setActiveSection] = useState('profile');
    const [toast, setToast] = useState(null);

    const showToast = useCallback((msg, type = 'success') => { setToast({ msg, type, key: Date.now() }); }, []);

    const sections = [
        { id: 'profile', label: 'Profil & Keamanan', icon: <User size={18} /> },
        ...(canDo('pengaturan', 'U') ? [
            { id: 'users', label: 'Manajemen User', icon: <Users size={18} /> },
            { id: 'billing', label: 'Tarif & Denda', icon: <CreditCard size={18} /> },
            { id: 'display', label: 'Aplikasi & Logo', icon: <Monitor size={18} /> },
            { id: 'database', label: 'Backup & Database', icon: <Database size={18} /> },
        ] : []),
        { id: 'access', label: 'Hak Akses', icon: <Shield size={18} /> },
        ...(canDo('pengaturan', 'R') ? [
            { id: 'logs', label: 'Log Aktivitas', icon: <History size={18} /> },
        ] : []),
    ];

    const renderSection = () => {
        switch (activeSection) {
            case 'profile': return <ProfileSection showToast={showToast} />;
            case 'users': return <UsersSection showToast={showToast} />;
            case 'billing': return <BillingSection showToast={showToast} />;
            case 'display': return <AppSection showToast={showToast} />;
            case 'database': return <BackupSection showToast={showToast} />;
            case 'logs': return <LogsSection showToast={showToast} />;
            case 'access': return <AccessMatrixSection showToast={showToast} />;
            default: return null;
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                /* Layout & Nav */
                .settings-nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; width: 100%; border: none; background: transparent; color: #64748b; font-weight: 600; font-size: 0.9rem; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 0.25rem; text-align: left; }
                .settings-nav-item:hover { background: #f8fafc; color: #1e293b; }
                .settings-nav-item.active { background: #eff6ff; color: #2563eb; }

                /* Responsive Main Content */
                .settings-main-container { display: grid; grid-template-columns: minmax(200px, 220px) 1fr; gap: 1.5rem; flex: 1; align-items: start; }
                .settings-log-filters { display: grid; grid-template-columns: minmax(200px, 1fr) auto auto; gap: 0.75rem; margin-bottom: 1.25rem; align-items: center; }
                
                .settings-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .settings-security-col { border-left: 1px solid #f1f5f9; padding-left: 2rem; }
                .settings-billing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .settings-app-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px,1fr)); gap: 2.5rem; }
                .settings-modal { background: white; border: 1px solid #e2e8f0; borderRadius: 16px; padding: 2rem; width: 480px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-width: 95%; max-height: 95vh; overflow-y: auto; }
                .settings-table-container { border: 1px solid #e2e8f0; borderRadius: 12px; overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; position: relative; }

                @media (max-width: 768px) {
                    .settings-main-container { grid-template-columns: 1fr; }
                    .settings-log-filters { grid-template-columns: 1fr; }
                    .settings-grid-2 { grid-template-columns: 1fr; gap: 1.5rem; }
                    .settings-security-col { border-left: none; padding-left: 0; border-top: 1px solid #f1f5f9; padding-top: 1.5rem; }
                    .settings-billing-grid { grid-template-columns: 1fr; }
                    .settings-app-grid { grid-template-columns: 1fr; gap: 1.5rem; }
                    .settings-modal { padding: 1.25rem; }
                    .settings-panel { padding: 1rem !important; }
                    th, td { padding: 0.5rem 0.75rem !important; font-size: 0.75rem !important; white-space: nowrap !important; }
                    .header h1 { font-size: 1.5rem !important; }
                    .header p { font-size: 0.85rem !important; }
                    /* Make scrollbar more visible on mobile for table containers */
                    .settings-table-container::-webkit-scrollbar {
                        height: 6px;
                        display: block;
                    }
                    .settings-table-container::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 10px;
                    }
                    .settings-table-container::-webkit-scrollbar-track {
                        background: #f8fafc;
                        border-radius: 10px;
                    }
                }
            `}</style>

            {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <header className="header" style={{ marginBottom: '2.5rem' }}>
                <div className="no-print">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                        <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.625rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <SettingsIcon size={32} color="var(--primary)" />
                        </div>
                        Pengaturan Sistem
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Konfigurasi manajemen operasional dan pemeliharaan platform.</p>
                </div>
            </header>

            <div className="settings-main-container">
                <aside style={{ background: 'white', borderRadius: '16px', padding: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '0 0.75rem 0.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kategori</span>
                    </div>
                    {sections.map(s => (
                        <button key={s.id} className={`settings-nav-item ${activeSection === s.id ? 'active' : ''}`} onClick={() => setActiveSection(s.id)}>
                            {s.icon}<span>{s.label}</span>
                        </button>
                    ))}
                </aside>
                <main>{renderSection()}</main>
            </div>
        </div>
    );
};

export default Settings;

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, User, CheckCircle, AlertCircle, Loader2, X, Download, FileSpreadsheet, FileText, Printer, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { BASE_URL, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../config';
import { fetchWithAuth } from '../api';

const API_URL = `${BASE_URL}/user`;

const ALL_COLUMNS = [
    { id: 'id', label: 'ID' },
    { id: 'nik', label: 'NIK' },
    { id: 'username', label: 'Username' },
    { id: 'nama', label: 'Nama' },
    { id: 'alamat', label: 'Alamat' },
    { id: 'telepon', label: 'Telepon' },
    { id: 'ktp', label: 'KTP' },
    { id: 'status_aktif', label: 'Status' },
    { id: 'created_date', label: 'Dibuat' },
    { id: 'updated_date', label: 'Diubah' }
];

const DEFAULT_COLUMNS = ['id', 'nik', 'username', 'nama', 'alamat', 'telepon', 'status_aktif', 'created_date', 'updated_date'];

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(() => {
        const saved = localStorage.getItem('pdam_users_page_size');
        return saved ? parseInt(saved, 10) : DEFAULT_PAGE_SIZE;
    });
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        nik: '',
        username: '',
        nama: '',
        alamat: '',
        telepon: '',
        ktp: '',
        password: '',
        status_aktif: true
    });

    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const columnMenuRef = React.useRef(null);
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('pdam_visible_columns_users');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    useEffect(() => {
        localStorage.setItem('pdam_visible_columns_users', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        localStorage.setItem('pdam_users_page_size', String(limit));
    }, [limit]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
                setIsColumnMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const fetchUsers = useCallback(async (pageNum, pageLimit, search) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', String(pageNum));
            params.set('limit', String(pageLimit));
            if (search && search.trim()) params.set('search', search.trim());
            const res = await fetchWithAuth(`${API_URL}?${params.toString()}`);
            const json = await res.json();
            if (Array.isArray(json)) {
                setUsers(json);
                setTotal(json.length);
                setTotalPages(1);
            } else {
                setUsers(json.data || []);
                setTotal(json.total ?? 0);
                setPage(json.page ?? pageNum);
                setTotalPages(json.totalPages ?? (Math.ceil((json.total || 0) / pageLimit) || 1));
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
            showNotification('Gagal mengambil data user', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers(page, limit, searchTerm);
    }, [page, limit, searchTerm, fetchUsers]);

    const applySearch = useCallback(() => {
        const trimmed = searchInput.trim();
        if (trimmed !== searchTerm) {
            setSearchTerm(trimmed);
            setPage(1);
        }
    }, [searchInput, searchTerm]);

    const handlePageChange = useCallback((newPage) => {
        setPage(prev => Math.max(1, Math.min(newPage, totalPages)));
    }, [totalPages]);

    const handleLimitChange = useCallback((e) => {
        const newLimit = parseInt(e.target.value, 10);
        setLimit(newLimit);
        setPage(1);
    }, []);

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                nik: user.nik || '',
                username: user.username || '',
                nama: user.nama || '',
                alamat: user.alamat || '',
                telepon: user.telepon || '',
                ktp: user.ktp || user.nik || '',
                password: '',
                status_aktif: user.status_aktif !== false
            });
        } else {
            setEditingUser(null);
            setFormData({ nik: '', username: '', nama: '', alamat: '', telepon: '', ktp: '', password: '', status_aktif: true });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isUpdate = !!editingUser;
        const url = isUpdate ? `${API_URL}/${editingUser.id}` : API_URL;
        const method = isUpdate ? 'PATCH' : 'POST';

        const body = {
            nik: formData.nik,
            username: formData.username,
            nama: formData.nama,
            alamat: formData.alamat,
            telepon: formData.telepon,
            ktp: formData.ktp,
            status_aktif: formData.status_aktif
        };
        if (formData.password) {
            body.password = formData.password;
        }
        try {
            const res = await fetchWithAuth(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) {
                showNotification('Token tidak valid atau kedaluwarsa', 'error');
                return;
            }
            if (res.status === 201 || res.status === 200) {
                fetchUsers(page, limit, searchTerm);
                handleCloseModal();
                showNotification(isUpdate ? 'User berhasil diperbarui' : 'User berhasil ditambahkan');
            } else if (data.error) {
                showNotification(data.error, 'error');
            }
        } catch (err) {
            console.error('Save failed:', err);
            showNotification('Terjadi kesalahan saat menyimpan', 'error');
        }
    };

    const handleDeleteClick = (id) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const res = await fetchWithAuth(`${API_URL}/${deletingId}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) {
                showNotification('Token tidak valid atau kedaluwarsa', 'error');
                return;
            }
            if (res.status === 404) {
                showNotification('Data user tidak ditemukan', 'error');
                setIsConfirmOpen(false);
                setDeletingId(null);
                fetchUsers(page, limit, searchTerm);
                return;
            }
            if (res.status === 200) {
                setIsConfirmOpen(false);
                setDeletingId(null);
                fetchUsers(page, limit, searchTerm);
                showNotification('User berhasil dihapus');
            } else {
                showNotification(data.error || 'Gagal menghapus user', 'error');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            showNotification('Terjadi kesalahan sistem', 'error');
        }
    };

    const displayedColumnIds = visibleColumns
        .filter(id => ALL_COLUMNS.some(c => c.id === id))
        .sort((a, b) => ALL_COLUMNS.findIndex(c => c.id === a) - ALL_COLUMNS.findIndex(c => c.id === b));

    const getCellValue = (item, colId) => {
        const camelColId = colId.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        const raw = item[colId] ?? item[camelColId];
        if (colId === 'status_aktif') return raw === true || raw === 'true' || raw === 1 ? 'Aktif' : 'Nonaktif';
        if (colId === 'created_date' && raw) return new Date(raw).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
        if (colId === 'updated_date' && raw) return new Date(raw).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
        return raw;
    };

    const buildExportParams = useCallback((format) => {
        const params = new URLSearchParams();
        params.set('format', format);
        if (searchTerm && searchTerm.trim()) params.set('search', searchTerm.trim());
        const displayedIds = visibleColumns
            .filter(id => ALL_COLUMNS.some(c => c.id === id))
            .sort((a, b) => ALL_COLUMNS.findIndex(c => c.id === a) - ALL_COLUMNS.findIndex(c => c.id === b));
        if (displayedIds.length) params.set('columns', displayedIds.join(','));
        return params.toString();
    }, [searchTerm, visibleColumns]);

    const exportToCSV = async () => {
        try {
            setExporting(true);
            const qs = buildExportParams('csv');
            const url = `${API_URL}/export?${qs}`;
            const res = await fetchWithAuth(url);
            if (!res.ok) throw new Error(res.statusText);
            const blob = await res.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `data_user_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(downloadUrl);
            showNotification('Export CSV berhasil');
        } catch (err) {
            console.error('Export CSV failed:', err);
            showNotification('Gagal export CSV', 'error');
        } finally {
            setExporting(false);
        }
    };

    const exportToExcel = async () => {
        try {
            setExporting(true);
            const qs = buildExportParams('xlsx');
            const url = `${API_URL}/export?${qs}`;
            const res = await fetchWithAuth(url);
            if (!res.ok) throw new Error(res.statusText);
            const blob = await res.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `data_user_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
            URL.revokeObjectURL(downloadUrl);
            showNotification('Export Excel berhasil');
        } catch (err) {
            console.error('Export Excel failed:', err);
            showNotification('Gagal export Excel', 'error');
        } finally {
            setExporting(false);
        }
    };

    const exportToPDF = async () => {
        try {
            setExporting(true);
            const qs = buildExportParams('pdf');
            const url = `${API_URL}/export?${qs}`;
            const res = await fetchWithAuth(url);
            if (!res.ok) throw new Error(res.statusText);
            const blob = await res.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `data_user_${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
            URL.revokeObjectURL(downloadUrl);
            showNotification('Export PDF berhasil');
        } catch (err) {
            console.error('Export PDF failed:', err);
            showNotification('Gagal export PDF', 'error');
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = async () => {
        try {
            setExporting(true);
            const params = new URLSearchParams();
            params.set('print', '1');
            if (searchTerm && searchTerm.trim()) params.set('search', searchTerm.trim());
            const url = `${API_URL}/export?format=pdf&${params.toString()}`;
            const res = await fetchWithAuth(url);
            if (!res.ok) throw new Error(res.statusText);
            const blob = await res.blob();
            const printUrl = URL.createObjectURL(blob);
            const w = window.open(printUrl, '_blank');
            if (w) w.onload = () => { w.print(); };
            URL.revokeObjectURL(printUrl);
        } catch (err) {
            console.error('Print failed:', err);
            showNotification('Gagal memuat dokumen untuk cetak', 'error');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.5rem',
                    borderRadius: '10px',
                    background: notification.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    animation: 'slideDown 0.3s ease-out'
                }}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span style={{ fontWeight: 500 }}>{notification.message}</span>
                </div>
            )}

            <header className="header" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                        <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.625rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={32} color="var(--primary)" />
                        </div>
                        Data User
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Manajemen data user dan hak akses</p>
                </div>
                <div className="header-actions no-print" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" onClick={exportToCSV} disabled={exporting} title="Export CSV" style={{ height: '42px', width: '42px', padding: 0, borderRadius: '8px' }}>
                            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        </button>
                        <button className="btn btn-outline" onClick={exportToExcel} disabled={exporting} title="Export Excel" style={{ height: '42px', width: '42px', padding: 0, borderRadius: '8px' }}>
                            <FileSpreadsheet size={18} />
                        </button>
                        <button className="btn btn-outline" onClick={exportToPDF} disabled={exporting} title="Export PDF" style={{ height: '42px', width: '42px', padding: 0, borderRadius: '8px' }}>
                            <FileText size={18} />
                        </button>
                        <button className="btn btn-outline" onClick={handlePrint} disabled={exporting} title="Print" style={{ height: '42px', width: '42px', padding: 0, borderRadius: '8px' }}>
                            <Printer size={18} />
                        </button>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 1.25rem',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
                    }}>
                        <Plus size={20} />
                        <span className="hide-mobile">Tambah User</span>
                    </button>
                </div>
            </header>

            <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }} ref={columnMenuRef}>
                        <button
                            className="btn btn-outline"
                            onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                            style={{
                                height: '42px',
                                padding: '0 1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.625rem',
                                borderRadius: '8px',
                                fontWeight: 600,
                                background: isColumnMenuOpen ? '#f1f5f9' : '#f8fafc',
                                border: `1px solid ${isColumnMenuOpen ? 'var(--primary)' : 'var(--border)'}`,
                                color: isColumnMenuOpen ? 'var(--primary)' : 'var(--text)',
                            }}
                        >
                            <SlidersHorizontal size={18} />
                            <span>Pilih Kolom</span>
                        </button>

                        {isColumnMenuOpen && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                left: 0,
                                zIndex: 1000,
                                background: 'white',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                padding: '1.25rem',
                                minWidth: '220px',
                                animation: 'fadeIn 0.2s ease-out'
                            }}>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Tampilkan Kolom</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem' }}>
                                    {ALL_COLUMNS.map(col => (
                                        <label key={col.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            cursor: 'pointer',
                                            padding: '0.5rem 0.75rem',
                                            fontSize: '0.875rem',
                                            borderRadius: '6px',
                                            transition: 'background 0.2s'
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                        >
                                            <input
                                                type="checkbox"
                                                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                                                checked={visibleColumns.includes(col.id)}
                                                onChange={() => {
                                                    setVisibleColumns(prev =>
                                                        prev.includes(col.id)
                                                            ? prev.filter(id => id !== col.id)
                                                            : [...prev, col.id]
                                                    );
                                                }}
                                            />
                                            <span style={{ color: visibleColumns.includes(col.id) ? 'var(--text)' : 'var(--text-light)', fontWeight: visibleColumns.includes(col.id) ? 500 : 400 }}>{col.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                    <button
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                                        onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.id))}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                    >Pilih Semua</button>
                                    <button
                                        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                                        onClick={() => setVisibleColumns(DEFAULT_COLUMNS)}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                    >Reset Default</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ position: 'relative', flex: '0 1 350px', display: 'flex', gap: '0.5rem' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }} />
                        <input
                            style={{
                                paddingLeft: '2.5rem',
                                paddingRight: '0.625rem',
                                height: '42px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                fontSize: '0.9rem',
                                width: '100%',
                                background: '#f8fafc'
                            }}
                            placeholder="Cari username, nama, NIK, alamat..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                        />
                        <button type="button" className="btn btn-primary" onClick={applySearch} style={{ height: '42px', padding: '0 1rem', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                            Cari
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '8rem 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                        <p style={{ color: 'var(--text-light)', fontWeight: 500 }}>Memuat data user...</p>
                    </div>
                ) : (
                    <div className="table-container" style={{ margin: 0 }}>
                        <table style={{ width: '100%', minWidth: '600px' }}>
                            <thead>
                                <tr>
                                    {displayedColumnIds.map(colId => {
                                        const col = ALL_COLUMNS.find(c => c.id === colId);
                                        if (!col) return null;
                                        const isCentered = colId === 'id' || colId === 'status_aktif';
                                        return (
                                            <th key={colId} style={{ padding: '0.625rem 0.75rem', textAlign: isCentered ? 'center' : 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: colId === 'id' ? '60px' : colId === 'username' || colId === 'nik' || colId === 'ktp' ? '130px' : colId === 'status_aktif' ? '90px' : undefined }}>
                                                {col.label}
                                            </th>
                                        );
                                    })}
                                    <th style={{ width: '100px', padding: '0.625rem 0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? users.map((user) => (
                                    <tr key={user.id} style={{ transition: 'background-color 0.2s' }}>
                                        {displayedColumnIds.map(colId => {
                                            const col = ALL_COLUMNS.find(c => c.id === colId);
                                            if (!col) return null;
                                            const value = getCellValue(user, colId);
                                            const isCentered = colId === 'id' || colId === 'status_aktif';
                                            const isActive = colId === 'status_aktif' && (value === 'Aktif');
                                            return (
                                                <td key={colId} style={{ padding: '0.625rem 0.75rem', textAlign: isCentered ? 'center' : 'left', fontSize: '0.875rem', color: colId === 'nama' ? 'var(--text)' : '#64748b', fontWeight: colId === 'username' || colId === 'nama' ? 500 : 400 }}>
                                                    {colId === 'username' ? (
                                                        <span style={{ background: '#f1f5f9', color: '#1e293b', padding: '0.2rem 0.625rem', borderRadius: '4px', fontSize: '0.8125rem', border: '1px solid #e2e8f0' }}>{value !== undefined && value !== null && value !== '' ? String(value) : '-'}</span>
                                                    ) : colId === 'status_aktif' ? (
                                                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#166534' : '#991b1b' }}>{value !== undefined && value !== null ? String(value) : '-'}</span>
                                                    ) : (
                                                        value !== undefined && value !== null && value !== '' ? String(value) : '-'
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td style={{ padding: '0.625rem 0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.25rem', borderRadius: '6px', width: '28px', height: '28px' }}
                                                    onClick={() => handleOpenModal(user)}
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.25rem', color: '#ef4444', borderRadius: '6px', width: '28px', height: '28px' }}
                                                    onClick={() => handleDeleteClick(user.id)}
                                                    title="Hapus User"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={displayedColumnIds.length + 1} style={{ textAlign: 'center', padding: '5rem 0' }}>
                                            <div style={{ opacity: 0.5, marginBottom: '1rem' }}>
                                                <User size={64} style={{ margin: '0 auto' }} />
                                            </div>
                                            <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
                                                {searchTerm ? `Tidak ditemukan hasil untuk "${searchTerm}"` : 'Belum ada data user.'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && (
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Tampilkan</span>
                            <select
                                value={limit}
                                onChange={handleLimitChange}
                                style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.875rem', background: '#fff' }}
                            >
                                {PAGE_SIZE_OPTIONS.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                per halaman. Total: <strong style={{ color: 'var(--text)' }}>{total}</strong> user
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => handlePageChange(page - 1)} style={{ padding: '0.5rem', borderRadius: '6px', minWidth: '36px' }}>
                                <ChevronLeft size={18} />
                            </button>
                            <span style={{ padding: '0 0.75rem', fontSize: '0.875rem', fontWeight: 500 }}>Halaman {page} dari {totalPages || 1}</span>
                            <button type="button" className="btn btn-outline" disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)} style={{ padding: '0.5rem', borderRadius: '6px', minWidth: '36px' }}>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px', borderRadius: '16px', padding: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
                                    {editingUser ? <><Edit2 size={24} color="var(--primary)" /> Edit User</> : <><Plus size={24} color="var(--primary)" /> Tambah User</>}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        padding: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'color 0.2s',
                                        marginTop: '-0.5rem',
                                        marginRight: '-0.5rem'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = '#64748b'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>NIK</label>
                                    <input
                                        placeholder="Nomor Induk Kependudukan"
                                        style={{ height: '48px', borderRadius: '8px' }}
                                        value={formData.nik}
                                        onChange={e => setFormData({ ...formData, nik: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Username</label>
                                    <input
                                        required
                                        placeholder="Masukkan username"
                                        style={{ height: '48px', borderRadius: '8px' }}
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Password{!editingUser ? ' (wajib)' : ''}</label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
                                        style={{ height: '48px', borderRadius: '8px' }}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        autoComplete={editingUser ? 'new-password' : 'new-password'}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Nama</label>
                                    <input
                                        required
                                        placeholder="Masukkan nama lengkap"
                                        style={{ height: '48px', borderRadius: '8px' }}
                                        value={formData.nama}
                                        onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Alamat</label>
                                    <input
                                        placeholder="Alamat lengkap"
                                        style={{ height: '48px', borderRadius: '8px' }}
                                        value={formData.alamat}
                                        onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Telepon</label>
                                    <input
                                        placeholder="Contoh: 081234560002"
                                        style={{ height: '48px', borderRadius: '8px' }}
                                        value={formData.telepon}
                                        onChange={e => setFormData({ ...formData, telepon: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>KTP</label>
                                    <input
                                        placeholder="Nomor KTP"
                                        style={{ height: '48px', borderRadius: '8px' }}
                                        value={formData.ktp}
                                        onChange={e => setFormData({ ...formData, ktp: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Status Aktif</label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                            checked={formData.status_aktif}
                                            onChange={e => setFormData({ ...formData, status_aktif: e.target.checked })}
                                        />
                                        <span style={{ fontSize: '0.9rem' }}>User aktif</span>
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', fontWeight: 600 }} onClick={handleCloseModal}>Batal</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.625rem', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)' }}>
                                        {editingUser ? 'Simpan Perubahan' : 'Simpan Data'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Hapus User?"
                message="Tindakan ini tidak dapat dibatalkan. User tidak akan dapat mengakses sistem lagi."
                type="danger"
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideDown { from { transform: translateX(-50%) translateY(-100%); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media print { .no-print { display: none !important; } body { background: white !important; padding: 0 !important; } .card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; padding: 0 !important; } .table-container { overflow: visible !important; } table { width: 100% !important; border-collapse: collapse !important; } th, td { border: 1px solid #e2e8f0 !important; padding: 8px !important; font-size: 10pt !important; } .header { margin-bottom: 20px !important; } @page { size: auto; margin: 15mm; } }
            `}} />
        </div>
    );
}

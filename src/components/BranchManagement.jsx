import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, CheckCircle, AlertCircle, Loader2, List, X, Download, FileSpreadsheet, FileText, Printer, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { BASE_URL, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../config';
import { fetchWithAuth } from '../api';

const API_URL = `${BASE_URL}/cabang`;

const ALL_COLUMNS = [
    { id: 'kode_cabang', label: 'Kode Cabang' },
    { id: 'cabang', label: 'Nama Cabang' },
    { id: 'alamat', label: 'Alamat' },
    { id: 'telepon', label: 'Telepon' }
];

const DEFAULT_COLUMNS = ['kode_cabang', 'cabang', 'alamat', 'telepon'];

export default function BranchManagement() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState(''); // for controlled input; submit triggers fetch
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(() => {
        const saved = localStorage.getItem('pdam_branches_page_size');
        return saved ? parseInt(saved, 10) : DEFAULT_PAGE_SIZE;
    });
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editingBranch, setEditingBranch] = useState(null);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        kode_cabang: '',
        cabang: '',
        alamat: '',
        telepon: ''
    });

    // Route Management State
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [allRoutes, setAllRoutes] = useState([]);
    const [assignedRoutes, setAssignedRoutes] = useState([]);
    const [routeSearch, setRouteSearch] = useState('');
    const [loadingRoutes, setLoadingRoutes] = useState(false);

    // Column Visibility State
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const columnMenuRef = React.useRef(null);
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('pdam_visible_columns_branches');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    useEffect(() => {
        localStorage.setItem('pdam_visible_columns_branches', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        localStorage.setItem('pdam_branches_page_size', String(limit));
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

    const fetchBranches = useCallback(async (pageNum, pageLimit, search) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', String(pageNum));
            params.set('limit', String(pageLimit));
            if (search && search.trim()) params.set('search', search.trim());
            const res = await fetchWithAuth(`${API_URL}?${params.toString()}`);
            const json = await res.json();
            // Support both paginated response { data, total, page, totalPages } and legacy array
            if (Array.isArray(json)) {
                setBranches(json);
                setTotal(json.length);
                setTotalPages(1);
            } else {
                setBranches(json.data || []);
                setTotal(json.total ?? 0);
                setPage(json.page ?? pageNum);
                setTotalPages(json.totalPages ?? (Math.ceil((json.total || 0) / pageLimit) || 1));
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
            showNotification('Gagal mengambil data cabang', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBranches(page, limit, searchTerm);
    }, [page, limit, searchTerm, fetchBranches]);

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

    const handleOpenModal = (branch = null) => {
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                kode_cabang: branch.kode_cabang || '',
                cabang: branch.cabang || '',
                alamat: branch.alamat || '',
                telepon: branch.telepon || ''
            });
        } else {
            setEditingBranch(null);
            setFormData({ kode_cabang: '', cabang: '', alamat: '', telepon: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBranch(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isUpdate = !!editingBranch;
        const url = isUpdate ? `${API_URL}/${editingBranch.id}` : API_URL;
        const method = isUpdate ? 'PATCH' : 'POST';

        try {
            const res = await fetchWithAuth(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) {
                showNotification('Token tidak valid atau kedaluwarsa', 'error');
                return;
            }
            if (res.status === 201 || res.status === 200) {
                fetchBranches(page, limit, searchTerm);
                handleCloseModal();
                showNotification(isUpdate ? 'Cabang berhasil diperbarui' : 'Cabang berhasil ditambahkan');
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
                showNotification('Data cabang tidak ditemukan', 'error');
                setIsConfirmOpen(false);
                setDeletingId(null);
                fetchBranches(page, limit, searchTerm);
                return;
            }
            if (res.status === 200) {
                setIsConfirmOpen(false);
                setDeletingId(null);
                fetchBranches(page, limit, searchTerm);
                showNotification('Cabang berhasil dihapus');
            } else {
                showNotification(data.error || 'Gagal menghapus cabang', 'error');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            showNotification('Terjadi kesalahan sistem', 'error');
        }
    };

    const handleOpenRouteModal = async (branch) => {
        setSelectedBranch(branch);
        setIsRouteModalOpen(true);
        setLoadingRoutes(true);

        try {
            const res = await fetchWithAuth(`./api/branch_routes.php?kode_cabang=${branch.kode_cabang}`);
            const data = await res.json();
            setAllRoutes(data);
            setAssignedRoutes(data.filter(r => r.assigned).map(r => r.kode_rute));
        } catch (err) {
            console.error('Failed to fetch routes:', err);
            showNotification('Gagal mengambil data rute', 'error');
        } finally {
            setLoadingRoutes(false);
        }
    };

    const handleToggleRoute = (kode_rute) => {
        setAssignedRoutes(prev =>
            prev.includes(kode_rute)
                ? prev.filter(r => r !== kode_rute)
                : [...prev, kode_rute]
        );
    };

    const handleSelectAll = () => {
        const filtered = allRoutes.filter(r =>
            r.kode_rute.toLowerCase().includes(routeSearch.toLowerCase()) ||
            r.rute.toLowerCase().includes(routeSearch.toLowerCase())
        );
        const allFilteredCodes = filtered.map(r => r.kode_rute);
        setAssignedRoutes(prev => [...new Set([...prev, ...allFilteredCodes])]);
    };

    const handleDeselectAll = () => {
        const filtered = allRoutes.filter(r =>
            r.kode_rute.toLowerCase().includes(routeSearch.toLowerCase()) ||
            r.rute.toLowerCase().includes(routeSearch.toLowerCase())
        );
        const filteredCodes = filtered.map(r => r.kode_rute);
        setAssignedRoutes(prev => prev.filter(r => !filteredCodes.includes(r)));
    };

    const handleSaveRoutes = async () => {
        try {
            const res = await fetchWithAuth('./api/branch_routes.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kode_cabang: selectedBranch.kode_cabang,
                    routes: assignedRoutes
                })
            });
            const data = await res.json();
            if (data.message) {
                showNotification(`Berhasil menyimpan ${data.total_routes} rute`);
                setIsRouteModalOpen(false);
            } else {
                showNotification(data.error || 'Gagal menyimpan', 'error');
            }
        } catch (err) {
            console.error('Save routes failed:', err);
            showNotification('Terjadi kesalahan saat menyimpan', 'error');
        }
    };

    // Backend export: same filters as list (search). Columns optional.
    const buildExportParams = useCallback((format) => {
        const params = new URLSearchParams();
        params.set('format', format);
        if (searchTerm && searchTerm.trim()) params.set('search', searchTerm.trim());
        if (visibleColumns.length) params.set('columns', visibleColumns.join(','));
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
            link.download = `data_cabang_${new Date().toISOString().split('T')[0]}.csv`;
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
            link.download = `data_cabang_${new Date().toISOString().split('T')[0]}.xlsx`;
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
            link.download = `data_cabang_${new Date().toISOString().split('T')[0]}.pdf`;
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
            {/* Notification Toast */}
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
                            <Building2 size={32} color="var(--primary)" />
                        </div>
                        Data Cabang
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Manajemen data kantor cabang dan jangkauan wilayah</p>
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
                        <span className="hide-mobile">Tambah Cabang</span>
                    </button>
                </div>
            </header>

            <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                    {/* Column Toggle */}
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
                            placeholder="Cari cabang, kode, alamat atau telepon..."
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
                        <p style={{ color: 'var(--text-light)', fontWeight: 500 }}>Memuat data cabang...</p>
                    </div>
                ) : (
                    <div className="table-container" style={{ margin: 0 }}>
                        <table style={{ width: '100%', minWidth: '600px' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '60px', padding: '0.625rem 0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>NO</th>
                                    {visibleColumns.includes('kode_cabang') && <th style={{ width: '130px', padding: '0.625rem 0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kode Cabang</th>}
                                    {visibleColumns.includes('cabang') && <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Cabang</th>}
                                    {visibleColumns.includes('alamat') && <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alamat</th>}
                                    {visibleColumns.includes('telepon') && <th style={{ width: '160px', padding: '0.625rem 0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telepon</th>}
                                    <th style={{ width: '100px', padding: '0.625rem 0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branches.length > 0 ? branches.map((branch, index) => (
                                    <tr key={branch.id} style={{ transition: 'background-color 0.2s' }}>
                                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: 500, color: '#64748b', fontSize: '0.875rem' }}>{(page - 1) * limit + index + 1}</td>
                                        {visibleColumns.includes('kode_cabang') && (
                                            <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>
                                                <span style={{ background: '#f1f5f9', color: '#1e293b', padding: '0.2rem 0.625rem', borderRadius: '4px', fontSize: '0.8125rem', border: '1px solid #e2e8f0' }}>
                                                    {branch.kode_cabang}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.includes('cabang') && (
                                            <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 500 }}>{branch.cabang}</td>
                                        )}
                                        {visibleColumns.includes('alamat') && (
                                            <td style={{ padding: '0.625rem 0.75rem', color: '#64748b', fontSize: '0.875rem' }}>
                                                <div style={{ maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={branch.alamat}>
                                                    {branch.alamat || '-'}
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.includes('telepon') && (
                                            <td style={{ padding: '0.625rem 0.75rem', color: '#64748b', fontSize: '0.875rem' }}>{branch.telepon || '-'}</td>
                                        )}
                                        <td style={{ padding: '0.625rem 0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{
                                                        padding: '0.25rem',
                                                        borderRadius: '6px',
                                                        width: '28px',
                                                        height: '28px'
                                                    }}
                                                    onClick={() => handleOpenModal(branch)}
                                                    title="Edit Cabang"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{
                                                        padding: '0.25rem',
                                                        color: '#ef4444',
                                                        borderRadius: '6px',
                                                        width: '28px',
                                                        height: '28px'
                                                    }}
                                                    onClick={() => handleDeleteClick(branch.id)}
                                                    title="Hapus Cabang"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={visibleColumns.length + 2} style={{ textAlign: 'center', padding: '5rem 0' }}>
                                            <div style={{ opacity: 0.5, marginBottom: '1rem' }}>
                                                <Building2 size={64} style={{ margin: '0 auto' }} />
                                            </div>
                                            <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
                                                {searchTerm ? `Tidak ditemukan hasil untuk "${searchTerm}"` : 'Belum ada data cabang.'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination - page size option always shown */}
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
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                Tampilkan
                            </span>
                            <select
                                value={limit}
                                onChange={handleLimitChange}
                                style={{
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    fontSize: '0.875rem',
                                    background: '#fff'
                                }}
                            >
                                {PAGE_SIZE_OPTIONS.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                per halaman. Total: <strong style={{ color: 'var(--text)' }}>{total}</strong> cabang
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                                type="button"
                                className="btn btn-outline"
                                disabled={page <= 1}
                                onClick={() => handlePageChange(page - 1)}
                                style={{ padding: '0.5rem', borderRadius: '6px', minWidth: '36px' }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span style={{ padding: '0 0.75rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Halaman {page} dari {totalPages || 1}
                            </span>
                            <button
                                type="button"
                                className="btn btn-outline"
                                disabled={page >= totalPages}
                                onClick={() => handlePageChange(page + 1)}
                                style={{ padding: '0.5rem', borderRadius: '6px', minWidth: '36px' }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px', borderRadius: '16px', padding: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
                                    {editingBranch ? (
                                        <><Edit2 size={24} color="var(--primary)" /> Edit Cabang</>
                                    ) : (
                                        <><Plus size={24} color="var(--primary)" /> Tambah Cabang</>
                                    )}
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
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#64748b'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Kode Cabang</label>
                                    <input
                                        required
                                        maxLength="3"
                                        placeholder="Contoh: 10"
                                        style={{ height: '48px', borderRadius: '8px' }}
                                        value={formData.kode_cabang}
                                        onChange={e => setFormData({ ...formData, kode_cabang: e.target.value })}
                                    />
                                    <small style={{ color: 'var(--text-light)', marginTop: '0.25rem', display: 'block' }}>Maksimal 3 karakter</small>
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Nama Cabang</label>
                                    <input
                                        required
                                        placeholder="Masukkan nama cabang"
                                        style={{ height: '48px', borderRadius: '8px' }}
                                        value={formData.cabang}
                                        onChange={e => setFormData({ ...formData, cabang: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Telepon</label>
                                    <input
                                        placeholder="Contoh: 0234-123456"
                                        style={{ height: '48px', borderRadius: '8px' }}
                                        value={formData.telepon}
                                        onChange={e => setFormData({ ...formData, telepon: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Alamat</label>
                                    <textarea
                                        placeholder="Masukkan alamat lengkap cabang"
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            width: '100%',
                                            minHeight: '100px',
                                            fontSize: '0.95rem',
                                            fontFamily: 'inherit'
                                        }}
                                        value={formData.alamat}
                                        onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                                    />
                                </div>

                                {/* Kelola Rute Button - Only show when editing */}
                                {editingBranch && (
                                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            onClick={() => {
                                                handleCloseModal();
                                                handleOpenRouteModal(editingBranch);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                borderColor: 'var(--primary)',
                                                color: 'var(--primary)',
                                                fontWeight: 600
                                            }}
                                        >
                                            <List size={20} />
                                            Kelola Rute
                                        </button>
                                        <small style={{ color: 'var(--text-light)', marginTop: '0.5rem', display: 'block', textAlign: 'center' }}>
                                            Atur rute yang tersedia di cabang ini
                                        </small>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', fontWeight: 600 }} onClick={handleCloseModal}>
                                        Batal
                                    </button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.625rem', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)' }}>
                                        {editingBranch ? 'Simpan Perubahan' : 'Simpan Data'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirmation */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Hapus Cabang?"
                message="Tindakan ini tidak dapat dibatalkan. Seluruh data terkait cabang ini mungkin terdampak."
                type="danger"
            />

            {/* Route Management Modal */}
            {isRouteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '700px', borderRadius: '16px', padding: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <List size={24} color="var(--primary)" />
                                Kelola Rute - {selectedBranch?.cabang}
                            </h2>
                            <button onClick={() => setIsRouteModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Search and Actions */}
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    autoFocus
                                    placeholder="Ketik untuk mencari rute..."
                                    value={routeSearch}
                                    onChange={(e) => setRouteSearch(e.target.value)}
                                    style={{
                                        paddingLeft: '2.5rem',
                                        paddingRight: routeSearch ? '2.5rem' : '1rem',
                                        height: '44px',
                                        borderRadius: '8px',
                                        border: '2px solid var(--primary)',
                                        width: '100%',
                                        fontSize: '0.95rem',
                                        boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)'
                                    }}
                                />
                                {routeSearch && (
                                    <button
                                        onClick={() => setRouteSearch('')}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: '#e2e8f0',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: '#64748b',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#cbd5e1';
                                            e.currentTarget.style.color = '#334155';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#e2e8f0';
                                            e.currentTarget.style.color = '#64748b';
                                        }}
                                        title="Clear search"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={handleSelectAll} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                        Pilih Semua
                                    </button>
                                    <button onClick={handleDeselectAll} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                        Hapus Semua
                                    </button>
                                </div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: 500 }}>
                                    {assignedRoutes.length} rute dipilih
                                </span>
                            </div>
                        </div>

                        {/* Route List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem' }}>
                            {loadingRoutes ? (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <Loader2 className="animate-spin" size={32} color="var(--primary)" style={{ margin: '0 auto' }} />
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {allRoutes
                                        .filter(r =>
                                            r.kode_rute.toLowerCase().includes(routeSearch.toLowerCase()) ||
                                            r.rute.toLowerCase().includes(routeSearch.toLowerCase())
                                        )
                                        .map(route => (
                                            <label
                                                key={route.kode_rute}
                                                className={`route-checkbox-item ${assignedRoutes.includes(route.kode_rute) ? 'selected' : ''}`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    padding: '0.75rem 1rem',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={assignedRoutes.includes(route.kode_rute)}
                                                    onChange={() => handleToggleRoute(route.kode_rute)}
                                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                                />
                                                <div style={{ flex: 1, pointerEvents: 'none' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>{route.kode_rute}</div>
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>{route.rute}</div>
                                                </div>
                                            </label>
                                        ))
                                    }
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsRouteModalOpen(false)} className="btn btn-outline" style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}>
                                Batal
                            </button>
                            <button onClick={handleSaveRoutes} className="btn btn-primary" style={{
                                padding: '0.625rem 2rem',
                                borderRadius: '8px',
                                fontWeight: 600,
                                boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
                            }}>
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS for animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .route-checkbox-item {
                    background: white;
                    transition: background-color 0.15s ease;
                }
                .route-checkbox-item:hover {
                    background: #f8fafc;
                }
                .route-checkbox-item.selected {
                    background: #f0f9ff;
                }
                .route-checkbox-item.selected:hover {
                    background: #e0f2fe;
                }
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                    }
                    .card {
                        box-shadow: none !important;
                        border: 1px solid #e2e8f0 !important;
                        padding: 0 !important;
                    }
                    .table-container {
                        overflow: visible !important;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    th, td {
                        border: 1px solid #e2e8f0 !important;
                        padding: 8px !important;
                        font-size: 10pt !important;
                    }
                    .header {
                        margin-bottom: 20px !important;
                    }
                    @page {
                        size: auto;
                        margin: 15mm;
                    }
                }
            `}} />
        </div>
    );
}


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Download, FileSpreadsheet, FileText, Printer, SlidersHorizontal, ChevronLeft, ChevronRight, Gauge, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import SearchableSelect from './common/SearchableSelect';
import ConfirmModal from './ConfirmModal';
import { BASE_URL, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../config';
import { fetchWithAuth } from '../api';

const API_URL = `${BASE_URL}/meter`;
const API_BASE_URL = BASE_URL;

const ALL_COLUMNS = [
    { id: 'id', label: 'ID' },
    { id: 'no_meter', label: 'NO. METER' },
    { id: 'merk', label: 'MERK' },
    { id: 'tipe', label: 'TIPE' },
    { id: 'kode_cabang', label: 'CABANG' },
    { id: 'status_aktif', label: 'STATUS' },
    { id: 'tgl_install', label: 'TGL INSTALL' },
    { id: 'update_date', label: 'LAST UPDATE' }
];

const DEFAULT_COLUMNS = ['id', 'no_meter', 'merk', 'tipe', 'kode_cabang', 'status_aktif', 'update_date'];

export default function MeterManagement() {
    const [meters, setMeters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(() => {
        const saved = localStorage.getItem('pdam_meter_page_size');
        return saved ? parseInt(saved, 10) : DEFAULT_PAGE_SIZE;
    });
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editingMeter, setEditingMeter] = useState(null);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        no_meter: '',
        merk: '',
        tipe: '',
        kode_cabang: '',
        tgl_install: '',
        status_aktif: 'Aktif'
    });
    const [branches, setBranches] = useState([]);

    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('pdam_visible_columns_meter');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    const columnMenuRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('pdam_visible_columns_meter', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        localStorage.setItem('pdam_meter_page_size', String(limit));
    }, [limit]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
                setIsColumnMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        fetchBranches();
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await fetchWithAuth('./api/options.php?type=cabang');
            const data = await res.json();
            setBranches(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch branches:', err);
        }
    };

    const fetchMeters = useCallback(async (pageNum, pageLimit, search) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', String(pageNum));
            params.set('limit', String(pageLimit));
            if (search && search.trim()) params.set('search', search.trim());
            const res = await fetchWithAuth(`${API_URL}?${params.toString()}`);
            const json = await res.json();
            if (Array.isArray(json)) {
                setMeters(json);
                setTotal(json.length);
                setTotalPages(1);
            } else {
                setMeters(json.data || []);
                setTotal(json.total ?? 0);
                setPage(json.page ?? pageNum);
                setTotalPages(json.totalPages ?? (Math.ceil((json.total || 0) / pageLimit) || 1));
            }
        } catch (err) {
            console.error('Failed to fetch meters:', err);
            showNotification('Gagal memuat data meter', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMeters(page, limit, searchTerm);
    }, [page, limit, searchTerm, fetchMeters]);

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

    const handleOpenModal = (meter = null) => {
        if (meter) {
            setEditingMeter(meter);
            setFormData({
                no_meter: meter.no_meter || meter.noMeter || '',
                merk: meter.merk || '',
                tipe: meter.tipe || '',
                kode_cabang: meter.kode_cabang || meter.kodeCabang || '',
                tgl_install: meter.tgl_install || meter.tglInstall || '',
                status_aktif: meter.status_aktif || meter.statusAktif || 'Aktif'
            });
        } else {
            setEditingMeter(null);
            setFormData({
                no_meter: '',
                merk: '',
                tipe: '',
                kode_cabang: '',
                tgl_install: new Date().toISOString().split('T')[0],
                status_aktif: 'Aktif'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMeter(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isUpdate = !!editingMeter;
        const url = isUpdate ? `${API_URL}/${editingMeter.id}` : API_URL;
        const method = isUpdate ? 'PATCH' : 'POST';

        try {
            setLoading(true);
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
                fetchMeters(page, limit, searchTerm);
                handleCloseModal();
                showNotification(isUpdate ? 'Meter berhasil diperbarui' : 'Meter berhasil ditambahkan');
            } else if (data.error) {
                showNotification(data.error, 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Gagal menyimpan data meter', 'error');
        } finally {
            setLoading(false);
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
                showNotification('Data meter tidak ditemukan', 'error');
                setIsConfirmOpen(false);
                setDeletingId(null);
                fetchMeters(page, limit, searchTerm);
                return;
            }
            if (res.status === 200) {
                setIsConfirmOpen(false);
                setDeletingId(null);
                fetchMeters(page, limit, searchTerm);
                showNotification('Meter berhasil dihapus');
            } else {
                showNotification(data.error || 'Gagal menghapus meter', 'error');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            showNotification('Terjadi kesalahan sistem', 'error');
        }
    };

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
            const res = await fetchWithAuth(`${API_URL}/export?${qs}`);
            if (!res.ok) throw new Error(res.statusText);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `data_meter_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
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
            const res = await fetchWithAuth(`${API_URL}/export?${qs}`);
            if (!res.ok) throw new Error(res.statusText);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `data_meter_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
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
            const res = await fetchWithAuth(`${API_URL}/export?${qs}`);
            if (!res.ok) throw new Error(res.statusText);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `data_meter_${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
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
            const res = await fetchWithAuth(`${API_URL}/export?format=pdf&${params.toString()}`);
            if (!res.ok) throw new Error(res.statusText);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const w = window.open(url, '_blank');
            if (w) w.onload = () => { w.print(); };
            URL.revokeObjectURL(url);
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

            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
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
                    .meter-table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0;
                    }
                    .meter-table thead th {
                        position: sticky; top: 0; z-index: 30; background: #f8fafc !important;
                        box-shadow: inset 0 -2px 0 var(--border);
                        text-transform: uppercase;
                        font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; color: #64748b;
                        padding: 1rem 1.25rem !important;
                        white-space: nowrap;
                    }
                    .meter-table tbody tr:nth-of-type(even) td {
                        background-color: #fafbfc;
                    }
                    .meter-table tbody tr:hover td {
                        background-color: #eff6ff !important;
                    }
                    .meter-table td, .meter-table th {
                        padding: 0.875rem 1.25rem !important;
                        vertical-align: middle;
                        font-size: 0.875rem;
                        color: #334155;
                    }
                    .sticky-col-left {
                        position: sticky !important;
                        left: 0;
                        z-index: 20 !important;
                        background: white !important;
                    }
                    .meter-table thead th.sticky-col-left {
                        background: #f8fafc !important;
                        z-index: 40 !important;
                        box-shadow: inset 0 -2px 0 var(--border);
                    }
                    .sticky-col-right {
                        position: sticky !important;
                        right: 0;
                        z-index: 20 !important;
                        background: white !important;
                    }
                    .meter-table thead th.sticky-col-right {
                        background: #f8fafc !important;
                        z-index: 40 !important;
                        box-shadow: inset 0 -2px 0 var(--border);
                    }
                    .meter-table tbody tr:nth-of-type(even) .sticky-col-left,
                    .meter-table tbody tr:nth-of-type(even) .sticky-col-right {
                        background-color: #fafbfc !important;
                    }
                    .badge {
                        padding: 0.25rem 0.75rem;
                        border-radius: 9999px;
                        font-size: 0.75rem;
                        font-weight: 600;
                    }
                    .badge-active {
                        background-color: #dcfce7;
                        color: #166534;
                    }
                    .badge-inactive {
                        background-color: #fee2e2;
                        color: #991b1b;
                    }

                    @media print {
                        .no-print, .no-print * {
                            display: none !important;
                        }
                        body { background: white !important; padding: 0 !important; margin: 0 !important; }
                        .card { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; }
                        .table-container { overflow: visible !important; max-height: none !important; width: 100% !important; padding: 0 !important; margin: 0 !important; }
                        .meter-table { width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; font-size: 8pt !important; }
                        .meter-table th, .meter-table td {
                            border: 1px solid #e2e8f0 !important; padding: 4pt !important; overflow: visible !important;
                            white-space: normal !important; word-break: break-word !important; min-width: 0 !important;
                            width: auto !important; position: static !important; background: transparent !important; box-shadow: none !important;
                        }
                        .sticky-col-left { position: static !important; background: transparent !important; box-shadow: none !important; }
                        @page { size: landscape; margin: 1cm; }
                        header.header { margin-bottom: 1rem !important; }
                        h1 { font-size: 16pt !important; }
                    }
                `}
            </style>

            <header className="header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                        <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.625rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Gauge size={32} color="var(--primary)" />
                        </div>
                        Data Meter
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Kelola daftar meter pelanggan</p>
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
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
                        borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, whiteSpace: 'nowrap',
                        boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
                    }}>
                        <Plus size={20} />
                        <span className="hide-mobile">Tambah Meter</span>
                    </button>
                </div>
            </header>

            <div className="card">
                <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: '300px' }}>
                        <div style={{ position: 'relative' }} ref={columnMenuRef}>
                            <button className="btn btn-outline" onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                                style={{
                                    height: '42px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem',
                                    background: isColumnMenuOpen ? '#f1f5f9' : '#f8fafc',
                                    border: `1px solid ${isColumnMenuOpen ? 'var(--primary)' : 'var(--border)'}`,
                                    color: isColumnMenuOpen ? 'var(--primary)' : 'var(--text)', borderRadius: '8px', fontWeight: 600
                                }}>
                                <SlidersHorizontal size={18} /><span>Pilih Kolom</span>
                            </button>
                            {isColumnMenuOpen && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000, background: 'white',
                                    border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    padding: '1.25rem', minWidth: '240px', maxHeight: '400px', display: 'flex', flexDirection: 'column'
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flexShrink: 0 }}>Tampilkan Kolom</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem', overflowY: 'auto' }}>
                                        {ALL_COLUMNS.map(col => (
                                            <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem 0.75rem', fontSize: '0.875rem', borderRadius: '6px' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                                                <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                                                    checked={visibleColumns.includes(col.id)}
                                                    onChange={() => setVisibleColumns(prev => prev.includes(col.id) ? prev.filter(id => id !== col.id) : [...prev, col.id])} />
                                                <span style={{ color: visibleColumns.includes(col.id) ? 'var(--text)' : 'var(--text-light)', fontWeight: visibleColumns.includes(col.id) ? 500 : 400 }}>{col.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexShrink: 0 }}>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                                            onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.id))}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>Pilih Semua</button>
                                        <button style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                                            onClick={() => setVisibleColumns(DEFAULT_COLUMNS)}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>Reset Default</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ position: 'relative', flex: '0 1 350px', display: 'flex', gap: '0.5rem' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }} />
                            <input
                                style={{ paddingLeft: '2.5rem', paddingRight: '0.625rem', height: '42px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', width: '100%', background: '#f8fafc' }}
                                placeholder="Cari no. meter, merk, tipe, cabang..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                            />
                            <button type="button" className="btn btn-primary" onClick={applySearch} style={{ height: '42px', padding: '0 1rem', borderRadius: '8px', whiteSpace: 'nowrap' }}>Cari</button>
                        </div>
                    </div>
                </div>

                <div className="table-container" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto', margin: '1rem -1rem 0', width: 'calc(100% + 2rem)' }}>
                    <table className="meter-table">
                        <thead>
                            <tr>
                                <th className="sticky-col-left" style={{ width: '60px', textAlign: 'center' }}>NO</th>
                                {visibleColumns.map(colId => {
                                    const col = ALL_COLUMNS.find(c => c.id === colId);
                                    if (!col) return null;
                                    let style = { padding: '0.625rem 0.75rem', whiteSpace: 'nowrap', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc' };
                                    if (colId === 'id') style = { ...style, minWidth: '60px', textAlign: 'center' };
                                    else if (['kode_cabang', 'status_aktif', 'tgl_install'].includes(colId)) style = { ...style, minWidth: '100px', textAlign: 'center' };
                                    else if (colId === 'no_meter') style = { ...style, minWidth: '120px', textAlign: 'left' };
                                    else if (colId === 'update_date') style = { ...style, minWidth: '150px', textAlign: 'left' };
                                    else style = { ...style, minWidth: '120px', textAlign: 'left' };
                                    return <th key={colId} style={style}>{col.label}</th>;
                                })}
                                <th className="no-print sticky-col-right" style={{ width: '100px', textAlign: 'center', background: '#f8fafc', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AKSI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={visibleColumns.length + 2} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Memuat data...</td></tr>
                            ) : meters.length === 0 ? (
                                <tr><td colSpan={visibleColumns.length + 2} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>{searchTerm ? `Tidak ditemukan hasil untuk "${searchTerm}"` : 'Tidak ada data meter.'}</td></tr>
                            ) : (
                                meters.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="sticky-col-left" style={{ textAlign: 'center', fontWeight: 500, color: '#64748b', padding: '12px 16px' }}>{(page - 1) * limit + index + 1}</td>
                                        {visibleColumns.map(colId => {
                                            const cellPadding = '12px 16px';
                                            if (colId === 'status_aktif') {
                                                const status = item.status_aktif ?? item.statusAktif;
                                                return (
                                                    <td key={colId} style={{ textAlign: 'center', padding: cellPadding }}>
                                                        <span className={`badge ${status === 'Aktif' ? 'badge-active' : 'badge-inactive'}`}>{status || '-'}</span>
                                                    </td>
                                                );
                                            }
                                            const isCentered = ['id', 'kode_cabang', 'tgl_install'].includes(colId);
                                            const camelColId = colId.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
                                            const value = item[colId] ?? item[camelColId];
                                            return (
                                                <td key={colId} style={{ textAlign: isCentered ? 'center' : 'left', padding: cellPadding, fontWeight: colId === 'no_meter' ? 600 : 400, color: colId === 'no_meter' ? '#334155' : 'inherit' }}>
                                                    {value !== undefined && value !== null ? String(value) : '-'}
                                                </td>
                                            );
                                        })}
                                        <td className="no-print sticky-col-right" style={{ textAlign: 'center', background: 'inherit', padding: '0.625rem 0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                                                <button className="btn btn-outline" style={{ padding: '0.25rem', width: '28px', height: '28px', borderRadius: '6px' }} onClick={() => handleOpenModal(item)} title="Edit"><Edit2 size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '0.25rem', width: '28px', height: '28px', borderRadius: '6px', color: '#ef4444' }} onClick={() => handleDeleteClick(item.id)} title="Hapus"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Tampilkan</span>
                            <select value={limit} onChange={handleLimitChange} style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.875rem', background: '#fff' }}>
                                {PAGE_SIZE_OPTIONS.map(n => (<option key={n} value={n}>{n}</option>))}
                            </select>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>per halaman. Total: <strong style={{ color: 'var(--text)' }}>{total}</strong> meter</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => handlePageChange(page - 1)} style={{ padding: '0.5rem', borderRadius: '6px', minWidth: '36px' }}><ChevronLeft size={18} /></button>
                            <span style={{ padding: '0 0.75rem', fontSize: '0.875rem', fontWeight: 500 }}>Halaman {page} dari {totalPages || 1}</span>
                            <button type="button" className="btn btn-outline" disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)} style={{ padding: '0.5rem', borderRadius: '6px', minWidth: '36px' }}><ChevronRight size={18} /></button>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideUp 0.3s ease-out' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {editingMeter ? <Edit2 size={24} color="var(--primary)" /> : <Plus size={24} color="var(--primary)" />}
                                {editingMeter ? 'Edit Meter' : 'Tambah Meter'}
                            </h2>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e) => e.currentTarget.style.color = '#64748b'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8' }><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                            <div className="grid-6-col-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>No. Meter</label>
                                    <input type="text" required className="input-field" placeholder="Nomor meter" value={formData.no_meter} onChange={(e) => setFormData({ ...formData, no_meter: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>Merk</label>
                                    <input type="text" className="input-field" placeholder="Merk meter" value={formData.merk} onChange={(e) => setFormData({ ...formData, merk: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>Tipe</label>
                                    <input type="text" className="input-field" placeholder="Tipe meter" value={formData.tipe} onChange={(e) => setFormData({ ...formData, tipe: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>Status Aktif</label>
                                    <select className="input-field" value={formData.status_aktif} onChange={(e) => setFormData({ ...formData, status_aktif: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <option value="Aktif">Aktif</option>
                                        <option value="Tidak Aktif">Tidak Aktif</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>Tanggal Install</label>
                                    <input type="date" className="input-field" value={formData.tgl_install} onChange={(e) => setFormData({ ...formData, tgl_install: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <SearchableSelect
                                        label="Cabang"
                                        containerStyle={{ marginBottom: 0 }}
                                        options={branches.map(b => ({ value: b.kode_cabang, label: b.cabang }))}
                                        value={formData.kode_cabang}
                                        onChange={(e) => setFormData({ ...formData, kode_cabang: e.target.value })}
                                        placeholder="Pilih Cabang"
                                        searchPlaceholder="Cari cabang..."
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={handleCloseModal} className="btn btn-outline" style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}>Batal</button>
                                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 2rem', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)' }}>
                                    <Save size={18} /> Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Hapus Meter?"
                message="Tindakan ini tidak dapat dibatalkan. Data meter yang terkait mungkin terdampak."
                type="danger"
            />
        </div>
    );
}

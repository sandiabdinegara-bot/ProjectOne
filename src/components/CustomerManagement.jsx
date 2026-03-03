import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, Printer, X, SlidersHorizontal, CheckCircle, AlertCircle, Loader2, Users } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

import { BASE_URL, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../config';
import { fetchWithAuth } from '../api';

const API_URL = `${BASE_URL}/pelanggan`;

const ALL_COLUMNS = [
    { id: 'id', label: 'ID' },
    { id: 'no_ktp', label: 'NO. KTP' },
    { id: 'nama', label: 'NAMA PELANGGAN' },
    { id: 'alamat', label: 'ALAMAT' },
    { id: 'telepon', label: 'TELEPON' },
    { id: 'active_date', label: 'TANGGAL AKTIF' },
    { id: 'update_date', label: 'TERAKHIR DIUBAH' }
];

const DEFAULT_COLUMNS = ['id', 'no_ktp', 'nama', 'alamat', 'telepon', 'active_date', 'update_date'];



export default function CustomerManagement() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(() => {
        const saved = localStorage.getItem('pdam_pelanggan_page_size');
        return saved ? parseInt(saved, 10) : DEFAULT_PAGE_SIZE;
    });
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef(null);
    const [notification, setNotification] = useState(null);

    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('pdam_visible_columns_pelanggan');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    const [formData, setFormData] = useState({
        id_tag: '',
        no_ktp: '',
        nama: '',
        alamat: '',
        telepon: '',
        active_date: ''
    });

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const fetchCustomers = useCallback(async (pageNum, pageLimit, search) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', String(pageNum));
            params.set('limit', String(pageLimit));
            if (search && search.trim()) params.set('search', search.trim());
            const res = await fetchWithAuth(`${API_URL}?${params.toString()}`);
            const json = await res.json();
            if (Array.isArray(json)) {
                setCustomers(json);
                setTotal(json.length);
                setTotalPages(1);
            } else {
                setCustomers(json.data || []);
                setTotal(json.total ?? 0);
                setPage(json.page ?? pageNum);
                setTotalPages(json.totalPages ?? (Math.ceil((json.total || 0) / pageLimit) || 1));
            }
        } catch (err) {
            console.error('Failed to fetch customers:', err);
            showNotification('Gagal mengambil data pelanggan', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchCustomers(page, limit, searchTerm);
    }, [page, limit, searchTerm, fetchCustomers]);

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

    useEffect(() => {
        localStorage.setItem('pdam_visible_columns_pelanggan', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        localStorage.setItem('pdam_pelanggan_page_size', String(limit));
    }, [limit]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
                setIsColumnMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                id_tag: customer.id_tag || '',
                no_ktp: customer.no_ktp || '',
                nama: customer.nama || '',
                alamat: customer.alamat || '',
                telepon: customer.telepon || '',
                active_date: customer.active_date ? String(customer.active_date).slice(0, 10) : ''
            });
        } else {
            setEditingCustomer(null);
            setFormData({ id_tag: '', no_ktp: '', nama: '', alamat: '', telepon: '', active_date: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isUpdate = !!editingCustomer;
        const url = isUpdate ? `${API_URL}/${editingCustomer.id}` : API_URL;
        const method = isUpdate ? 'PATCH' : 'POST';
        const body = {
            id_tag: formData.id_tag,
            no_ktp: formData.no_ktp,
            nama: formData.nama,
            alamat: formData.alamat,
            telepon: formData.telepon,
            active_date: formData.active_date || null
        };

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
                fetchCustomers(page, limit, searchTerm);
                handleCloseModal();
                showNotification(isUpdate ? 'Pelanggan berhasil diperbarui' : 'Pelanggan berhasil ditambahkan');
            } else if (data.error) {
                showNotification(data.error, 'error');
            }
        } catch (err) {
            console.error('Save failed:', err);
            showNotification('Gagal menyimpan data pelanggan', 'error');
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
                showNotification('Data pelanggan tidak ditemukan', 'error');
                setIsConfirmOpen(false);
                setDeletingId(null);
                fetchCustomers(page, limit, searchTerm);
                return;
            }
            if (res.status === 200) {
                setIsConfirmOpen(false);
                setDeletingId(null);
                fetchCustomers(page, limit, searchTerm);
                showNotification('Pelanggan berhasil dihapus');
            } else {
                showNotification(data.error || 'Gagal menghapus pelanggan', 'error');
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
            const res = await fetchWithAuth(`${API_URL}/export?${qs}`);
            if (!res.ok) throw new Error(res.statusText);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `data_pelanggan_${new Date().toISOString().split('T')[0]}.csv`;
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
            link.download = `data_pelanggan_${new Date().toISOString().split('T')[0]}.xlsx`;
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
            link.download = `data_pelanggan_${new Date().toISOString().split('T')[0]}.pdf`;
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

    const displayedColumnIds = visibleColumns
        .filter(id => ALL_COLUMNS.some(c => c.id === id))
        .sort((a, b) => ALL_COLUMNS.findIndex(c => c.id === a) - ALL_COLUMNS.findIndex(c => c.id === b));

    const getCellValue = (item, colId) => {
        const camelColId = colId.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        const raw = item[colId] ?? item[camelColId];
        if (colId === 'active_date' && raw) return String(raw).slice(0, 10);
        if (colId === 'update_date' && raw) return new Date(raw).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
        return raw;
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
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .customer-table thead th {
                        position: sticky; top: 0; z-index: 30; background: #f8fafc !important; 
                        box-shadow: inset 0 -2px 0 var(--border);
                        text-transform: uppercase;
                        font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; color: #64748b; 
                        padding: 1rem 1.25rem !important;
                        white-space: nowrap;
                    }
                    .customer-table tbody tr:nth-of-type(even) td {
                        background-color: #fafbfc;
                    }
                    .customer-table tbody tr:hover td {
                        background-color: #eff6ff !important;
                    }
                    .customer-table td, .customer-table th {
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
                    .customer-table thead th.sticky-col-left {
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
                    .customer-table thead th.sticky-col-right {
                        background: #f8fafc !important;
                        z-index: 40 !important;
                        box-shadow: inset 0 -2px 0 var(--border);
                    }
                    .customer-table tbody tr:nth-of-type(even) .sticky-col-left,
                    .customer-table tbody tr:nth-of-type(even) .sticky-col-right {
                        background-color: #fafbfc !important;
                    }

                    @media print {
                        .no-print, .no-print * {
                            display: none !important;
                        }
                        
                        body {
                            background: white !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }

                        .card {
                            box-shadow: none !important;
                            border: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }

                        .table-container {
                            overflow: visible !important;
                            max-height: none !important;
                            width: 100% !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }

                        .customer-table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                            table-Layout: auto !important;
                            font-size: 8pt !important;
                        }

                        .customer-table th, .customer-table td {
                            border: 1px solid #e2e8f0 !important;
                            padding: 4pt !important;
                            overflow: visible !important;
                            white-space: normal !important;
                            word-break: break-word !important;
                            min-width: 0 !important;
                            width: auto !important;
                            position: static !important;
                            background: transparent !important;
                            box-shadow: none !important;
                        }

                        .sticky-col-left, .sticky-col-right {
                            position: static !important;
                            background: transparent !important;
                            box-shadow: none !important;
                        }

                        @page {
                            size: landscape;
                            margin: 1cm;
                        }

                        header.header {
                            margin-bottom: 1rem !important;
                        }

                        h1 {
                            font-size: 16pt !important;
                        }
                    }
                `}
            </style>
            <header className="header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                        <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.625rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={32} color="var(--primary)" />
                        </div>
                        Data Pelanggan
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Manajemen data pelanggan dan informasi meteran</p>
                </div>
                <div className="header-actions no-print">
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
                        <span className="hide-mobile">Tambah Pelanggan</span>
                    </button>
                </div>
            </header>

            <div className="card">
                <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, minWidth: 'min-content', flexWrap: 'wrap' }}>
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
                                    background: isColumnMenuOpen ? '#f1f5f9' : '#f8fafc',
                                    border: `1px solid ${isColumnMenuOpen ? 'var(--primary)' : 'var(--border)'}`,
                                    color: isColumnMenuOpen ? 'var(--primary)' : 'var(--text)',
                                    borderRadius: '8px',
                                    fontWeight: 600
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
                                    minWidth: '240px',
                                    maxHeight: '450px',
                                    overflowY: 'auto',
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

                        {/* Search */}
                        <div style={{ position: 'relative', flex: '0 1 350px', display: 'flex', gap: '0.5rem' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }} />
                            <input
                                style={{ paddingLeft: '2.5rem', paddingRight: '0.625rem', height: '42px', borderRadius: '8px', border: '1px solid var(--border)', background: '#f8fafc', width: '100%', fontSize: '0.9rem' }}
                                placeholder="Cari nama, ID sambungan, meter, rute..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                            />
                            <button type="button" className="btn btn-primary" onClick={applySearch} style={{ height: '42px', padding: '0 1rem', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                                Cari
                            </button>
                        </div>
                    </div>
                </div>

                <div className="table-container" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
                    <table className="customer-table">
                        <thead>
                            <tr>
                                {displayedColumnIds.map(colId => {
                                    const col = ALL_COLUMNS.find(c => c.id === colId);
                                    if (!col) return null;
                                    const isCentered = colId === 'id' || colId === 'active_date';
                                    const style = { minWidth: colId === 'id' ? '70px' : colId === 'no_ktp' ? '160px' : colId === 'nama' ? '200px' : colId === 'alamat' ? '250px' : colId === 'telepon' ? '130px' : colId === 'active_date' ? '120px' : colId === 'update_date' ? '150px' : '120px', textAlign: isCentered ? 'center' : 'left' };
                                    return <th key={colId} style={style}>{col.label}</th>;
                                })}
                                <th className="no-print sticky-col-right" style={{ width: '100px', minWidth: '100px', textAlign: 'center', background: '#f8fafc', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={displayedColumnIds.length + 1} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-light)' }}>Memuat data...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={displayedColumnIds.length + 1} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                        {searchTerm ? `Tidak ditemukan hasil untuk "${searchTerm}"` : 'Tidak ada data pelanggan.'}
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer, index) => (
                                    <tr key={customer.id}>
                                        {displayedColumnIds.map(colId => {
                                            const col = ALL_COLUMNS.find(c => c.id === colId);
                                            if (!col) return null;
                                            const value = getCellValue(customer, colId);
                                            const isCentered = colId === 'id' || colId === 'active_date';
                                            let cellStyle = { textAlign: isCentered ? 'center' : 'left', padding: '0.625rem 0.75rem' };
                                            if (colId === 'id') cellStyle = { ...cellStyle, fontWeight: 600 };
                                            if (colId === 'no_ktp') cellStyle = { ...cellStyle, fontFamily: 'monospace', fontSize: '0.875rem' };
                                            if (colId === 'nama') cellStyle = { ...cellStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 };
                                            if (colId === 'alamat') cellStyle = { ...cellStyle, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
                                            if (colId === 'update_date') cellStyle = { ...cellStyle, fontSize: '0.8125rem', color: '#64748b' };
                                            return (
                                                <td key={colId} style={cellStyle} title={colId === 'nama' || colId === 'alamat' ? (value || '') : undefined}>
                                                    {value !== undefined && value !== null && value !== '' ? String(value) : '-'}
                                                </td>
                                            );
                                        })}
                                        <td className="no-print sticky-col-right" style={{ textAlign: 'center', background: 'inherit', padding: '0.625rem 0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                                                <button className="btn btn-outline" style={{ padding: '0.25rem', width: '28px', height: '28px', borderRadius: '6px' }} onClick={() => handleOpenModal(customer)}><Edit2 size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '0.25rem', width: '28px', height: '28px', borderRadius: '6px', color: '#ef4444' }} onClick={() => handleDeleteClick(customer.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

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
                            <select value={limit} onChange={handleLimitChange} style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.875rem', background: '#fff' }}>
                                {PAGE_SIZE_OPTIONS.map(n => (<option key={n} value={n}>{n}</option>))}
                            </select>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                per halaman. Total: <strong style={{ color: 'var(--text)' }}>{total}</strong> pelanggan
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

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Hapus Pelanggan?"
                message="Tindakan ini tidak dapat dibatalkan. Data pelanggan dan riwayat terkait mungkin terdampak."
                type="danger"
            />

            {
                isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ paddingBottom: '3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                                    {editingCustomer ? <Edit2 size={24} /> : <Plus size={24} />}
                                    {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
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
                                <div className="grid-6-col-responsive">
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>ID Tag</label>
                                        <input value={formData.id_tag} onChange={e => setFormData({ ...formData, id_tag: e.target.value })} placeholder="Contoh: TAG00001" />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>No. KTP</label>
                                        <input value={formData.no_ktp} onChange={e => setFormData({ ...formData, no_ktp: e.target.value })} placeholder="16 digit" />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>Tanggal Aktif</label>
                                        <input type="date" value={formData.active_date} onChange={e => setFormData({ ...formData, active_date: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 6' }}>
                                        <label>Nama Lengkap</label>
                                        <input required value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} placeholder="Nama pelanggan" />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 4' }}>
                                        <label>Alamat</label>
                                        <textarea rows="2" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} placeholder="Alamat lengkap"></textarea>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>Telepon</label>
                                        <input value={formData.telepon} onChange={e => setFormData({ ...formData, telepon: e.target.value })} placeholder="Nomor telepon" />
                                    </div>
                                </div>
                                <div style={{
                                    borderTop: '1px solid #f1f5f9',
                                    marginTop: '2rem',
                                    paddingTop: '1.5rem',
                                    paddingBottom: '1rem',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '1rem'
                                }}>
                                    <button type="button" className="btn btn-outline" style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', fontWeight: 600, minWidth: '100px' }} onClick={handleCloseModal}>Batal</button>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '0.625rem 2rem', borderRadius: '8px', fontWeight: 600, minWidth: '160px', boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)' }}>
                                        {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

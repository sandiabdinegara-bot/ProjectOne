import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, User, X, Save, Download, FileSpreadsheet, FileText, Printer, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, Users, Camera, List, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import SearchableSelect from './common/SearchableSelect';
import ConfirmModal from './ConfirmModal';
import Swal from 'sweetalert2';

import { BASE_URL, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../config';
import { fetchWithAuth } from '../api';

const API_URL = `${BASE_URL}/petugas`;
const API_BASE_URL = BASE_URL;

const ALL_COLUMNS = [
    { id: 'id', label: 'ID' },
    { id: 'nik', label: 'NIK' },
    { id: 'ktp', label: 'NO. KTP' },
    { id: 'kode_cabang', label: 'CABANG' },
    { id: 'kode_rute', label: 'RUTE' },
    { id: 'nama', label: 'NAMA PETUGAS' },
    { id: 'foto_petugas', label: 'FOTO' },
    { id: 'alamat', label: 'ALAMAT' },
    { id: 'telepon', label: 'NO. TELEPON' },
    { id: 'tgl_masuk', label: 'TGL MASUK' },
    { id: 'tgl_keluar', label: 'TGL KELUAR' },
    { id: 'status_aktif', label: 'STATUS' },
    { id: 'update_date', label: 'LAST UPDATE' }
];

const DEFAULT_COLUMNS = ['id', 'nik', 'ktp', 'foto_petugas', 'kode_cabang', 'nama', 'telepon', 'status_aktif'];

export default function OfficerManagement() {
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(() => {
        const saved = localStorage.getItem('pdam_petugas_page_size');
        return saved ? parseInt(saved, 10) : DEFAULT_PAGE_SIZE;
    });
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editingOfficer, setEditingOfficer] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        nik: '', nama: '', alamat: '', telepon: '', ktp: '',
        tgl_masuk: '', tgl_keluar: '', kode_cabang: '', kode_rute: [],
        foto_petugas: '', status_aktif: 'Aktif'
    });
    const [branches, setBranches] = useState([]);
    const [routes, setRoutes] = useState([]);

    const [isRouteSelectOpen, setIsRouteSelectOpen] = useState(false);
    const [routeSearch, setRouteSearch] = useState('');

    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('pdam_visible_columns_petugas');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    const columnMenuRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('pdam_visible_columns_petugas', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        localStorage.setItem('pdam_petugas_page_size', String(limit));
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

    useEffect(() => {
        if (formData.kode_cabang) {
            fetchRoutes(formData.kode_cabang);
        } else {
            setRoutes([]);
        }
    }, [formData.kode_cabang]);

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

    const fetchRoutes = async (branchCode) => {
        try {
            const res = await fetchWithAuth(`./api/branch_routes.php?kode_cabang=${branchCode}`);
            const data = await res.json();
            const assignedRoutes = data.filter(r => r.assigned).map(r => ({ kode_rute: r.kode_rute, rute: r.rute }));
            setRoutes(Array.isArray(assignedRoutes) ? assignedRoutes : []);
        } catch (err) {
            console.error('Failed to fetch routes:', err);
        }
    };

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                Swal.fire('Error', 'Ukuran foto maksimal 2MB', 'error');
                return;
            }

            setIsUploading(true);
            setUploadProgress(0);

            const reader = new FileReader();
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    reader.onloadend = () => {
                        setFormData(prev => ({ ...prev, foto_petugas: reader.result }));
                        setEditingOfficer(prev => ({ ...prev, selectedFile: file }));
                        setTimeout(() => {
                            setIsUploading(false);
                            setUploadProgress(0);
                        }, 500);
                    };
                    reader.readAsDataURL(file);
                }
                setUploadProgress(progress);
            }, 100);
        }
    };

    const fetchOfficers = useCallback(async (pageNum, pageLimit, search) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', String(pageNum));
            params.set('limit', String(pageLimit));
            if (search && search.trim()) params.set('search', search.trim());
            const res = await fetchWithAuth(`${API_URL}?${params.toString()}`);
            const json = await res.json();
            if (Array.isArray(json)) {
                setOfficers(json);
                setTotal(json.length);
                setTotalPages(1);
            } else {
                setOfficers(json.data || []);
                setTotal(json.total ?? 0);
                setPage(json.page ?? pageNum);
                setTotalPages(json.totalPages ?? (Math.ceil((json.total || 0) / pageLimit) || 1));
            }
        } catch (err) {
            console.error('Failed to fetch officers:', err);
            showNotification('Gagal memuat data petugas', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOfficers(page, limit, searchTerm);
    }, [page, limit, searchTerm, fetchOfficers]);

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

    const handleOpenModal = (officer = null) => {
        if (officer) {
            setEditingOfficer(officer);
            setFormData({
                nik: officer.nik || '',
                nama: officer.nama || '',
                alamat: officer.alamat || '',
                telepon: officer.telepon || '',
                ktp: officer.ktp || '',
                tgl_masuk: officer.tgl_masuk || '',
                tgl_keluar: officer.tgl_keluar || '',
                kode_cabang: officer.kode_cabang || '',
                kode_rute: Array.isArray(officer.kode_rute) ? officer.kode_rute : (officer.kode_rute ? [officer.kode_rute] : []),
                foto_petugas: officer.foto_petugas || '',
                status_aktif: officer.status_aktif || 'Aktif'
            });
        } else {
            setEditingOfficer(null);
            setFormData({
                nik: '', nama: '', alamat: '', telepon: '', ktp: '',
                tgl_masuk: new Date().toISOString().split('T')[0],
                tgl_keluar: '', kode_cabang: '', kode_rute: [],
                foto_petugas: '', status_aktif: 'Aktif'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOfficer(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isUpdate = !!editingOfficer;
        const url = isUpdate ? `${API_URL}/${editingOfficer.id}` : API_URL;
        const method = isUpdate ? 'PATCH' : 'POST';

        const body = new FormData();
        body.append('nik', formData.nik);
        body.append('nama', formData.nama);
        body.append('alamat', formData.alamat);
        body.append('telepon', formData.telepon);
        body.append('ktp', formData.ktp);
        body.append('tgl_masuk', formData.tgl_masuk);
        body.append('tgl_keluar', formData.tgl_keluar);
        body.append('kode_cabang', formData.kode_cabang);
        body.append('kode_rute', Array.isArray(formData.kode_rute) ? formData.kode_rute.join(',') : (formData.kode_rute || ''));
        body.append('status_aktif', formData.status_aktif);
        if (editingOfficer?.selectedFile) {
            body.append('foto_petugas', editingOfficer.selectedFile);
        } else {
            body.append('foto_petugas', formData.foto_petugas || '');
        }

        try {
            setLoading(true);
            const res = await fetchWithAuth(url, { method, body });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) {
                showNotification('Token tidak valid atau kedaluwarsa', 'error');
                return;
            }
            if (res.status === 201 || res.status === 200) {
                fetchOfficers(page, limit, searchTerm);
                handleCloseModal();
                showNotification(isUpdate ? 'Petugas berhasil diperbarui' : 'Petugas berhasil ditambahkan');
            } else if (data.error) {
                showNotification(data.error, 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Gagal menyimpan data petugas', 'error');
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
                showNotification('Data petugas tidak ditemukan', 'error');
                setIsConfirmOpen(false);
                setDeletingId(null);
                fetchOfficers(page, limit, searchTerm);
                return;
            }
            if (res.status === 200) {
                setIsConfirmOpen(false);
                setDeletingId(null);
                fetchOfficers(page, limit, searchTerm);
                showNotification('Petugas berhasil dihapus');
            } else {
                showNotification(data.error || 'Gagal menghapus petugas', 'error');
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
        const cols = visibleColumns.filter(c => c !== 'foto_petugas');
        if (cols.length) params.set('columns', cols.join(','));
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
            link.download = `data_petugas_${new Date().toISOString().split('T')[0]}.csv`;
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
            link.download = `data_petugas_${new Date().toISOString().split('T')[0]}.xlsx`;
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
            link.download = `data_petugas_${new Date().toISOString().split('T')[0]}.pdf`;
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
                    .customer-table {
                        width: 100%;
                        border-collapse: separate; /* Recommended for sticky headers */
                        border-spacing: 0;
                    }
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

                        .sticky-col-left {
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
                        Data Petugas
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Kelola daftar petugas pencatat meter lapangan</p>
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
                        <span className="hide-mobile">Tambah Petugas</span>
                    </button>
                </div>
            </header>

            <div className="card">
                <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: '300px' }}>
                        {/* Column Toggle */}
                        <div style={{ position: 'relative' }} ref={columnMenuRef}>
                            <button className="btn btn-outline" onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                                style={{
                                    height: '42px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem',
                                    background: isColumnMenuOpen ? '#f1f5f9' : '#f8fafc',
                                    border: `1px solid ${isColumnMenuOpen ? 'var(--primary)' : 'var(--border)'}`,
                                    color: isColumnMenuOpen ? 'var(--primary)' : 'var(--text)', borderRadius: '8px',
                                    fontWeight: 600
                                }}>
                                <SlidersHorizontal size={18} /><span>Pilih Kolom</span>
                            </button>
                            {isColumnMenuOpen && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000, background: 'white',
                                    border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    padding: '1.25rem', minWidth: '240px', maxHeight: '400px',
                                    display: 'flex', flexDirection: 'column'
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
                                style={{ paddingLeft: '2.5rem', paddingRight: '0.625rem', height: '42px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', width: '100%', background: '#f8fafc' }}
                                placeholder="Cari nama, NIK, alamat, cabang..."
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

                <div className="table-container" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto', margin: '1rem -1rem 0', width: 'calc(100% + 2rem)' }}>
                    <table className="customer-table">
                        <thead>
                            <tr>
                                <th className="sticky-col-left" style={{ width: '60px', textAlign: 'center' }}>NO</th>
                                {visibleColumns.map(colId => {
                                    const col = ALL_COLUMNS.find(c => c.id === colId);
                                    if (!col) return null;

                                    // Define specific styles for each column
                                    let style = {
                                        padding: '0.625rem 0.75rem',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        background: '#f8fafc'
                                    };

                                    switch (colId) {
                                        case 'id':
                                            style = { ...style, minWidth: '60px', textAlign: 'center' };
                                            break;
                                        case 'nik':
                                            style = { ...style, minWidth: '110px', textAlign: 'left' };
                                            break;
                                        case 'ktp':
                                            style = { ...style, minWidth: '130px', textAlign: 'left' };
                                            break;
                                        case 'kode_cabang':
                                            style = { ...style, minWidth: '80px', textAlign: 'center' };
                                            break;
                                        case 'kode_rute':
                                            style = { ...style, minWidth: '80px', textAlign: 'center' };
                                            break;
                                        case 'nama':
                                            style = { ...style, minWidth: '220px', textAlign: 'left' };
                                            break;
                                        case 'foto_petugas':
                                            style = { ...style, minWidth: '80px', textAlign: 'center' };
                                            break;
                                        case 'alamat':
                                            style = { ...style, minWidth: '280px', textAlign: 'left' };
                                            break;
                                        case 'telepon':
                                            style = { ...style, minWidth: '120px', textAlign: 'left' };
                                            break;
                                        case 'tgl_masuk':
                                        case 'tgl_keluar':
                                            style = { ...style, minWidth: '110px', textAlign: 'center' };
                                            break;
                                        case 'status_aktif':
                                            style = { ...style, minWidth: '100px', textAlign: 'center' };
                                            break;
                                        case 'update_date':
                                            style = { ...style, minWidth: '150px', textAlign: 'left' };
                                            break;
                                        default:
                                            style = { ...style, minWidth: '150px', textAlign: 'left' };
                                    }

                                    return <th key={colId} style={style}>{col.label}</th>
                                })}
                                <th className="no-print sticky-col-right" style={{ width: '100px', textAlign: 'center', background: '#f8fafc', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AKSI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={visibleColumns.length + 2} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Memuat data...</td></tr>
                            ) : officers.length === 0 ? (
                                <tr><td colSpan={visibleColumns.length + 2} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>{searchTerm ? `Tidak ditemukan hasil untuk "${searchTerm}"` : 'Tidak ada data petugas.'}</td></tr>
                            ) : (
                                officers.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="sticky-col-left" style={{ textAlign: 'center', fontWeight: 500, color: '#64748b', padding: '12px 16px' }}>{(page - 1) * limit + index + 1}</td>
                                        {visibleColumns.map(colId => {
                                            const cellPadding = '12px 16px';

                                            if (colId === 'status_aktif') {
                                                return (
                                                    <td key={colId} style={{ textAlign: 'center', padding: cellPadding }}>
                                                        <span className={`badge ${item.status_aktif === 'Aktif' ? 'badge-active' : 'badge-inactive'}`}>
                                                            {item[colId] || '-'}
                                                        </span>
                                                    </td>
                                                );
                                            }
                                            if (colId === 'foto_petugas') {
                                                return (
                                                    <td key={colId} style={{ width: '80px', textAlign: 'center', padding: cellPadding }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '1px solid #e2e8f0', color: '#94a3b8', overflow: 'hidden', cursor: item.foto_petugas ? 'pointer' : 'default' }}
                                                            onClick={() => item.foto_petugas && setPreviewImage(item.foto_petugas)}
                                                            title={item.foto_petugas ? 'Klik untuk memperbesar' : 'Tidak ada foto'}>
                                                            {item.foto_petugas ? (
                                                                <img
                                                                    src={item.foto_petugas && item.foto_petugas.startsWith('/') ? `${API_BASE_URL}${item.foto_petugas}` : item.foto_petugas}
                                                                    alt="Foto"
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.style.display = 'none';
                                                                        e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>';
                                                                    }}
                                                                />
                                                            ) : <Camera size={16} />}
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            // Center align specific columns
                                            const isCentered = ['id', 'kode_cabang', 'kode_rute', 'tgl_masuk', 'tgl_keluar'].includes(colId);

                                            return <td key={colId} style={{
                                                textAlign: isCentered ? 'center' : 'left',
                                                padding: cellPadding,
                                                fontWeight: colId === 'nama' ? 600 : 400,
                                                color: colId === 'nama' ? '#334155' : 'inherit'
                                            }}>{
                                                    colId === 'kode_rute'
                                                        ? (Array.isArray(item[colId]) && item[colId].length > 0
                                                            ? (item[colId].length > 1 ? `${item[colId][0]},` : item[colId][0])
                                                            : <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>Belum ada Rute</span>)
                                                        : (item[colId] || '-')
                                                }</td>
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
                                per halaman. Total: <strong style={{ color: 'var(--text)' }}>{total}</strong> petugas
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

            {/* Image Preview Modal */}
            {previewImage && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
                    onClick={() => setPreviewImage(null)}>
                    <img src={previewImage && previewImage.startsWith('/') ? `${API_BASE_URL}${previewImage}` : previewImage} alt="Full Preview" style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} />
                    <button style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        onClick={() => setPreviewImage(null)}>
                        <X size={24} color="#000" />
                    </button>
                </div>
            )}

            {/* Modal Form */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideUp 0.3s ease-out' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {editingOfficer ? <Edit2 size={24} color="var(--primary)" /> : <Plus size={24} color="var(--primary)" />}
                                {editingOfficer ? 'Edit Petugas' : 'Tambah Petugas'}
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
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#64748b'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                            <div className="grid-6-col-responsive">
                                <div className="form-group" style={{ gridColumn: 'span 6' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{
                                                width: '180px',
                                                height: '140px',
                                                border: '2px dashed #cbd5e1',
                                                borderRadius: '16px',
                                                padding: '0',
                                                background: '#f8fafc',
                                                transition: 'all 0.3s',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                                onClick={() => document.getElementById('foto-upload').click()}
                                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = '#f1f5f9'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}>

                                                <input id="foto-upload" type="file" accept="image/*" style={{ display: 'none' }}
                                                    onChange={handleFileChange}
                                                />

                                                {formData.foto_petugas ? (
                                                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                                        <img src={formData.foto_petugas} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '1rem' }}>
                                                            <span style={{ color: 'white', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <Camera size={16} /> Ganti Foto
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                                                        <Camera size={32} />
                                                        <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 500 }}>Ambil Foto</span>
                                                    </div>
                                                )}

                                                {/* Upload Progress Overlay */}
                                                {isUploading && (
                                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                                        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
                                                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Mengupload... {Math.round(uploadProgress)}%</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{
                                                background: 'rgba(30, 41, 59, 0.7)', color: 'white', fontSize: '0.65rem', padding: '6px', fontWeight: 600, letterSpacing: '0.025em',
                                                borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', marginTop: '-24px', position: 'relative', zIndex: 5, width: '180px', marginInline: 'auto'
                                            }}>
                                                FOTO PETUGAS
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>NIK</label>
                                    <input type="number" className="input-field" placeholder="NIK Petugas" value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 4' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>Nama Lengkap</label>
                                    <input type="text" required className="input-field" placeholder="Nama Petugas" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 6' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>Alamat</label>
                                    <textarea rows="2" className="input-field" placeholder="Alamat Lengkap" value={formData.alamat} onChange={(e) => setFormData({ ...formData, alamat: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}></textarea>
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>No. Telepon</label>
                                    <input type="text" className="input-field" placeholder="08xxx" value={formData.telepon} onChange={(e) => setFormData({ ...formData, telepon: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>No. KTP</label>
                                    <input type="text" className="input-field" placeholder="Nomor KTP" value={formData.ktp} onChange={(e) => setFormData({ ...formData, ktp: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>Status Aktif</label>
                                    <select className="input-field" value={formData.status_aktif} onChange={(e) => setFormData({ ...formData, status_aktif: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <option value="Aktif">Aktif</option>
                                        <option value="Tidak Aktif">Tidak Aktif</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>Tanggal Masuk</label>
                                    <input type="date" className="input-field" value={formData.tgl_masuk} onChange={(e) => setFormData({ ...formData, tgl_masuk: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>Tanggal Keluar</label>
                                    <input type="date" className="input-field" value={formData.tgl_keluar} onChange={(e) => setFormData({ ...formData, tgl_keluar: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div style={{ display: 'contents' }}>
                                    <SearchableSelect
                                        label="Cabang"
                                        containerStyle={{ gridColumn: 'span 3', marginBottom: 0 }}
                                        options={branches.map(b => ({ value: b.kode_cabang, label: b.cabang }))}
                                        value={formData.kode_cabang}
                                        onChange={(e) => setFormData({ ...formData, kode_cabang: e.target.value, kode_rute: [] })}
                                        placeholder="Pilih Cabang"
                                        searchPlaceholder="Cari cabang..."
                                        required={true}
                                    />

                                    {/* Route Selection */}
                                    <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b' }}>Rute yang Ditangani</label>
                                        <button
                                            type="button"
                                            disabled={!formData.kode_cabang}
                                            onClick={() => setIsRouteSelectOpen(true)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                background: formData.kode_cabang ? 'white' : '#f8fafc',
                                                textAlign: 'left',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: formData.kode_cabang ? 'pointer' : 'not-allowed',
                                                color: formData.kode_cabang ? '#334155' : '#94a3b8'
                                            }}
                                        >
                                            <span>{formData.kode_rute.length > 0 ? `${formData.kode_rute.length} Rute Dipilih` : (formData.kode_cabang ? 'Pilih Rute' : 'Pilih Cabang Dahulu')}</span>
                                            <List size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={handleCloseModal} className="btn btn-outline" style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}>Batal</button>
                                <button type="submit" className="btn btn-primary" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.625rem 2rem',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
                                }}>
                                    <Save size={18} /> Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Route Selection Modal */}
            {isRouteSelectOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
                    <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        {/* Header */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Pilih Rute</h3>
                            <button onClick={() => setIsRouteSelectOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Search */}
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
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
                            <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                                {formData.kode_rute.length} dari {routes.length} rute dipilih
                            </div>
                        </div>

                        {/* Route List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
                            {routes.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                    Tidak ada rute tersedia untuk cabang ini
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {routes
                                        .filter(r =>
                                            r.kode_rute.toLowerCase().includes(routeSearch.toLowerCase()) ||
                                            r.rute.toLowerCase().includes(routeSearch.toLowerCase())
                                        )
                                        .map(route => (
                                            <label
                                                key={route.kode_rute}
                                                className={`route-checkbox-item ${formData.kode_rute.includes(route.kode_rute) ? 'selected' : ''}`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    padding: '0.75rem',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.kode_rute.includes(route.kode_rute)}
                                                    onChange={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            kode_rute: prev.kode_rute.includes(route.kode_rute)
                                                                ? prev.kode_rute.filter(r => r !== route.kode_rute)
                                                                : [...prev.kode_rute, route.kode_rute]
                                                        }));
                                                    }}
                                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                                />
                                                <div style={{ flex: 1, pointerEvents: 'none' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{route.kode_rute}</div>
                                                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{route.rute}</div>
                                                </div>
                                            </label>
                                        ))
                                    }
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsRouteSelectOpen(false)} className="btn btn-primary" style={{
                                padding: '0.625rem 2rem',
                                borderRadius: '8px',
                                fontWeight: 600,
                                boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
                            }}>
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Hapus Petugas?"
                message="Tindakan ini tidak dapat dibatalkan. Data petugas dan wilayah yang terkait mungkin terdampak."
                type="danger"
            />

            {/* CSS for route checkbox items */}
            <style dangerouslySetInnerHTML={{
                __html: `
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
            `}} />
        </div>
    );
}

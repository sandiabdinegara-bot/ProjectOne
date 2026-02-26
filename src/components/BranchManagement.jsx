import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, CheckCircle, AlertCircle, Loader2, List, X, Download, FileSpreadsheet, FileText, Printer, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, RefreshCw, ZoomIn, ZoomOut, Filter } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import * as XLSX from 'xlsx';

const API_URL = './api/branches.php';

const ALL_COLUMNS = [
    { id: 'kode_cabang', label: 'Kode Cabang' },
    { id: 'cabang', label: 'Nama Cabang' },
    { id: 'alamat', label: 'Alamat' },
    { id: 'telepon', label: 'Telepon' }
];

const DEFAULT_COLUMNS = ['kode_cabang', 'cabang', 'alamat', 'telepon'];

export default function BranchManagement({ isReport = false, onReportClose }) {
    const [branches, setBranches] = useState([]);
    const [scale, setScale] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const reportPaperRef = React.useRef(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
        if (sortConfig.direction === 'asc') return <ArrowUp size={14} />;
        return <ArrowDown size={14} />;
    };

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

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const res = await fetch(API_URL);
            const data = await res.json();
            setBranches(data);
        } catch (err) {
            console.error('Failed to fetch:', err);
            showNotification('Gagal mengambil data cabang', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
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
        const method = editingBranch ? 'PUT' : 'POST';
        const url = editingBranch ? `${API_URL}?id=${editingBranch.id}` : API_URL;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.message) {
                fetchBranches();
                handleCloseModal();
                showNotification(editingBranch ? 'Cabang berhasil diperbarui' : 'Cabang berhasil ditambahkan');
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
            const res = await fetch(`${API_URL}?id=${deletingId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.message) {
                fetchBranches();
                showNotification('Cabang berhasil dihapus');
            } else {
                showNotification('Gagal menghapus cabang', 'error');
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
            const res = await fetch(`./api/branch_routes.php?kode_cabang=${branch.kode_cabang}`);
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
            const res = await fetch('./api/branch_routes.php', {
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

    // Export Logic
    const exportToCSV = () => {
        const visibleCols = ALL_COLUMNS.filter(col => visibleColumns.includes(col.id));
        const headers = visibleCols.map(c => c.label);
        const rows = filteredBranches.map(b => visibleCols.map(col => {
            if (col.id === 'kode_cabang') return `="${b[col.id]}"`;
            return b[col.id] || '-';
        }));

        const csvContent = [headers, ...rows].map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `data_cabang_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToExcel = () => {
        const visibleCols = ALL_COLUMNS.filter(col => visibleColumns.includes(col.id));
        const data = filteredBranches.map(b => {
            const item = {};
            visibleCols.forEach(col => {
                item[col.label] = b[col.id] || '-';
            });
            return item;
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Cabang");
        XLSX.writeFile(workbook, `data_cabang_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        const url = `./api/branch_report_pdf.php?t=${new Date().getTime()}&search=${encodeURIComponent(searchTerm)}`;
        window.open(url, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = (value) => {
        if (value === '100%') setScale(1);
        else if (value === 'Lebar Halaman') {
            const containerWidth = reportPaperRef.current?.parentElement?.clientWidth || 0;
            const paperWidth = 297 * 3.7795275591; // mm to px
            setScale(containerWidth / (paperWidth + 80));
        } else if (value === 'Satu Halaman Penuh') {
            const containerHeight = window.innerHeight - 200;
            const paperHeight = 210 * 3.7795275591;
            setScale(containerHeight / paperHeight);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const filteredBranches = React.useMemo(() => {
        let items = branches.filter(b =>
            (b.cabang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.kode_cabang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.alamat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.telepon || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle null/undefined
                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                // Handle numbers
                if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue)) && isFinite(aValue) && isFinite(bValue)) {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                } else {
                    aValue = String(aValue).toLowerCase();
                    bValue = String(bValue).toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return items;
    }, [branches, searchTerm, sortConfig]);

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes slideDown {
                        from { transform: translate(-50%, -100%); }
                        to { transform: translate(-50%, 0); }
                    }

                    @media print {
                        .no-print { display: none !important; }
                        .report-header-only { display: block !important; }
                        .card { border: none !important; box-shadow: none !important; padding: 0 !important; }
                        table { width: 100% !important; border-collapse: collapse !important; }
                        th { background: #0ea5e9 !important; color: white !important; -webkit-print-color-adjust: exact; }
                        td, th { border: 1px solid #e2e8f0 !important; padding: 8px !important; }
                        @page { size: A4 landscape; margin: 1.5cm; }
                    }
                    `}
            </style>

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

            {/* Report Viewer Toolbar */}
            {isReport && (
                <div className="report-toolbar no-print" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1.5rem',
                    padding: '0.75rem 2rem',
                    background: '#0f172a',
                    borderBottom: '1px solid #1e293b',
                    position: 'sticky',
                    top: '0',
                    zIndex: 1100,
                    margin: '-1.5rem -1.5rem 2rem -1.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '1rem', borderRight: '1px solid #334155' }}>
                        <button className="toolbar-btn" onClick={handlePrint} title="Print"><Printer size={18} /></button>
                        <button className="toolbar-btn" onClick={exportToPDF} title="Export PDF"><FileText size={18} /></button>
                        <button className="toolbar-btn" onClick={exportToExcel} title="Export Excel"><FileSpreadsheet size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', borderRight: '1px solid #334155' }}>
                        <button className="toolbar-btn" title="Halaman Pertama"><ChevronLeft size={18} style={{ opacity: 0.5 }} /><ChevronLeft size={18} style={{ marginLeft: '-12px', opacity: 0.5 }} /></button>
                        <button className="toolbar-btn" title="Halaman Sebelumnya"><ChevronLeft size={18} style={{ opacity: 0.5 }} /></button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                            <input type="text" value="1" readOnly style={{ width: '40px', textAlign: 'center', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '4px', height: '28px' }} />
                            <span>/ 1</span>
                        </div>
                        <button className="toolbar-btn" title="Halaman Selanjutnya"><ChevronRight size={18} style={{ opacity: 0.5 }} /></button>
                        <button className="toolbar-btn" title="Halaman Terakhir"><ChevronRight size={18} style={{ opacity: 0.5 }} /><ChevronRight size={18} style={{ marginLeft: '-12px', opacity: 0.5 }} /></button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', borderRight: '1px solid #334155' }}>
                        <button className="toolbar-btn" title="Zoom Out" onClick={handleZoomOut}><ZoomOut size={18} /></button>
                        <button className="toolbar-btn" title="Zoom In" onClick={handleZoomIn}><ZoomIn size={18} /></button>
                        <select
                            onChange={(e) => handleResetZoom(e.target.value)}
                            value={scale === 1 ? '100%' : ''}
                            style={{ background: '#0f172a', border: '1px solid #334155', color: 'white', fontSize: '0.75rem', borderRadius: '4px', padding: '2px 8px', height: '28px' }}
                        >
                            <option value="">{Math.round(scale * 100)}%</option>
                            <option value="100%">100%</option>
                            <option value="Lebar Halaman">Lebar Halaman</option>
                            <option value="Satu Halaman Penuh">Satu Halaman Penuh</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button className="toolbar-btn" title="Fullscreen" onClick={toggleFullscreen}>
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                        <button className="toolbar-btn" onClick={() => window.location.reload()} title="Refresh"><RefreshCw size={18} /></button>
                        <button className="toolbar-btn" onClick={onReportClose} title="Tutup Viewer"><X size={18} /></button>
                        <div style={{ position: 'relative' }}>
                            <button className="toolbar-btn" onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)} title="Filter Kolom"><Filter size={18} /></button>
                            {isColumnMenuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    width: '200px',
                                    zIndex: 1200,
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                }}>
                                    <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #334155', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                                        Tampilkan Kolom
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        {ALL_COLUMNS.map(col => (
                                            <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', fontSize: '0.8125rem', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns.includes(col.id)}
                                                    onChange={() => toggleColumn(col.id)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                {col.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <style>
                        {`
                        .toolbar-btn {
                            background: transparent;
                            border: none;
                            color: #94a3b8;
                            padding: 6px;
                            border-radius: 4px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s;
                        }
                        .toolbar-btn:hover {
                            background: #334155;
                            color: white;
                        }
                        .toolbar-btn:active {
                            background: #0ea5e9;
                        }
                        `}
                    </style>
                </div>
            )}

            {!isReport && (
                <header className="header" style={{ marginBottom: '2.5rem' }}>
                    <div className="no-print">
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
                            <button className="btn btn-outline" onClick={exportToCSV} title="Export CSV" style={{ height: '42px', width: '42px', padding: 0, borderRadius: '8px' }}>
                                <Download size={18} />
                            </button>
                            <button className="btn btn-outline" onClick={exportToExcel} title="Export Excel" style={{ height: '42px', width: '42px', padding: 0, borderRadius: '8px' }}>
                                <FileSpreadsheet size={18} />
                            </button>
                            <button className="btn btn-outline" onClick={exportToPDF} title="Export PDF" style={{ height: '42px', width: '42px', padding: 0, borderRadius: '8px' }}>
                                <FileText size={18} />
                            </button>
                            <button className="btn btn-outline" onClick={handlePrint} title="Print" style={{ height: '42px', width: '42px', padding: 0, borderRadius: '8px' }}>
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
            )}

            <div style={{
                background: isReport ? '#334155' : 'transparent',
                margin: isReport ? '-1.5rem' : '0',
                padding: isReport ? '3rem 1.5rem' : '0',
                minHeight: isReport ? 'calc(100vh - 100px)' : '0',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: isReport ? 'center' : 'flex-start',
                overflowY: isReport ? 'auto' : 'hidden'
            }}>
                <div
                    ref={reportPaperRef}
                    className={isReport ? "report-paper" : "card"}
                    style={{
                        padding: isReport ? '2.48rem' : '1.5rem', // A4 proportionate padding
                        background: 'white',
                        borderRadius: isReport ? '2px' : '16px',
                        border: isReport ? 'none' : '1px solid var(--border)',
                        width: isReport ? '297mm' : '100%',
                        minHeight: isReport ? '210mm' : 'auto',
                        boxShadow: isReport ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        position: 'relative',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        transform: isReport ? `scale(${scale})` : 'none',
                        transformOrigin: 'top center',
                        height: isReport ? 'auto' : '100%',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                    {isReport && (
                        <div className="report-content-header" style={{ marginBottom: '3rem', borderBottom: '2px solid #334155', paddingBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', marginBottom: '2rem' }}>
                                <div style={{ background: '#0ea5e9', padding: '1rem', borderRadius: '12px' }}>
                                    <Building2 size={48} color="white" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ margin: 0, fontSize: '2.25rem', color: '#0ea5e9', fontWeight: 900, letterSpacing: '-0.025em' }}>PDAM SMART Indramayu</h2>
                                    <p style={{ margin: '0.25rem 0', color: '#475569', fontSize: '1.125rem', fontWeight: 600 }}>Sistem Informasi Manajemen Pelanggan Terintegrasi</p>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Jl. Unit Pelayanan No. 45, Kab. Indramayu | Telp: (0234) 123456</p>
                                </div>
                                <div style={{ textAlign: 'right', borderLeft: '1px solid #e2e8f0', paddingLeft: '2rem' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Kode Dokumen</p>
                                    <p style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>RPT-BRC-001</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', position: 'relative' }}>
                                <div style={{ height: '4px', background: '#0ea5e9', width: '60px', margin: '0 auto 1.5rem' }}></div>
                                <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>LAPORAN DATA CABANG</h1>
                                <p style={{ margin: '0.75rem 0', color: '#64748b', fontWeight: 600, fontSize: '1rem' }}>
                                    Dicetak pada: <span style={{ color: '#0ea5e9' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </p>
                            </div>
                        </div>
                    )}
                    {!isReport && (
                        <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
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

                            <div style={{ position: 'relative', flex: '0 1 350px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    style={{
                                        paddingLeft: '2.5rem',
                                        paddingRight: searchTerm ? '2.5rem' : '0.625rem',
                                        height: '42px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        fontSize: '0.9rem',
                                        width: '100%',
                                        background: '#f8fafc'
                                    }}
                                    placeholder="Cari cabang, alamat atau telepon..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ padding: '8rem 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                            <p style={{ color: 'var(--text-light)', fontWeight: 500 }}>Memuat data cabang...</p>
                        </div>
                    ) : (
                        <div className="table-container" style={{ margin: 0, border: isReport ? '1px solid #e2e8f0' : 'none', flex: 1, overflow: 'auto', minHeight: 0 }}>
                            <table style={{ width: '100%', minWidth: isReport ? '100%' : '600px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: isReport ? '#f8fafc' : 'transparent' }}>
                                        <th style={{ width: '60px', padding: '1rem 0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: isReport ? '2px solid #e2e8f0' : 'none', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>NO</th>
                                        {visibleColumns.includes('kode_cabang') && (
                                            <th onClick={isReport ? null : () => handleSort('kode_cabang')} style={{ width: '130px', padding: '1rem 0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: isReport ? 'default' : 'pointer', userSelect: 'none', borderBottom: isReport ? '2px solid #e2e8f0' : 'none', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                    Kode Cabang {!isReport && getSortIcon('kode_cabang')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('cabang') && (
                                            <th onClick={isReport ? null : () => handleSort('cabang')} style={{ padding: '1rem 0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: isReport ? 'default' : 'pointer', userSelect: 'none', borderBottom: isReport ? '2px solid #e2e8f0' : 'none', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Nama Cabang {!isReport && getSortIcon('cabang')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('alamat') && (
                                            <th onClick={isReport ? null : () => handleSort('alamat')} style={{ padding: '1rem 0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: isReport ? 'default' : 'pointer', userSelect: 'none', borderBottom: isReport ? '2px solid #e2e8f0' : 'none', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Alamat {!isReport && getSortIcon('alamat')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('telepon') && (
                                            <th onClick={isReport ? null : () => handleSort('telepon')} style={{ width: '160px', padding: '1rem 0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: isReport ? 'default' : 'pointer', userSelect: 'none', borderBottom: isReport ? '2px solid #e2e8f0' : 'none', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Telepon {!isReport && getSortIcon('telepon')}
                                                </div>
                                            </th>
                                        )}
                                        {!isReport && <th style={{ width: '100px', padding: '0.625rem 0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBranches.length > 0 ? filteredBranches.map((branch, index) => (
                                        <tr key={branch.id} style={{ transition: 'background-color 0.2s', borderBottom: isReport ? '1px solid #e2e8f0' : 'none' }}>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 500, color: '#64748b', fontSize: '0.875rem', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{index + 1}</td>
                                            {visibleColumns.includes('kode_cabang') && (
                                                <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>
                                                    <span style={isReport ? {} : { background: '#f1f5f9', color: '#1e293b', padding: '0.2rem 0.625rem', borderRadius: '4px', fontSize: '0.8125rem', border: '1px solid #e2e8f0' }}>
                                                        {branch.kode_cabang}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.includes('cabang') && (
                                                <td style={{ padding: '0.75rem', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 500, borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{branch.cabang}</td>
                                            )}
                                            {visibleColumns.includes('alamat') && (
                                                <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.875rem', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>
                                                    <div style={isReport ? {} : { maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={branch.alamat}>
                                                        {branch.alamat || '-'}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.includes('telepon') && (
                                                <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.875rem', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{branch.telepon || '-'}</td>
                                            )}
                                            {!isReport && (
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
                                            )}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={visibleColumns.length + (isReport ? 1 : 2)} style={{ textAlign: 'center', padding: '5rem 0' }}>
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
                </div>
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


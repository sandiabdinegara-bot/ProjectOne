import React, { useState, useEffect, useRef } from 'react';
import SimpleImageViewer from './common/SimpleImageViewer';
import { Search, Plus, Edit2, Trash2, User, X, Save, Download, FileSpreadsheet, FileText, Printer, SlidersHorizontal, ChevronDown, Users, Camera, List, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, RefreshCw, ZoomIn, ZoomOut, Filter, Building2 } from 'lucide-react';
import SearchableSelect from './common/SearchableSelect';
import Pagination from './common/Pagination';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

import useImageRotator from '../hooks/useImageRotator';

const API_URL = './api/officers.php';
const API_BASE_URL = 'http://localhost'; // Base URL for absolute paths (XAMPP)

const ALL_COLUMNS = [
    { id: 'nik', label: 'NIK' },
    { id: 'ktp', label: 'NO. KTP' },
    { id: 'nama_cabang', label: 'CABANG' },
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

const DEFAULT_COLUMNS = [
    'nik', 'ktp', 'nama_cabang', 'kode_rute', 'nama', 'foto_petugas',
    'alamat', 'telepon', 'tgl_masuk', 'tgl_keluar', 'status_aktif', 'update_date'
];

export default function OfficerManagement({ isReport = false, onReportClose }) {
    const { saveRotation } = useImageRotator();
    const [officers, setOfficers] = useState([]);
    const [filteredOfficers, setFilteredOfficers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOfficer, setEditingOfficer] = useState(null);
    const [scale, setScale] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const reportPaperRef = React.useRef(null);
    const [previewImage, setPreviewImage] = useState(null);
    const tableContainerRef = useRef(null);
    const [formData, setFormData] = useState({
        nik: '', nama: '', alamat: '', telepon: '', ktp: '',
        tgl_masuk: '', tgl_keluar: '', kode_cabang: '', kode_rute: [],
        foto_petugas: '', status_aktif: 'Aktif'
    });
    const [branches, setBranches] = useState([]);
    const [routes, setRoutes] = useState([]);

    // Route Detail Modal State
    const [isRouteDetailModalOpen, setIsRouteDetailModalOpen] = useState(false);
    const [selectedOfficerRoutes, setSelectedOfficerRoutes] = useState(null);
    const [routeDetailSearch, setRouteDetailSearch] = useState('');
    const [modalPage, setModalPage] = useState(1);

    // Route Selection Modal State
    const [isRouteSelectOpen, setIsRouteSelectOpen] = useState(false);
    const [routeSearch, setRouteSearch] = useState('');

    // Feature States
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);
    const [searchCategory, setSearchCategory] = useState('nama');

    // Store all available routes for name lookup
    const [allRoutes, setAllRoutes] = useState({});

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
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('pdam_visible_columns_officers_v5');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    useEffect(() => {
        localStorage.setItem('pdam_visible_columns_officers_v5', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const columnMenuRef = useRef(null);
    const searchMenuRef = useRef(null);

    useEffect(() => {
        fetchOfficers();
        // Fetch all routes for lookup
        fetchAllRoutes();

        const handleClickOutside = (event) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
                setIsColumnMenuOpen(false);
            }
            if (searchMenuRef.current && !searchMenuRef.current.contains(event.target)) {
                setIsSearchMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        fetchBranches();
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchAllRoutes = async () => {
        try {
            // Use existing options API which queries the 'rute' table
            const res = await fetch('./api/options.php?type=rute');
            const data = await res.json();
            if (Array.isArray(data)) {
                // Create lookup object: { 'CODE': 'NAME' }
                const routeMap = {};
                data.forEach(r => {
                    routeMap[r.kode_rute] = r.rute;
                });
                setAllRoutes(routeMap);
            }
        } catch (err) {
            console.error('Failed to fetch all routes:', err);
        }
    };

    useEffect(() => {
        if (formData.kode_cabang) {
            fetchRoutes(formData.kode_cabang);
        } else {
            setRoutes([]);
        }
    }, [formData.kode_cabang]);

    const fetchBranches = async () => {
        try {
            const res = await fetch('./api/options.php?type=cabang');
            const data = await res.json();
            setBranches(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch branches:', err);
        }
    };

    const fetchRoutes = async (branchCode) => {
        try {
            const res = await fetch(`./api/branch_routes.php?kode_cabang=${branchCode}`);
            const data = await res.json();
            const assignedRoutes = data.filter(r => r.assigned).map(r => ({ kode_rute: r.kode_rute, rute: r.rute }));
            setRoutes(Array.isArray(assignedRoutes) ? assignedRoutes : []);
        } catch (err) {
            console.error('Failed to fetch routes:', err);
        }
    };

    useEffect(() => {
        const lower = searchTerm.toLowerCase();
        const filtered = officers.filter(item => {
            if (!searchTerm) return true;
            if (searchCategory === 'nama') return item.nama && item.nama.toLowerCase().includes(lower);
            if (searchCategory === 'nik') return item.nik && String(item.nik).includes(lower);
            if (searchCategory === 'alamat') return item.alamat && item.alamat.toLowerCase().includes(lower);
            return false;
        });
        setFilteredOfficers(filtered);
        setCurrentPage(1);
    }, [searchTerm, officers, searchCategory]);

    const sortedOfficers = React.useMemo(() => {
        let sortableItems = [...filteredOfficers];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle null/undefined
                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                // Handle numbers (as strings or numbers)
                if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue)) && isFinite(aValue) && isFinite(bValue)) {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                } else {
                    // String comparison (case-insensitive)
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
        return sortableItems;
    }, [filteredOfficers, sortConfig]);

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

    const fetchOfficers = async () => {
        try {
            setLoading(true);
            const res = await fetch(API_URL);
            const data = await res.json();
            setOfficers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch officers:', err);
            Swal.fire('Error', 'Gagal memuat data petugas', 'error');
        } finally {
            setLoading(false);
        }
    };

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

    const handleViewRoutes = (officer) => {
        const routeList = officer.kode_rute ? (Array.isArray(officer.kode_rute) ? officer.kode_rute : String(officer.kode_rute).split(',').map(r => r.trim()).filter(r => r)) : [];

        // Map codes to objects with names
        const enrichedRoutes = routeList.map(code => ({
            code: code,
            name: allRoutes[code] || '-'
        }));

        setSelectedOfficerRoutes({
            nama: officer.nama,
            routes: enrichedRoutes
        });
        setRouteDetailSearch('');
        setModalPage(1);
        setIsRouteDetailModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const body = new FormData();
        body.append('nik', formData.nik);
        body.append('nama', formData.nama);
        body.append('alamat', formData.alamat);
        body.append('telepon', formData.telepon);
        body.append('ktp', formData.ktp);
        body.append('tgl_masuk', formData.tgl_masuk);
        body.append('tgl_keluar', formData.tgl_keluar);
        body.append('kode_cabang', formData.kode_cabang);
        // Fix: Send multiple routes as array
        if (Array.isArray(formData.kode_rute)) {
            formData.kode_rute.forEach(r => body.append('kode_rute[]', r));
        } else if (formData.kode_rute) {
            body.append('kode_rute[]', formData.kode_rute);
        }
        body.append('status_aktif', formData.status_aktif);

        // If there's an existing photo string (URL) and no new file, we can send it as is, or backend will ignore it if we send nothing and logic handles it.
        // But cleaner is to send existing photo path if we are not replacing it.
        if (editingOfficer?.selectedFile) {
            body.append('foto_petugas', editingOfficer.selectedFile);
        } else {
            // Keep existing path if any
            body.append('foto_petugas', formData.foto_petugas || '');
        }

        const url = editingOfficer && editingOfficer.id ? `${API_URL}?id=${editingOfficer.id}` : API_URL;

        try {
            setLoading(true);
            const res = await fetch(url, {
                method: 'POST',
                body: body // Fetch sets Content-Type to multipart/form-data automatically
            });
            const data = await res.json();
            if (data.message) {
                Swal.fire('Sukses', editingOfficer ? 'Data petugas diperbarui' : 'Data petugas ditambahkan', 'success');
                setIsModalOpen(false);
                fetchOfficers();
            } else {
                throw new Error(data.error || 'Gagal menyimpan');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Gagal menyimpan data petugas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Hapus Petugas?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.message) {
                    Swal.fire('Terhapus!', 'Data petugas telah dihapus.', 'success');
                    fetchOfficers();
                } else {
                    throw new Error(data.error);
                }
            } catch (err) {
                Swal.fire('Gagal!', err.message, 'error');
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Export Functions
    const exportToCSV = () => {
        const visibleCols = ALL_COLUMNS.filter(col => visibleColumns.includes(col.id) && col.id !== 'foto_petugas');
        const headers = visibleCols.map(c => c.label);
        const rows = filteredOfficers.map(item => visibleCols.map(c => {
            if (['nik', 'ktp'].includes(c.id)) return `="${item[c.id]}"`;
            if (['tgl_masuk', 'tgl_keluar', 'update_date'].includes(c.id)) {
                return formatDate(item[c.id]);
            }
            return item[c.id] || '-';
        }));

        const csvContent = [headers, ...rows].map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `data_petugas_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToExcel = () => {
        const visibleCols = ALL_COLUMNS.filter(col => visibleColumns.includes(col.id) && col.id !== 'foto_petugas');
        const data = filteredOfficers.map(item => {
            const row = {};
            visibleCols.forEach(col => {
                if (['tgl_masuk', 'tgl_keluar', 'update_date'].includes(col.id)) {
                    row[col.label] = formatDate(item[col.id]);
                } else {
                    row[col.label] = item[col.id] || '-';
                }
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Petugas");
        XLSX.writeFile(wb, `data_petugas_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        // Construct filters
        const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
        const branchParam = (formData.kode_cabang && formData.kode_cabang !== 'All') ? `&branch_code=${encodeURIComponent(formData.kode_cabang)}` : '';
        const statusParam = (formData.status_aktif && formData.status_aktif !== 'Semua') ? `&status=${encodeURIComponent(formData.status_aktif)}` : '';

        const url = `./api/officer_report_pdf.php?t=${new Date().getTime()}${searchParam}${branchParam}${statusParam}`;
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

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedOfficers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedOfficers.length / itemsPerPage);

    const handleSaveRotation = async (degrees) => {
        if (!previewImage) return;

        saveRotation(previewImage, degrees, () => {
            const timestamp = new Date().getTime();
            // Close the preview modal so the success notification is visible
            setPreviewImage(null);

            setOfficers(prevOfficers => prevOfficers.map(officer => {
                if (officer.foto_petugas && previewImage.includes(officer.foto_petugas.split('?')[0])) {
                    return { ...officer, foto_petugas: `${officer.foto_petugas.split('?')[0]}?t=${timestamp}` };
                }
                return officer;
            }));

            if (editingOfficer && editingOfficer.foto_petugas && previewImage.includes(editingOfficer.foto_petugas.split('?')[0])) {
                setEditingOfficer(prev => ({
                    ...prev,
                    foto_petugas: `${prev.foto_petugas.split('?')[0]}?t=${timestamp}`
                }));
                setFormData(prev => ({ ...prev, foto_petugas: `${prev.foto_petugas.split('?')[0]}?t=${timestamp}` }));
            }
        });
    };

    return (
        <>
            <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <style>
                    {`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        
                        .card {
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                            background: white;
                            border-radius: 16px;
                            padding: 1.5rem;
                            border: 1px solid var(--border);
                            position: relative;
                            z-index: 1; 
                        }

                        .customer-table {
                            width: 100%;
                            border-collapse: separate; 
                            border-spacing: 0;
                        }
                        .customer-table thead th {
                            position: sticky; top: 0; z-index: 30; background: #f8fafc; 
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
                        @media print {
                            .no-print { display: none !important; }
                            .report-header-only { display: block !important; }
                            .card { border: none !important; box-shadow: none !important; padding: 0 !important; }
                            table { width: 100% !important; border-collapse: collapse !important; }
                            th { background: #0ea5e9 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            td, th { border: 1px solid #e2e8f0 !important; padding: 8px !important; }
                            @page { size: A4 landscape; margin: 1.5cm; }
                        }

                        .report-toolbar {
                            position: sticky;
                            top: 0;
                            z-index: 1000;
                            background: #1e293b;
                            padding: 0.75rem 1.5rem;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            color: white;
                            border-bottom: 1px solid #334155;
                            margin-bottom: 2rem;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        }

                        .toolbar-btn {
                            background: transparent;
                            border: 1px solid transparent;
                            color: #94a3b8;
                            padding: 0.4rem;
                            border-radius: 6px;
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

                        .report-paper {
                            padding: 2.48rem;
                            background: white;
                            border-radius: 2px;
                            border: none;
                            width: 297mm;
                            minHeight: 210mm;
                            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                            position: relative;
                            transition: transform 0.3s ease, box-shadow 0.3s ease;
                        }
                    `}
                </style>

                {isReport && (
                    <div className="report-toolbar no-print">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button className="toolbar-btn" onClick={onReportClose} title="Back">
                                <ChevronLeft size={20} />
                            </button>
                            <div style={{ borderRight: '1px solid #334155', height: '24px', margin: '0 0.5rem' }}></div>
                            <button className="toolbar-btn" title="Print" onClick={handlePrint}><Printer size={18} /></button>
                            <button className="toolbar-btn" title="Export PDF" onClick={exportToPDF}><FileText size={18} /></button>
                            <button className="toolbar-btn" title="Export Excel" onClick={exportToExcel}><FileSpreadsheet size={18} /></button>
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
                                                        onChange={() => {
                                                            setVisibleColumns(prev =>
                                                                prev.includes(col.id) ? prev.filter(c => c !== col.id) : [...prev, col.id]
                                                            );
                                                        }}
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
                    </div>
                )}

                {!isReport && (
                    <header className="header" style={{ marginBottom: '1.5rem' }}>
                        <div>
                            <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                                <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.625rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={32} color="var(--primary)" />
                                </div>
                                Data Petugas
                            </h1>
                            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Manajemen data petugas pencatat meter</p>
                        </div>
                        <div className="header-actions no-print" style={{ display: 'flex', gap: '0.5rem' }}>
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
                )}

                <div style={{
                    background: isReport ? '#334155' : 'transparent',
                    margin: isReport ? '-1.5rem' : '0',
                    padding: isReport ? '3rem 1.5rem' : '0',
                    minHeight: isReport ? 'calc(100vh - 100px)' : '0',
                    justifyContent: 'center',
                    display: isReport ? 'flex' : 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    overflowY: isReport ? 'auto' : 'hidden'
                }}>
                    <div
                        style={{
                            padding: isReport ? '2.48rem' : '1.5rem',
                            background: 'white',
                            borderRadius: isReport ? '2px' : '16px',
                            border: isReport ? 'none' : '1px solid var(--border)',
                            width: isReport ? '297mm' : '100%',
                            minHeight: isReport ? '210mm' : '0',
                            // height: isReport ? 'auto' : '100%', // Removed to allow flex shrinking
                            boxShadow: isReport ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            position: 'relative',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            transform: isReport ? `scale(${scale})` : 'none',
                            transformOrigin: 'top center',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: isReport ? 'hidden' : 'visible'
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
                                        <p style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>RPT-OFF-001</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', position: 'relative' }}>
                                    <div style={{ height: '4px', background: '#0ea5e9', width: '60px', margin: '0 auto 1.5rem' }}></div>
                                    <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>LAPORAN DATA PETUGAS</h1>
                                    <p style={{ margin: '0.75rem 0', color: '#64748b', fontWeight: 600, fontSize: '1rem' }}>
                                        Dicetak pada: <span style={{ color: '#0ea5e9' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {!isReport && (
                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>

                                {/* Column Visibility and Filter */}
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ position: 'relative' }} ref={columnMenuRef}>
                                        <button
                                            onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                                            style={{
                                                height: '42px',
                                                padding: '0 1.25rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.625rem',
                                                background: isColumnMenuOpen ? '#f1f5f9' : 'white',
                                                border: `1px solid ${isColumnMenuOpen ? 'var(--primary)' : '#e2e8f0'}`,
                                                color: isColumnMenuOpen ? 'var(--primary)' : '#334155',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <SlidersHorizontal size={18} />
                                            <span>Pilih Kolom</span>
                                        </button>
                                        {isColumnMenuOpen && (
                                            <div style={{
                                                position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                                                background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                                padding: '1.25rem', zIndex: 100, minWidth: '240px'
                                            }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Tampilkan Kolom</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem' }}>
                                                    {ALL_COLUMNS.map(col => (
                                                        <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem', color: '#334155', borderRadius: '6px', transition: 'background 0.2s' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={visibleColumns.includes(col.id)}
                                                                onChange={() => {
                                                                    setVisibleColumns(prev =>
                                                                        prev.includes(col.id) ? prev.filter(c => c !== col.id) : [...prev, col.id]
                                                                    );
                                                                }}
                                                                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                                                            />
                                                            <span>{col.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ position: 'relative' }} ref={searchMenuRef}>
                                        <button
                                            onClick={() => setIsSearchMenuOpen(!isSearchMenuOpen)}
                                            style={{
                                                height: '42px',
                                                padding: '0 1.25rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.625rem',
                                                background: isSearchMenuOpen ? '#f1f5f9' : 'white',
                                                border: `1px solid ${isSearchMenuOpen ? 'var(--primary)' : '#e2e8f0'}`,
                                                color: isSearchMenuOpen ? 'var(--primary)' : '#334155',
                                                borderRadius: '8px',
                                                minWidth: '100px',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <ChevronDown size={14} style={{ transform: isSearchMenuOpen ? 'rotate(180deg)' : 'none' }} />
                                            Filter: {searchCategory === 'nama' ? 'Nama' : searchCategory === 'nik' ? 'NIK' : 'Alamat'}
                                        </button>
                                        {isSearchMenuOpen && (
                                            <div style={{
                                                position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                                                background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                                                boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                                                padding: '0.5rem', zIndex: 100, minWidth: '200px'
                                            }}>
                                                {['nama', 'nik', 'alamat'].map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => { setSearchCategory(opt); setIsSearchMenuOpen(false); }}
                                                        style={{
                                                            width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none',
                                                            background: searchCategory === opt ? '#f1f5f9' : 'none',
                                                            color: searchCategory === opt ? 'var(--primary)' : '#334155',
                                                            fontWeight: searchCategory === opt ? 600 : 400
                                                        }}
                                                    >
                                                        {opt === 'nama' ? 'Nama Petugas' : opt === 'nik' ? 'NIK' : 'Alamat'}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <div style={{ position: 'relative', width: '300px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input
                                        type="text"
                                        placeholder={`Cari ${searchCategory}...`}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '42px',
                                            padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '0.875rem',
                                            outline: 'none',
                                            transition: 'all 0.2s',
                                            background: 'white'
                                        }}
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            style={{
                                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
                                                color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="table-container" style={{
                            flex: 1,
                            overflow: 'auto',
                            minHeight: 0,
                            marginTop: '1rem',
                            border: '1px solid var(--border)',
                            borderRadius: '8px'
                        }}>
                            <table className="customer-table">
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr>
                                        <th style={{ width: '60px', textAlign: 'center', borderBottom: isReport ? '2px solid #e2e8f0' : 'none', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>NO</th>
                                        {ALL_COLUMNS.map(col => visibleColumns.includes(col.id) && (
                                            <th key={col.id} onClick={isReport ? null : () => handleSort(col.id)} style={{
                                                cursor: isReport ? 'default' : 'pointer',
                                                userSelect: 'none',
                                                textAlign: ['foto_petugas', 'status_aktif'].includes(col.id) ? 'center' : 'left',
                                                borderBottom: isReport ? '2px solid #e2e8f0' : 'none',
                                                borderRight: isReport ? '1px solid #e2e8f0' : 'none'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: ['foto_petugas', 'status_aktif'].includes(col.id) ? 'center' : 'flex-start', gap: '0.5rem' }}>
                                                    {col.label} {!isReport && getSortIcon(col.id)}
                                                </div>
                                            </th>
                                        ))}
                                        {!isReport && <th style={{ width: '100px', textAlign: 'center' }}>AKSI</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={visibleColumns.length + 2} style={{ textAlign: 'center', padding: '3rem' }}>
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : currentItems.length > 0 ? (
                                        currentItems.map((officer, index) => (
                                            <tr key={officer.id || index} style={{ borderBottom: isReport ? '1px solid #e2e8f0' : 'none' }}>
                                                <td style={{ textAlign: 'center', color: '#64748b', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{indexOfFirstItem + index + 1}</td>
                                                {visibleColumns.includes('nik') && <td style={{ fontWeight: 500, borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{officer.nik}</td>}
                                                {visibleColumns.includes('ktp') && <td style={{ borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{officer.ktp || '-'}</td>}
                                                {visibleColumns.includes('nama_cabang') && <td style={{ borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{officer.nama_cabang || '-'}</td>}
                                                {visibleColumns.includes('kode_rute') && (
                                                    <td style={{ borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>
                                                        <button
                                                            onClick={() => handleViewRoutes(officer)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                padding: '4px 10px', borderRadius: '6px',
                                                                background: '#eff6ff', color: 'var(--primary)',
                                                                border: 'none', fontSize: '0.75rem', fontWeight: 600,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <List size={14} /> Lihat Rute
                                                        </button>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('nama') && <td style={{ fontWeight: 600, color: '#0f172a', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{officer.nama}</td>}
                                                {visibleColumns.includes('foto_petugas') && (
                                                    <td style={{ textAlign: 'center', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>
                                                        {officer.foto_petugas ? (
                                                            <img
                                                                src={officer.foto_petugas.startsWith('/') ? `${API_BASE_URL}${officer.foto_petugas}` : officer.foto_petugas}
                                                                alt="Foto"
                                                                style={{
                                                                    width: '36px', height: '36px', objectFit: 'cover',
                                                                    borderRadius: '8px', cursor: 'pointer',
                                                                    border: '1px solid #e2e8f0'
                                                                }}
                                                                onClick={() => setPreviewImage(officer.foto_petugas)}
                                                            />
                                                        ) : (
                                                            <div style={{
                                                                width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                margin: '0 auto', color: '#cbd5e1'
                                                            }}>
                                                                <User size={18} />
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                                {visibleColumns.includes('alamat') && <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{officer.alamat || '-'}</td>}
                                                {visibleColumns.includes('telepon') && <td style={{ borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{officer.telepon || '-'}</td>}
                                                {visibleColumns.includes('tgl_masuk') && <td style={{ borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{formatDate(officer.tgl_masuk)}</td>}
                                                {visibleColumns.includes('tgl_keluar') && <td style={{ borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{formatDate(officer.tgl_keluar)}</td>}
                                                {visibleColumns.includes('status_aktif') && (
                                                    <td style={{ textAlign: 'center', borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>
                                                        <span className={`badge ${officer.status_aktif === 'Aktif' ? 'badge-active' : 'badge-inactive'}`}>
                                                            {officer.status_aktif}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('update_date') && <td style={{ borderRight: isReport ? '1px solid #e2e8f0' : 'none' }}>{formatDate(officer.update_date)}</td>}
                                                {!isReport && (
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                            <button
                                                                className="btn btn-outline"
                                                                onClick={() => handleOpenModal(officer)}
                                                                title="Edit"
                                                                style={{
                                                                    padding: '0.25rem', width: '28px', height: '28px', borderRadius: '6px',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                className="btn btn-outline"
                                                                onClick={() => handleDelete(officer.id)}
                                                                title="Hapus"
                                                                style={{
                                                                    padding: '0.25rem', width: '28px', height: '28px', borderRadius: '6px',
                                                                    color: '#ef4444',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={visibleColumns.length + 2} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                                Tidak ada data petugas ditemukan
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={sortedOfficers.length}
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                            setCurrentPage={setCurrentPage}
                            indexOfFirstItem={indexOfFirstItem}
                            indexOfLastItem={indexOfLastItem}
                        />

                    </div>
                </div>

                {/* Image Preview Modal outside of animated container */}
                <div onClick={e => e.stopPropagation()}>
                    <SimpleImageViewer
                        isOpen={!!previewImage}
                        onClose={() => setPreviewImage(null)}
                        imageSrc={previewImage && previewImage.startsWith('/') ? `${API_BASE_URL}${previewImage}` : previewImage}
                        onSaveRotation={handleSaveRotation}
                    />    </div>

                {/* Other Modals (Edit, Route Detail, Route Select) */}
                {isModalOpen && (
                    <div className="modal-overlay" onClick={handleCloseModal}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                                    {editingOfficer ? 'Edit Data Petugas' : 'Tambah Petugas Baru'}
                                </h2>
                                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    {/* Left Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                        {/* Photo Upload */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <div style={{
                                                width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden',
                                                background: '#f1f5f9', border: '2px dashed #cbd5e1', position: 'relative',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {formData.foto_petugas ? (
                                                    <img
                                                        src={formData.foto_petugas.startsWith('data:') || formData.foto_petugas.startsWith('blob:') ? formData.foto_petugas : (formData.foto_petugas.startsWith('/') ? `${API_BASE_URL}${formData.foto_petugas}` : formData.foto_petugas)}
                                                        alt="Preview"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <User size={48} color="#cbd5e1" />
                                                )}
                                                {isUploading && (
                                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                    </div>
                                                )}
                                            </div>
                                            <label style={{
                                                marginTop: '0.75rem', padding: '0.5rem 1rem', background: '#eff6ff',
                                                color: 'var(--primary)', borderRadius: '6px', fontSize: '0.875rem',
                                                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                            }}>
                                                <Camera size={16} /> Upload Foto
                                                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                            </label>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>NIK <span style={{ color: 'red' }}>*</span></label>
                                            <input
                                                type="text"
                                                value={formData.nik}
                                                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                                                required
                                                placeholder="Nomor Induk Karyawan"
                                                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>No. KTP <span style={{ color: 'red' }}>*</span></label>
                                            <input
                                                type="text"
                                                value={formData.ktp}
                                                onChange={(e) => setFormData({ ...formData, ktp: e.target.value })}
                                                required
                                                placeholder="Nomor KTP"
                                                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Nama Lengkap <span style={{ color: 'red' }}>*</span></label>
                                            <input
                                                type="text"
                                                value={formData.nama}
                                                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                                required
                                                placeholder="Nama petugas"
                                                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>No. Telepon</label>
                                            <input
                                                type="text"
                                                value={formData.telepon}
                                                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                                                placeholder="08xxxxxxxxxx"
                                                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                        <SearchableSelect
                                            label="Cabang"
                                            placeholder="-- Pilih Cabang --"
                                            options={branches.map(b => ({ value: b.kode_cabang, label: b.cabang }))}
                                            value={formData.kode_cabang}
                                            onChange={(e) => setFormData({ ...formData, kode_cabang: e.target.value })}
                                            required={true}
                                        />

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Rute Baca Meter</label>
                                            <div style={{
                                                border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem',
                                                maxHeight: '150px', overflowY: 'auto', background: '#f8fafc'
                                            }}>
                                                {routes.length > 0 ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                        {routes.map(r => (
                                                            <label key={r.kode_rute} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.kode_rute.includes(r.kode_rute)}
                                                                    onChange={(e) => {
                                                                        const checked = e.target.checked;
                                                                        setFormData(prev => {
                                                                            const current = [...prev.kode_rute];
                                                                            if (checked) return { ...prev, kode_rute: [...current, r.kode_rute] };
                                                                            return { ...prev, kode_rute: current.filter(c => c !== r.kode_rute) };
                                                                        });
                                                                    }}
                                                                    style={{ accentColor: 'var(--primary)' }}
                                                                />
                                                                <span title={r.rute}>{r.kode_rute}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>
                                                        {formData.kode_cabang ? 'Tidak ada rute tersedia' : 'Pilih cabang terlebih dahulu'}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                {formData.kode_rute.length} rute dipilih
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Alamat</label>
                                            <textarea
                                                value={formData.alamat}
                                                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                                                placeholder="Alamat lengkap"
                                                rows={3}
                                                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', resize: 'vertical' }}
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Tgl Masuk</label>
                                                <input
                                                    type="date"
                                                    value={formData.tgl_masuk}
                                                    onChange={(e) => setFormData({ ...formData, tgl_masuk: e.target.value })}
                                                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Tgl Keluar</label>
                                                <input
                                                    type="date"
                                                    value={formData.tgl_keluar}
                                                    onChange={(e) => setFormData({ ...formData, tgl_keluar: e.target.value })}
                                                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Status</label>
                                            <select
                                                value={formData.status_aktif}
                                                onChange={(e) => setFormData({ ...formData, status_aktif: e.target.value })}
                                                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', background: 'white' }}
                                            >
                                                <option value="Aktif">Aktif</option>
                                                <option value="Non-Aktif">Non-Aktif</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        style={{
                                            padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                                            background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer'
                                        }}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
                                            background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer',
                                            opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        {loading ? <div className="spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div> : <Save size={18} />}
                                        {editingOfficer ? 'Simpan Perubahan' : 'Simpan Data'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Route Detail Modal */}
                {isRouteDetailModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsRouteDetailModalOpen(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                                    Detail Rute
                                </h2>
                                <button onClick={() => setIsRouteDetailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Nama Petugas</div>
                                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{selectedOfficerRoutes?.nama}</div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Cari rute..."
                                    value={routeDetailSearch}
                                    onChange={(e) => setRouteDetailSearch(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                                />
                            </div>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                {selectedOfficerRoutes?.routes.length > 0 ? (
                                    <table className="customer-table" style={{ margin: 0 }}>
                                        <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                                            <tr>
                                                <th style={{ padding: '0.75rem', fontSize: '0.75rem' }}>Kode Rute</th>
                                                <th style={{ padding: '0.75rem', fontSize: '0.75rem' }}>Nama Rute</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOfficerRoutes.routes
                                                .filter(r =>
                                                    r.code.toLowerCase().includes(routeDetailSearch.toLowerCase()) ||
                                                    r.name.toLowerCase().includes(routeDetailSearch.toLowerCase())
                                                )
                                                .map((r, i) => (
                                                    <tr key={i}>
                                                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: 500 }}>{r.code}</td>
                                                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>{r.name}</td>
                                                    </tr>
                                                ))
                                            }
                                            {selectedOfficerRoutes.routes.filter(r => r.code.toLowerCase().includes(routeDetailSearch.toLowerCase())).length === 0 && (
                                                <tr>
                                                    <td colSpan="2" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                                                        Rute tidak ditemukan
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                        Tidak ada rute ditugaskan
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                                <button
                                    onClick={() => setIsRouteDetailModalOpen(false)}
                                    className="btn btn-outline"
                                    style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', fontWeight: 600, minWidth: '100px' }}
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

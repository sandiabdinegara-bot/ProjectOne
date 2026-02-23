import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Droplets, Download, FileSpreadsheet, FileText, Printer, X, User, Camera, Upload, SlidersHorizontal, ChevronDown, MapPin, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import SearchableSelect from './common/SearchableSelect';
import Pagination from './common/Pagination';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import Viewer from 'react-viewer';
import SimpleImageViewer from './common/SimpleImageViewer';
import useImageRotator from '../hooks/useImageRotator';

const API_URL = './api/customers.php';
const API_BASE_URL = 'http://localhost'; // Base URL for absolute paths (XAMPP)

const ALL_COLUMNS = [
    { id: 'id_sambungan', label: 'NO. SAMBUNGAN' },
    { id: 'id_meter', label: 'ID METER' },
    { id: 'id_tag', label: 'ID TAG' },
    { id: 'foto_rumah', label: 'FOTO RUMAH' },
    { id: 'foto_meter', label: 'FOTO METER' },
    { id: 'nama', label: 'NAMA PELANGGAN' },
    { id: 'alamat', label: 'ALAMAT' },
    { id: 'koordinat', label: 'KOORDINAT' },
    { id: 'telepon', label: 'TELEPON' },
    { id: 'kode_tarif', label: 'TARIF' },
    { id: 'kode_rute', label: 'RUTE' },
    { id: 'nama_cabang', label: 'CABANG' },
    { id: 'kode_kecamatan', label: 'KEC' },
    { id: 'kode_desa', label: 'DESA' },
    { id: 'kode_rw', label: 'RW' },
    { id: 'kode_rt', label: 'RT' },
    { id: 'active_date', label: 'TANGGAL AKTIF' }
];

const DEFAULT_COLUMNS = ['id_sambungan', 'id_meter', 'id_tag', 'foto_rumah', 'foto_meter', 'nama', 'alamat', 'telepon', 'kode_tarif', 'kode_rute', 'nama_cabang', 'kode_kecamatan', 'kode_desa', 'kode_rw', 'kode_rt', 'active_date'];



export default function CustomerManagement() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [kecamatans, setKecamatans] = useState([]);
    const [desas, setDesas] = useState([]);
    const [rws, setRws] = useState([]);
    const [rts, setRts] = useState([]);
    const [tarifOptions, setTarifOptions] = useState([]);
    const [ruteOptions, setRuteOptions] = useState([]);
    const [cabangOptions, setCabangOptions] = useState([]);
    const [selectedIds, setSelectedIds] = useState({ kec: null, desa: null, rw: null });
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);
    const columnMenuRef = useRef(null);
    const searchMenuRef = useRef(null);

    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('pdam_visible_columns_v4');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(Number(localStorage.getItem('pdam_current_page')) || 1);
    const [itemsPerPage, setItemsPerPage] = useState(Number(localStorage.getItem('pdam_items_per_page')) || 10);
    const [searchCategory, setSearchCategory] = useState('nama');

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
    // State for image handling
    const { saveRotation } = useImageRotator();
    const [fotoPreview, setFotoPreview] = useState(null);
    const [fotoRumahPreview, setFotoRumahPreview] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadingState, setUploadingState] = useState({ meter: false, rumah: false });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFileRumah, setSelectedFileRumah] = useState(null);
    const [formData, setFormData] = useState({
        id_sambungan: '',
        id_meter: '',
        id_tag: '',
        nama: '',
        alamat: '',
        telepon: '',
        kode_tarif: '',
        kode_rute: '',
        kode_cabang: '',
        kode_kecamatan: '',
        kode_desa: '',
        kode_rw: '',
        kode_rt: '',
        longitude: '',
        latitude: '',
        active_date: '',
        foto_meter: '',
        foto_rumah: ''
    });

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await fetch(API_URL);
            const data = await res.json();
            setCustomers(data);
        } catch (err) {
            console.error('Failed to fetch customers:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchZones = async (type, params = {}) => {
        const queryParams = new URLSearchParams({ type, ...params });
        let url = `./api/zones.php?${queryParams.toString()}`;

        try {
            const res = await fetch(url);
            return await res.json();
        } catch (err) {
            console.error(`Failed to fetch ${type}:`, err);
            return [];
        }
    };

    const fetchOptions = async (type, params = {}) => {
        const queryParams = new URLSearchParams({ type, ...params });
        try {
            const res = await fetch(`./api/options.php?${queryParams.toString()}`);
            const data = await res.json();
            return data;
        } catch (err) {
            console.error(`Failed to fetch ${type}:`, err);
            return [];
        }
    };

    useEffect(() => {
        localStorage.setItem('pdam_current_page', currentPage);
    }, [currentPage]);

    useEffect(() => {
        localStorage.setItem('pdam_items_per_page', itemsPerPage);
    }, [itemsPerPage]);

    useEffect(() => {
        localStorage.setItem('pdam_visible_columns_v2', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
                setIsColumnMenuOpen(false);
            }
            if (searchMenuRef.current && !searchMenuRef.current.contains(event.target)) {
                setIsSearchMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        fetchCustomers();
        fetchZones('kecamatan').then(setKecamatans);
        fetchOptions('tarif').then(setTarifOptions);
        fetchOptions('rute').then(setRuteOptions);
        fetchOptions('cabang').then(setCabangOptions);
    }, []);

    useEffect(() => {
        if (isModalOpen && editingCustomer) {
            if (editingCustomer.kode_kecamatan) {
                fetchZones('desa', { kec_kode: editingCustomer.kode_kecamatan }).then(setDesas);
            }
            if (editingCustomer.kode_desa) {
                fetchZones('rw', { kec_kode: editingCustomer.kode_kecamatan, desa_kode: editingCustomer.kode_desa }).then(setRws);
            }
            if (editingCustomer.kode_rw) {
                fetchZones('rt', { kec_kode: editingCustomer.kode_kecamatan, desa_kode: editingCustomer.kode_desa, rw_kode: editingCustomer.kode_rw }).then(setRts);
            }
            // Fetch initial rute options based on branch
            if (editingCustomer.kode_cabang) {
                fetchOptions('rute', { kode_cabang: editingCustomer.kode_cabang }).then(setRuteOptions);
            }
        } else if (!isModalOpen) {
            setDesas([]);
            setRws([]);
            setRts([]);
            // Reset to all rutes when modal closes
            fetchOptions('rute').then(setRuteOptions);
        }
    }, [isModalOpen, editingCustomer]);

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({ ...customer });
            setFotoPreview(customer.foto_meter || null);
            setFotoRumahPreview(customer.foto_rumah || null);
            setSelectedFile(null);
            setSelectedFileRumah(null);
        } else {
            setEditingCustomer(null);
            setFormData({
                id_sambungan: '', id_meter: '', id_tag: '', nama: '', alamat: '', telepon: '',
                kode_tarif: '', kode_rute: '', kode_cabang: '', kode_kecamatan: '',
                kode_desa: '', kode_rw: '', kode_rt: '',
                longitude: '', latitude: '', active_date: '', foto_meter: '', foto_rumah: ''
            });
            setFotoPreview(null);
            setFotoRumahPreview(null);
            setSelectedFile(null);
            setSelectedFileRumah(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
        setFotoPreview(null);
        setFotoRumahPreview(null);
        setSelectedFile(null);
        setSelectedFileRumah(null);
        setUploadingState({ meter: false, rumah: false });
        setUploadProgress(0);
    };

    const handleFileChange = (e, type = 'foto_meter') => {
        const file = e.target.files[0];
        if (file) {
            const uploadKey = type === 'foto_rumah' ? 'rumah' : 'meter';
            setUploadingState(prev => ({ ...prev, [uploadKey]: true }));
            setUploadProgress(0);

            const reader = new FileReader();

            // Simulate upload progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);

                    reader.onloadend = () => {
                        if (type === 'foto_rumah') {
                            setFotoRumahPreview(reader.result);
                            setSelectedFileRumah(file);
                        } else {
                            setFotoPreview(reader.result);
                            setSelectedFile(file);
                        }
                        // We don't set formData.foto here yet, we send physical file in submit
                        setTimeout(() => {
                            setUploadingState(prev => ({ ...prev, [uploadKey]: false }));
                            setUploadProgress(0);
                        }, 500);
                    };
                    reader.readAsDataURL(file);
                }
                setUploadProgress(progress);
            }, 100);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (uploadingState.meter || uploadingState.rumah) return;

        // Use FormData for file upload
        const body = new FormData();
        Object.keys(formData).forEach(key => {
            if (key !== 'foto_meter' && key !== 'foto_rumah') {
                body.append(key, formData[key] || '');
            }
        });

        if (selectedFile) {
            body.append('foto_meter', selectedFile);
        } else if (formData.foto_meter) {
            body.append('foto_meter', formData.foto_meter);
        }

        if (selectedFileRumah) {
            body.append('foto_rumah', selectedFileRumah);
        } else if (formData.foto_rumah) {
            body.append('foto_rumah', formData.foto_rumah);
        }

        // Use POST for both insert and update to support multipart/form-data in PHP
        // Use POST for both insert and update to support multipart/form-data in PHP
        const url = editingCustomer ? `${API_URL}?id=${editingCustomer.id}` : API_URL;

        try {
            Swal.fire({
                title: 'Menyimpan Data...',
                text: 'Mohon tunggu sebentar',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const res = await fetch(url, {
                method: 'POST',
                body: body
            });
            const data = await res.json();
            if (data.message) {
                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Data pelanggan berhasil disimpan.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchCustomers();
                handleCloseModal();
            } else {
                Swal.fire('Gagal!', data.error || 'Terjadi kesalahan saat menyimpan.', 'error');
            }
        } catch (err) {
            console.error('Save failed:', err);
            Swal.fire('Error!', 'Gagal menghubungi server.', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Hapus Pelanggan?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.message) {
                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Data pelanggan telah dihapus.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchCustomers();
            }
        } catch (err) {
            console.error('Delete failed:', err);
            Swal.fire('Error!', 'Gagal menghapus data.', 'error');
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;

        if (searchCategory === 'kode') {
            return (
                (customer.kode_kecamatan?.toLowerCase() || '').includes(term) ||
                (customer.kode_desa?.toLowerCase() || '').includes(term) ||
                (customer.kode_rw?.toLowerCase() || '').includes(term) ||
                (customer.kode_rt?.toLowerCase() || '').includes(term)
            );
        }

        const fieldMap = {
            'nama': customer.nama,
            'rute': customer.kode_rute,
            'id_pelanggan': customer.id_sambungan,
            'tag': customer.id_tag,
            'meter': customer.id_meter
        };

        const targetField = fieldMap[searchCategory];
        return (targetField?.toLowerCase() || '').includes(term);
    });

    const sortedCustomers = React.useMemo(() => {
        let sortableItems = [...filteredCustomers];
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
    }, [filteredCustomers, sortConfig]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedCustomers.slice(indexOfFirstItem, indexOfLastItem);



    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Export Logic
    const exportToCSV = () => {
        const visibleCols = ALL_COLUMNS.filter(col => visibleColumns.includes(col.id) && col.id !== 'foto_rumah' && col.id !== 'foto_meter');
        const headers = visibleCols.map(c => c.label);
        const rows = filteredCustomers.map(c => visibleCols.map(col => {
            if (col.id === 'koordinat') return c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : '-';
            if (col.id === 'active_date') return formatDate(c[col.id]);
            return c[col.id] || '-';
        }));

        const csvContent = [headers, ...rows].map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `data_pelanggan_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToExcel = () => {
        const visibleCols = ALL_COLUMNS.filter(col => visibleColumns.includes(col.id) && col.id !== 'foto_rumah' && col.id !== 'foto_meter');
        const data = filteredCustomers.map(c => {
            const item = {};
            visibleCols.forEach(col => {
                if (col.id === 'koordinat') {
                    item[col.label] = c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : '-';
                } else if (col.id === 'active_date') {
                    item[col.label] = formatDate(c[col.id]);
                } else {
                    item[col.label] = c[col.id] || '-';
                }
            });
            return item;
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pelanggan");
        XLSX.writeFile(workbook, `data_pelanggan_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF('l', 'mm', 'a4');
            const now = new Date().toLocaleString('id-ID');

            // Header
            doc.setFontSize(18);
            doc.setTextColor(14, 165, 233); // Primary color
            doc.text("Laporan Data Pelanggan PDAM", 14, 15);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Jumlah Total: ${filteredCustomers.length} Pelanggan`, 14, 22);
            doc.text(`Waktu Cetak: ${now}`, 280, 22, { align: 'right' });

            const visibleCols = ALL_COLUMNS.filter(col => visibleColumns.includes(col.id) && col.id !== 'foto_rumah' && col.id !== 'foto_meter');
            const tableColumn = ["No", ...visibleCols.map(c => c.label)];

            const tableRows = filteredCustomers.map((c, i) => [
                i + 1,
                ...visibleCols.map(col => {
                    if (col.id === 'koordinat') return c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : '-';
                    if (col.id === 'active_date') return formatDate(c[col.id]);
                    return c[col.id] || '-';
                })
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 28,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
                headStyles: { fillColor: [241, 245, 249], textColor: [100, 116, 139], fontStyle: 'bold' },
                margin: { left: 10, right: 10 }
            });

            doc.save(`data_pelanggan_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('PDF Export Error:', err);
            alert('Gagal mengekspor PDF. Pastikan library tersedia.');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSaveRotation = async (degrees) => {
        if (!previewImage) return;

        saveRotation(previewImage, degrees, () => {
            const timestamp = new Date().getTime();

            // Close preview to show success message
            setPreviewImage(null);

            // Update customers list
            setCustomers(prevCustomers => prevCustomers.map(customer => {
                let updatedCustomer = { ...customer };
                let changed = false;

                if (customer.foto_meter && previewImage.includes(customer.foto_meter.split('?')[0])) {
                    updatedCustomer.foto_meter = `${customer.foto_meter.split('?')[0]}?t=${timestamp}`;
                    changed = true;
                }
                if (customer.foto_rumah && previewImage.includes(customer.foto_rumah.split('?')[0])) {
                    updatedCustomer.foto_rumah = `${customer.foto_rumah.split('?')[0]}?t=${timestamp}`;
                    changed = true;
                }

                // Update editing customer state if this is the one being edited
                if (changed && editingCustomer && editingCustomer.id === customer.id) {
                    const newUrl = `${previewImage.split('?')[0]}?t=${timestamp}`;

                    setEditingCustomer(prev => ({
                        ...prev,
                        foto_meter: updatedCustomer.foto_meter,
                        foto_rumah: updatedCustomer.foto_rumah
                    }));

                    setFormData(prev => ({
                        ...prev,
                        foto_meter: updatedCustomer.foto_meter,
                        foto_rumah: updatedCustomer.foto_rumah
                    }));

                    // Update previews (though modal is closed, good for state consistency)
                    if (updatedCustomer.foto_meter === newUrl) setFotoPreview(newUrl);
                    if (updatedCustomer.foto_rumah === newUrl) setFotoRumahPreview(newUrl);
                }

                return updatedCustomer;
            }));
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


                    .card {
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                        background: white;
                        border-radius: 16px;
                        padding: 1.5rem;
                        border: 1px solid var(--border);
                        /* Create a stacking context to contain sticky headers */
                        position: relative;
                        z-index: 1;
                        display: flex;
                        flex-direction: column;
                        flex: 1;
                        min-height: 0;
                        overflow: hidden; 
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
                                <Droplets size={32} color="var(--primary)" />
                            </div>
                            Data Pelanggan
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Manajemen data pelanggan dan informasi meteran</p>
                    </div>
                    <div className="header-actions no-print">
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

                            {/* Search Category Toggle */}
                            <div style={{ position: 'relative' }} ref={searchMenuRef}>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setIsSearchMenuOpen(!isSearchMenuOpen)}
                                    style={{
                                        height: '42px',
                                        padding: '0 1.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.625rem',
                                        background: isSearchMenuOpen ? '#f1f5f9' : '#f8fafc',
                                        border: `1px solid ${isSearchMenuOpen ? 'var(--primary)' : 'var(--border)'}`,
                                        color: isSearchMenuOpen ? 'var(--primary)' : 'var(--text)',
                                        borderRadius: '8px',
                                        minWidth: '100px'
                                    }}
                                >
                                    <span style={{ fontWeight: 600 }}>Filter</span>
                                    <ChevronDown size={16} style={{ transform: isSearchMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                </button>

                                {isSearchMenuOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        left: 0,
                                        zIndex: 1000,
                                        background: 'white',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                                        padding: '0.5rem',
                                        minWidth: '200px',
                                        animation: 'fadeIn 0.2s ease-out'
                                    }}>
                                        {[
                                            { id: 'nama', label: 'By Nama' },
                                            { id: 'rute', label: 'By Rute' },
                                            { id: 'id_pelanggan', label: 'By ID. Pelanggan' },
                                            { id: 'tag', label: 'By ID. Tag' },
                                            { id: 'meter', label: 'By No. Meter' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setSearchCategory(opt.id);
                                                    setIsSearchMenuOpen(false);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '0.75rem 1rem',
                                                    border: 'none',
                                                    background: searchCategory === opt.id ? '#f1f5f9' : 'none',
                                                    color: searchCategory === opt.id ? 'var(--primary)' : 'var(--text)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: searchCategory === opt.id ? 600 : 400,
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (searchCategory !== opt.id) e.currentTarget.style.background = '#f8fafc';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (searchCategory !== opt.id) e.currentTarget.style.background = 'none';
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ position: 'relative', flex: '0 1 350px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    style={{ paddingLeft: '2.5rem', paddingRight: searchTerm ? '2.5rem' : '0.625rem', height: '42px', borderRadius: '8px', border: '1px solid var(--border)', background: '#f8fafc', width: '100%' }}
                                    placeholder="Ketik kata kunci pencarian..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            padding: '4px',
                                            cursor: 'pointer',
                                            color: 'var(--text-light)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                        title="Bersihkan pencarian"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {!loading && filteredCustomers.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button className="btn btn-outline" style={{ padding: '0.4rem' }} disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                                    <ChevronLeft size={16} />
                                </button>
                                <span style={{ fontSize: '0.875rem' }}>Halaman <strong>{currentPage}</strong> dari {totalPages}</span>
                                <button className="btn btn-outline" style={{ padding: '0.4rem' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-light)' }}>Loading customers...</div>
                    ) : (
                        <div className="table-container" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                            <table className="customer-table">
                                <thead>
                                    <tr>
                                        <th className="sticky-col-left" style={{ width: '60px', textAlign: 'center' }}>NO</th>
                                        {visibleColumns.includes('id_sambungan') && (
                                            <th onClick={() => handleSort('id_sambungan')} style={{
                                                width: '150px',
                                                minWidth: '150px',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                userSelect: 'none'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    No. Sambungan {getSortIcon('id_sambungan')}
                                                </div>
                                            </th>
                                        )}

                                        {visibleColumns.includes('id_meter') && (
                                            <th onClick={() => handleSort('id_meter')} style={{ width: '120px', minWidth: '120px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    ID Meter {getSortIcon('id_meter')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('id_tag') && (
                                            <th onClick={() => handleSort('id_tag')} style={{ width: '120px', minWidth: '120px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    ID Tag {getSortIcon('id_tag')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('foto_rumah') && <th style={{ width: '100px', minWidth: '100px', textAlign: 'center' }}>FOTO RUMAH</th>}
                                        {visibleColumns.includes('foto_meter') && <th style={{ width: '100px', minWidth: '100px', textAlign: 'center' }}>FOTO METER</th>}
                                        {visibleColumns.includes('nama') && (
                                            <th onClick={() => handleSort('nama')} style={{ width: '200px', minWidth: '200px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Nama Pelanggan {getSortIcon('nama')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('alamat') && (
                                            <th onClick={() => handleSort('alamat')} style={{ width: '250px', minWidth: '250px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Alamat {getSortIcon('alamat')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('koordinat') && (
                                            <th onClick={() => handleSort('latitude')} style={{ width: '150px', minWidth: '150px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Koordinat {getSortIcon('latitude')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('telepon') && (
                                            <th onClick={() => handleSort('telepon')} style={{ width: '130px', minWidth: '130px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Telepon {getSortIcon('telepon')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('kode_tarif') && (
                                            <th onClick={() => handleSort('kode_tarif')} style={{ width: '70px', minWidth: '70px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                    Tarif {getSortIcon('kode_tarif')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('kode_rute') && (
                                            <th onClick={() => handleSort('kode_rute')} style={{ width: '90px', minWidth: '90px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                    Rute {getSortIcon('kode_rute')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('nama_cabang') && (
                                            <th onClick={() => handleSort('nama_cabang')} style={{ width: '120px', minWidth: '120px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                    Cabang {getSortIcon('nama_cabang')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('kode_kecamatan') && (
                                            <th onClick={() => handleSort('kode_kecamatan')} style={{ width: '60px', minWidth: '60px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                    Kec {getSortIcon('kode_kecamatan')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('kode_desa') && (
                                            <th onClick={() => handleSort('kode_desa')} style={{ width: '60px', minWidth: '60px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                    Desa {getSortIcon('kode_desa')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('kode_rw') && (
                                            <th onClick={() => handleSort('kode_rw')} style={{ width: '60px', minWidth: '60px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                    RW {getSortIcon('kode_rw')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('kode_rt') && (
                                            <th onClick={() => handleSort('kode_rt')} style={{ width: '60px', minWidth: '60px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                    RT {getSortIcon('kode_rt')}
                                                </div>
                                            </th>
                                        )}
                                        {visibleColumns.includes('active_date') && (
                                            <th onClick={() => handleSort('active_date')} style={{ width: '120px', minWidth: '120px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Tanggal Aktif {getSortIcon('active_date')}
                                                </div>
                                            </th>
                                        )}
                                        <th className="no-print sticky-col-right" style={{
                                            width: '100px',
                                            minWidth: '100px',
                                            textAlign: 'center',
                                            background: '#f8fafc',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length > 0 ? currentItems.map((customer, index) => (
                                        <tr key={customer.id}>
                                            <td className="sticky-col-left" style={{ textAlign: 'center', fontWeight: 500, color: '#64748b', padding: '0.625rem 0.75rem' }}>
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            {visibleColumns.includes('id_sambungan') && (
                                                <td style={{
                                                    fontWeight: 600,
                                                    width: '150px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    textAlign: 'left'
                                                }}>
                                                    {customer.id_sambungan}
                                                </td>
                                            )}

                                            {visibleColumns.includes('id_meter') && <td style={{ width: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{customer.id_meter}</td>}
                                            {visibleColumns.includes('id_tag') && <td style={{ width: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{customer.id_tag}</td>}
                                            {visibleColumns.includes('foto_rumah') && (
                                                <td style={{ width: '100px', textAlign: 'center' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '6px',
                                                        background: '#f1f5f9',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        margin: '0 auto',
                                                        border: '1px solid #e2e8f0',
                                                        color: '#94a3b8',
                                                        overflow: 'hidden',
                                                        cursor: customer.foto_rumah ? 'pointer' : 'default'
                                                    }}
                                                        onClick={() => customer.foto_rumah && setPreviewImage(customer.foto_rumah)}
                                                        title={customer.foto_rumah ? 'Klik untuk memperbesar' : 'Tidak ada foto rumah'}
                                                    >
                                                        {customer.foto_rumah ? (
                                                            <img src={customer.foto_rumah && customer.foto_rumah.startsWith('/') ? `${API_BASE_URL}${customer.foto_rumah}` : customer.foto_rumah} alt="Foto Rumah" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <Camera size={18} />
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.includes('foto_meter') && (
                                                <td style={{ width: '100px', textAlign: 'center' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '6px',
                                                        background: '#f1f5f9',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        margin: '0 auto',
                                                        border: '1px solid #e2e8f0',
                                                        color: '#94a3b8',
                                                        overflow: 'hidden',
                                                        cursor: customer.foto_meter ? 'pointer' : 'default'
                                                    }}
                                                        onClick={() => customer.foto_meter && setPreviewImage(customer.foto_meter)}
                                                        title={customer.foto_meter ? 'Klik untuk memperbesar' : 'Tidak ada foto meter'}
                                                    >
                                                        {customer.foto_meter ? (
                                                            <img src={customer.foto_meter && customer.foto_meter.startsWith('/') ? `${API_BASE_URL}${customer.foto_meter}` : customer.foto_meter} alt="Foto Meter" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <Droplets size={18} />
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.includes('nama') && <td style={{ width: '200px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={customer.nama}>{customer.nama}</td>}
                                            {visibleColumns.includes('alamat') && <td style={{ width: '250px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={customer.alamat}>{customer.alamat}</td>}
                                            {visibleColumns.includes('koordinat') && (
                                                <td style={{ width: '150px' }}>
                                                    {customer.latitude && customer.longitude ? (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'underline', fontSize: '0.75rem' }}
                                                            title="Buka di Google Maps"
                                                        >
                                                            <span style={{ letterSpacing: '-0.02em' }}>{customer.latitude}, {customer.longitude}</span>
                                                        </a>
                                                    ) : '-'}
                                                </td>
                                            )}
                                            {visibleColumns.includes('telepon') && <td style={{ width: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{customer.telepon}</td>}
                                            {visibleColumns.includes('kode_tarif') && <td style={{ width: '70px', textAlign: 'center' }}>{customer.kode_tarif}</td>}
                                            {visibleColumns.includes('kode_rute') && <td style={{ width: '90px', textAlign: 'center' }}>{customer.kode_rute}</td>}
                                            {visibleColumns.includes('nama_cabang') && <td style={{ width: '120px', textAlign: 'center' }}>{customer.nama_cabang}</td>}
                                            {visibleColumns.includes('kode_kecamatan') && <td style={{ width: '60px', textAlign: 'center' }}>{customer.kode_kecamatan}</td>}
                                            {visibleColumns.includes('kode_desa') && <td style={{ width: '60px', textAlign: 'center' }}>{customer.kode_desa}</td>}
                                            {visibleColumns.includes('kode_rw') && <td style={{ width: '60px', textAlign: 'center' }}>{customer.kode_rw}</td>}
                                            {visibleColumns.includes('kode_rt') && <td style={{ width: '60px', textAlign: 'center' }}>{customer.kode_rt}</td>}
                                            {visibleColumns.includes('active_date') && <td style={{ width: '120px', whiteSpace: 'nowrap', textAlign: 'left' }}>{formatDate(customer.active_date)}</td>}
                                            <td className="no-print sticky-col-right" style={{ textAlign: 'center', background: 'inherit', padding: '0.625rem 0.75rem' }}>
                                                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                                                    <button className="btn btn-outline" style={{ padding: '0.25rem', width: '28px', height: '28px', borderRadius: '6px' }} onClick={() => handleOpenModal(customer)}><Edit2 size={14} /></button>
                                                    <button className="btn btn-outline" style={{ padding: '0.25rem', width: '28px', height: '28px', borderRadius: '6px', color: '#ef4444' }} onClick={() => handleDelete(customer.id)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={visibleColumns.length + 2} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                                            {visibleColumns.length === 0 ? 'Pilih setidaknya satu kolom untuk menampilkan data.' : 'Tidak ada data ditemukan.'}
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && filteredCustomers.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredCustomers.length}
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                            setCurrentPage={setCurrentPage}
                            indexOfFirstItem={indexOfFirstItem}
                            indexOfLastItem={indexOfLastItem}
                        />
                    )}
                </div>

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
                                    {/* Photo Upload Section */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
                                        {/* Foto Meter */}
                                        <div style={{ position: 'relative' }}>
                                            <div style={{
                                                width: '120px',
                                                height: '120px',
                                                borderRadius: '12px',
                                                border: '3px solid #f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                background: '#f8fafc',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                cursor: fotoPreview ? 'pointer' : 'default'
                                            }}
                                                onClick={() => fotoPreview && setPreviewImage(fotoPreview)}
                                                title={fotoPreview ? 'Klik untuk memperbesar' : 'Belum ada foto meter'}
                                            >
                                                {fotoPreview ? (
                                                    <img src={fotoPreview && fotoPreview.startsWith('/') ? `${API_BASE_URL}${fotoPreview}` : fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                                        <Droplets size={40} />
                                                        <p style={{ fontSize: '0.65rem', marginTop: '0.25rem', fontWeight: 600 }}>FOTO METER</p>
                                                    </div>
                                                )}
                                            </div>
                                            <label style={{
                                                position: 'absolute',
                                                bottom: '4px',
                                                right: '4px',
                                                background: uploadingState.meter ? '#94a3b8' : 'var(--primary)',
                                                color: 'white',
                                                padding: '0.625rem',
                                                borderRadius: '8px',
                                                cursor: uploadingState.meter ? 'not-allowed' : 'pointer',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid white',
                                                transition: 'all 0.2s'
                                            }}>
                                                {uploadingState.meter ? <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div> : <Upload size={16} />}
                                                <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'foto_meter')} disabled={uploadingState.meter} />
                                            </label>
                                        </div>
                                        {/* Foto Rumah */}
                                        <div style={{ position: 'relative' }}>
                                            <div style={{
                                                width: '120px',
                                                height: '120px',
                                                borderRadius: '12px',
                                                border: '3px solid #f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                background: '#f8fafc',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                cursor: fotoRumahPreview ? 'pointer' : 'default'
                                            }}
                                                onClick={() => fotoRumahPreview && setPreviewImage(fotoRumahPreview)}
                                                title={fotoRumahPreview ? 'Klik untuk memperbesar' : 'Belum ada foto rumah'}
                                            >
                                                {fotoRumahPreview ? (
                                                    <img src={fotoRumahPreview && fotoRumahPreview.startsWith('/') ? `${API_BASE_URL}${fotoRumahPreview}` : fotoRumahPreview} alt="Preview Rumah" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                                        <Camera size={40} />
                                                        <p style={{ fontSize: '0.65rem', marginTop: '0.25rem', fontWeight: 600 }}>FOTO RUMAH</p>
                                                    </div>
                                                )}
                                            </div>
                                            <label style={{
                                                position: 'absolute',
                                                bottom: '4px',
                                                right: '4px',
                                                background: uploadingState.rumah ? '#94a3b8' : 'var(--primary)',
                                                color: 'white',
                                                padding: '0.625rem',
                                                borderRadius: '8px',
                                                cursor: uploadingState.rumah ? 'not-allowed' : 'pointer',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid white',
                                                transition: 'all 0.2s'
                                            }}>
                                                {uploadingState.rumah ? <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div> : <Upload size={16} />}
                                                <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'foto_rumah')} disabled={uploadingState.rumah} />
                                            </label>
                                        </div>

                                        {(uploadingState.meter || uploadingState.rumah) && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-15px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: '200px',
                                                height: '6px',
                                                background: '#f1f5f9',
                                                borderRadius: '3px',
                                                overflow: 'hidden',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${uploadProgress}%`,
                                                    background: 'var(--primary)',
                                                    transition: 'width 0.1s linear'
                                                }}></div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid-6-col-responsive">
                                        <div style={{ gridColumn: 'span 6', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1rem', color: 'var(--primary)' }}>Informasi Identitas</h3>
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 4' }}>
                                            <label>Nama Lengkap</label>
                                            <input required value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label>ID Sambungan</label>
                                            <input required value={formData.id_sambungan} onChange={e => setFormData({ ...formData, id_sambungan: e.target.value })} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                            <label>Telepon</label>
                                            <input value={formData.telepon} onChange={e => setFormData({ ...formData, telepon: e.target.value })} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                            <label>Active Date</label>
                                            <input type="date" value={formData.active_date} onChange={e => setFormData({ ...formData, active_date: e.target.value })} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                            <label>ID Meter</label>
                                            <input value={formData.id_meter} onChange={e => setFormData({ ...formData, id_meter: e.target.value })} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 3' }}>
                                            <label>ID Tag</label>
                                            <input value={formData.id_tag} onChange={e => setFormData({ ...formData, id_tag: e.target.value })} />
                                        </div>
                                        <div style={{ gridColumn: 'span 6', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1rem', color: 'var(--primary)' }}>Informasi Alamat & Lokasi</h3>
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 6' }}>
                                            <label>Alamat Lengkap</label>
                                            <textarea rows="2" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })}></textarea>
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Latitude</label><input value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: e.target.value })} placeholder="Contoh: -6.123456" /></div>
                                        <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Longitude</label><input value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: e.target.value })} placeholder="Contoh: 106.123456" /></div>

                                        <div style={{ gridColumn: 'span 6', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1rem', color: 'var(--primary)' }}>Kode Area & Klasifikasi</h3>
                                        </div>
                                        <SearchableSelect
                                            label="Tarif"
                                            containerStyle={{ gridColumn: 'span 2', marginBottom: 0 }}
                                            options={tarifOptions.map(t => ({ value: t.kode_tarif, label: t.tarif }))}
                                            value={formData.kode_tarif}
                                            onChange={e => setFormData({ ...formData, kode_tarif: e.target.value })}
                                            placeholder="Pilih Tarif"
                                            searchPlaceholder="Cari tarif..."
                                        />
                                        <SearchableSelect
                                            label="Cabang"
                                            containerStyle={{ gridColumn: 'span 2', marginBottom: 0 }}
                                            options={cabangOptions.map(c => ({ value: c.kode_cabang, label: c.cabang }))}
                                            value={formData.kode_cabang}
                                            onChange={async (e) => {
                                                const kode = e.target.value;
                                                setFormData({ ...formData, kode_cabang: kode, kode_rute: '' });
                                                setRuteOptions([]);
                                                if (kode) {
                                                    const list = await fetchOptions('rute', { kode_cabang: kode });
                                                    setRuteOptions(list);
                                                } else {
                                                    const allRutes = await fetchOptions('rute');
                                                    setRuteOptions(allRutes);
                                                }
                                            }}
                                            placeholder="Pilih Cabang"
                                            searchPlaceholder="Cari cabang..."
                                            displayTop={true}
                                        />
                                        <SearchableSelect
                                            label="Rute"
                                            containerStyle={{ gridColumn: 'span 2', marginBottom: 0 }}
                                            disabled={!formData.kode_cabang}
                                            options={ruteOptions.map(r => ({ value: r.kode_rute, label: r.rute }))}
                                            value={formData.kode_rute}
                                            onChange={e => setFormData({ ...formData, kode_rute: e.target.value })}
                                            placeholder={formData.kode_cabang ? "Pilih Rute" : "Pilih Cabang Dahulu"}
                                            searchPlaceholder="Cari rute..."
                                            displayTop={true}
                                        />
                                        <SearchableSelect
                                            label="Kecamatan"
                                            containerStyle={{ gridColumn: 'span 2', marginBottom: 0 }}
                                            required={true}
                                            options={kecamatans.map(k => ({ value: k.kode_kecamatan, label: k.kecamatan }))}
                                            value={formData.kode_kecamatan}
                                            onChange={async (e) => {
                                                const kode = e.target.value;
                                                const selected = kecamatans.find(k => k.kode_kecamatan === kode);
                                                setFormData({ ...formData, kode_kecamatan: kode, kode_desa: '', kode_rw: '', kode_rt: '' });
                                                setSelectedIds({ kec: selected?.id || null, desa: null, rw: null });
                                                setDesas([]); setRws([]); setRts([]);
                                                if (selected) { const list = await fetchZones('desa', { kec_id: selected.id }); setDesas(list); }
                                            }}
                                            placeholder="Pilih Kecamatan"
                                            searchPlaceholder="Cari kecamatan..."
                                            displayTop={true}
                                        />
                                        <SearchableSelect
                                            label="Desa"
                                            containerStyle={{ gridColumn: 'span 2', marginBottom: 0 }}
                                            required={true}
                                            disabled={!formData.kode_kecamatan}
                                            options={desas.map(d => ({ value: d.kode_desa, label: d.desa }))}
                                            value={formData.kode_desa}
                                            onChange={async (e) => {
                                                const kode = e.target.value;
                                                const selected = desas.find(d => d.kode_desa === kode);
                                                setFormData({ ...formData, kode_desa: kode, kode_rw: '', kode_rt: '' });
                                                setSelectedIds(prev => ({ ...prev, desa: selected?.id || null, rw: null }));
                                                setRws([]); setRts([]);
                                                if (selected) { const list = await fetchZones('rw', { kec_id: selectedIds.kec, desa_id: selected.id }); setRws(list); }
                                            }}
                                            placeholder="Pilih Desa"
                                            searchPlaceholder="Cari desa..."
                                            displayTop={true}
                                        />
                                        <div className="form-row" style={{ gridColumn: 'span 2' }}>
                                            <SearchableSelect
                                                label="RW"
                                                options={rws.map(r => ({ value: r.kode_rw, label: r.rw }))}
                                                value={formData.kode_rw}
                                                disabled={!formData.kode_desa}
                                                onChange={async (e) => {
                                                    const kode = e.target.value;
                                                    const selected = rws.find(r => r.kode_rw === kode);
                                                    setFormData({ ...formData, kode_rw: kode, kode_rt: '' });
                                                    setRts([]);
                                                    if (selected) { const list = await fetchZones('rt', { kec_id: selectedIds.kec, desa_id: selectedIds.desa, rw_id: selected.id }); setRts(list); }
                                                }}
                                                placeholder="RW"
                                                searchPlaceholder="Cari RW..."
                                                displayTop={true}
                                            />
                                            <SearchableSelect
                                                label="RT"
                                                options={rts.map(r => ({ value: r.kode_rt, label: r.rt }))}
                                                value={formData.kode_rt}
                                                disabled={!formData.kode_rw}
                                                onChange={(e) => setFormData({ ...formData, kode_rt: e.target.value })}
                                                placeholder="RT"
                                                searchPlaceholder="Cari RT..."
                                                displayTop={true}
                                            />
                                        </div>
                                    </div>
                                    <div style={{
                                        borderTop: '1px solid #f1f5f9',
                                        marginTop: '2rem',
                                        paddingTop: '1.5rem',
                                        paddingBottom: '1rem', // Added some padding at the very bottom
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: '1rem'
                                    }}>
                                        <button type="button" className="btn btn-outline" style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', fontWeight: 600, minWidth: '100px' }} onClick={handleCloseModal}>Batal</button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            style={{
                                                padding: '0.625rem 2rem',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                minWidth: '160px',
                                                boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)',
                                                opacity: (uploadingState.meter || uploadingState.rumah) ? 0.7 : 1,
                                                cursor: (uploadingState.meter || uploadingState.rumah) ? 'not-allowed' : 'pointer'
                                            }}
                                            disabled={uploadingState.meter || uploadingState.rumah}
                                        >
                                            {(uploadingState.meter || uploadingState.rumah) ? 'Memproses Foto...' : (editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }
            </div>
            <div onClick={e => e.stopPropagation()}>
                <SimpleImageViewer
                    isOpen={!!previewImage}
                    onClose={() => setPreviewImage(null)}
                    imageSrc={previewImage && previewImage.startsWith('/') ? `${API_BASE_URL}${previewImage}` : previewImage}
                    onSaveRotation={handleSaveRotation}
                />
            </div>
        </>
    );
}

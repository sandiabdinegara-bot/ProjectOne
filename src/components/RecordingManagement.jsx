import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Droplets, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, FileSpreadsheet, FileText, Printer, X, User, Camera, Upload, SlidersHorizontal, ChevronDown, Calendar, HardDrive, MapPin } from 'lucide-react';
import SearchableSelect from './common/SearchableSelect';
import CustomDatePicker from './common/CustomDatePicker';
import MonthYearPicker from './common/MonthYearPicker';
import { subMonths, startOfMonth } from 'date-fns';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';



import { BASE_URL } from '../config';
import { fetchWithAuth } from '../api';

const CUSTOMER_API = './api/customers.php';
const API_BASE_URL = BASE_URL;
const API_URL = `${BASE_URL}/pencatatan`;

const ALL_COLUMNS = [
    { id: 'id_sambungan', label: 'NO. SAMBUNGAN' },
    { id: 'nama', label: 'NAMA PELANGGAN' },
    { id: 'id_meter', label: 'ID METER' },
    { id: 'alamat', label: 'ALAMAT' },
    { id: 'stan_akhir', label: 'STAN AKHIR' },
    { id: 'petugas', label: 'PETUGAS' },
    { id: 'foto', label: 'FOTO METER' },
    { id: 'foto_rumah', label: 'FOTO RUMAH' },
    { id: 'status_laporan', label: 'KONDISI METER' },
    { id: 'koordinat', label: 'KOORDINAT' },
    { id: 'pemakaian', label: 'PEMAKAIAN (m³)' },
    { id: 'update_date', label: 'TGL PENCATATAN' }
];

const DEFAULT_COLUMNS = ['id_sambungan', 'nama', 'id_meter', 'alamat', 'stan_akhir', 'pemakaian', 'petugas', 'foto', 'foto_rumah', 'status_laporan', 'koordinat', 'update_date'];

export default function RecordingManagement({ isHistory = false }) {
    const [recordings, setRecordings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [filteredCustomersForForm, setFilteredCustomersForForm] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecording, setEditingRecording] = useState(null);
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);
    const columnMenuRef = useRef(null);
    const searchMenuRef = useRef(null);

    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('pdam_visible_columns_rec_v7');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchCategory, setSearchCategory] = useState('nama');
    const [fotoPreview, setFotoPreview] = useState(null);
    const [fotoRumahPreview, setFotoRumahPreview] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFileRumah, setSelectedFileRumah] = useState(null);

    // AI OCR States
    const [ocrResult, setOcrResult] = useState(null);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [aiDebugImage, setAiDebugImage] = useState(null);
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const customerDropdownRef = useRef(null);


    const [formData, setFormData] = useState({
        id_pelanggan: '',
        id_sambungan: '',
        id_meter: '',
        nama: '',
        alamat: '',
        bulan: new Date().getMonth() + 1,
        tahun: new Date().getFullYear(),
        stan_akhir: 0,
        foto: '',
        foto_rumah: '',
        kode_tarif: '',
        longitude: '',
        latitude: '',
        petugas: 'Admin',
        status_laporan: ''
    });

    const [customerHistory, setCustomerHistory] = useState([]);

    const [officers, setOfficers] = useState([]);
    const [statusKondisiOptions, setStatusKondisiOptions] = useState([]);

    useEffect(() => {
        fetchRecordings();
        fetchCustomers();
        fetchOfficers();
        fetchStatusKondisi();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
                setIsColumnMenuOpen(false);
            }
            if (searchMenuRef.current && !searchMenuRef.current.contains(event.target)) {
                setIsSearchMenuOpen(false);
            }
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setIsCustomerDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchOfficers = async () => {
        try {
            const res = await fetchWithAuth('./api/officers.php');
            const data = await res.json();
            setOfficers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch officers:', err);
        }
    };

    const fetchStatusKondisi = async () => {
        try {
            const res = await fetchWithAuth('./api/options.php?type=status_kondisi');
            const data = await res.json();
            setStatusKondisiOptions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch status kondisi:', err);
        }
    };

    const fetchRecordings = async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(API_URL);
            const data = await res.json();
            setRecordings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch recordings:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetchWithAuth(CUSTOMER_API);
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch customers:', err);
        }
    };

    // Fetch History when Customer is selected
    useEffect(() => {
        if (!formData.id_pelanggan) {
            setCustomerHistory([]);
            return;
        }

        // Calculate previous month and year
        let prevMonth = formData.bulan - 1;
        let prevYear = formData.tahun;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear = formData.tahun - 1;
        }

        // History Logic: Only show the record from exactly 1 month prior
        const history = recordings.filter(r =>
            (r.id_pelanggan == formData.id_pelanggan || r.id_sambungan == formData.id_sambungan) &&
            r.bulan == prevMonth &&
            r.tahun == prevYear
        );
        setCustomerHistory(history);

    }, [formData.id_pelanggan, formData.bulan, formData.tahun, recordings]);

    // AI Validation Logic
    const validateWithAI = async (imageFile, userInput) => {
        if (!imageFile || !userInput) return;

        setIsOcrLoading(true);
        try {
            const formDataAi = new FormData();
            formDataAi.append('image', imageFile);
            formDataAi.append('user_input', userInput);

            const response = await fetchWithAuth('http://localhost:5000/validate', {
                method: 'POST',
                body: formDataAi
            });

            const data = await response.json();
            if (data.error) {
                console.error("AI Error:", data.error);
                setOcrResult({ status: 'ERROR', message: data.error });
            } else {
                setOcrResult({
                    similarity: data.similarity_percent,
                    status: data.status,
                    detected: data.detected,
                    bestMatch: data.best_match
                });
                if (data.debug_image) setAiDebugImage(data.debug_image);
            }
        } catch (err) {
            console.error("AI fetch failed:", err);
            setOcrResult({ status: 'ERROR', message: 'Koneksi ke AI terputus' });
        } finally {
            setIsOcrLoading(false);
        }
    };

    // Helper for URL to File transformation
    const urlToFile = async (url, filename) => {
        try {
            const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
            const response = await fetchWithAuth(fullUrl);
            const blob = await response.blob();
            if (blob.type.startsWith('text/html')) {
                throw new Error('Fetched HTML instead of image (likely 404)');
            }
            return new File([blob], filename, { type: blob.type });
        } catch (error) {
            console.error("urlToFile failed:", error, "URL:", url);
            return null;
        }
    };

    useEffect(() => {
        localStorage.setItem('pdam_visible_columns_rec_v2', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
                setIsColumnMenuOpen(false);
            }
            if (searchMenuRef.current && !searchMenuRef.current.contains(event.target)) {
                setIsSearchMenuOpen(false);
            }
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setIsCustomerDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectOfficer = async (officerName) => {
        setFormData(prev => ({ ...prev, petugas: officerName }));

        if (!officerName) {
            setFilteredCustomersForForm(customers);
            return;
        }

        const officer = officers.find(o => o.nama === officerName);
        if (officer) {
            try {
                const res = await fetchWithAuth(`./api/customers.php?officer_id=${officer.id}`);
                const data = await res.json();
                setFilteredCustomersForForm(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to filter customers by officer:', err);
                setFilteredCustomersForForm(customers);
            }
        }
    };

    const handleSelectCustomer = async (customerId) => {
        const customer = customers.find(c => c.id == customerId);
        if (customer) {
            // Find history to set default stan_akhir
            let prevMonth = formData.bulan - 1;
            let prevYear = formData.tahun;
            if (prevMonth === 0) {
                prevMonth = 12;
                prevYear = formData.tahun - 1;
            }

            const history = recordings.find(r =>
                (r.id_pelanggan == customer.id || r.id_sambungan == customer.id_sambungan) &&
                r.bulan == prevMonth &&
                r.tahun == prevYear
            );

            setFormData(prev => ({
                ...prev,
                id_pelanggan: customer.id,
                id_sambungan: customer.id_sambungan,
                id_meter: customer.id_meter,
                nama: customer.nama,
                alamat: customer.alamat,
                kode_tarif: customer.kode_tarif,
                stan_akhir: 0,
                longitude: '',
                latitude: '',
                petugas: '' // Reset officer to force selection or auto-pick
            }));

            // Fetch officers for this customer's route
            if (customer.kode_rute) {
                try {
                    const res = await fetchWithAuth(`./api/officers.php?route_code=${customer.kode_rute}`);
                    const data = await res.json();
                    setOfficers(Array.isArray(data) ? data : []);

                    // If only one officer, auto-select
                    if (Array.isArray(data) && data.length === 1) {
                        setFormData(prev => ({ ...prev, petugas: data[0].nama }));
                    }
                } catch (err) {
                    console.error('Failed to fetch officers for route:', err);
                }
            } else {
                fetchOfficers(); // Reset to all officers if no route
            }
        }
    };

    // Removed handleMeterChange since logic is simplified

    const handleOpenModal = async (recording = null) => {
        if (recording) {
            setEditingRecording(recording);
            setFormData({ ...recording });
            setFotoPreview(recording.foto || null);
            setFotoRumahPreview(recording.foto_rumah || null);
            setSelectedFile(null);
            setSelectedFileRumah(null);

            // Fetch officers for this customer's route even in Edit mode
            const customer = customers.find(c => c.id == recording.id_pelanggan);
            if (customer && customer.kode_rute) {
                try {
                    const res = await fetchWithAuth(`./api/officers.php?route_code=${customer.kode_rute}`);
                    const data = await res.json();
                    let filteredOfficers = Array.isArray(data) ? data : [];

                    // Ensure the original officer is in the list even if they don't match the route assignment
                    if (recording.petugas && !filteredOfficers.some(o => o.nama === recording.petugas)) {
                        const allRes = await fetchWithAuth('./api/officers.php');
                        const allData = await allRes.json();
                        const originalOfficer = (allData || []).find(o => o.nama === recording.petugas);
                        if (originalOfficer) filteredOfficers.push(originalOfficer);
                    }

                    setOfficers(filteredOfficers);

                    // Auto-set the officer name if it's currently empty
                    if (!recording.petugas && filteredOfficers.length === 1) {
                        setFormData(prev => ({ ...prev, petugas: filteredOfficers[0].nama }));
                    }
                } catch (err) {
                    console.error('Failed to fetch officers for edit:', err);
                }
            }
        } else {
            setEditingRecording(null);
            setFormData({
                id_pelanggan: '', id_sambungan: '', id_meter: '', nama: '', alamat: '',
                bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear(),
                stan_akhir: 0, foto: '', foto_rumah: '',
                kode_tarif: '', longitude: '', latitude: '', petugas: '', status_laporan: ''
            });
            setCustomerHistory([]);
            setFotoRumahPreview(null);
            setSelectedFile(null);
            setSelectedFileRumah(null);

            setFilteredCustomersForForm(customers);

            // Re-fetch all officers when opening modal for new entry
            fetchOfficers();
        }
        setIsCustomerDropdownOpen(false);
        setCustomerSearch('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRecording(null);
        setFotoPreview(null);
        setFotoRumahPreview(null);
        setSelectedFile(null);
        setSelectedFileRumah(null);
        setIsUploading(false);
        setUploadProgress(0);
        setOcrResult(null);
        setAiDebugImage(null);
    };

    const handleFileChange = (e, type = 'foto') => {
        const file = e.target.files[0];
        if (file) {
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
                        if (type === 'foto_rumah') {
                            setFotoRumahPreview(reader.result);
                            setSelectedFileRumah(file);
                        } else {
                            setFotoPreview(reader.result);
                            setSelectedFile(file);
                            // TRIGER OCR: Only if stan_akhir is already filled
                            if (formData.stan_akhir && Number(formData.stan_akhir) !== 0) {
                                validateWithAI(file, formData.stan_akhir);
                            }
                        }
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

    const handleResetPhoto = (type) => {
        if (type === 'foto') {
            setFotoPreview(null);
            setSelectedFile(null);
            setOcrResult(null);
            setAiDebugImage(null);
            setFormData(prev => ({ ...prev, foto: null }));
        } else {
            setFotoRumahPreview(null);
            setSelectedFileRumah(null);
            setFormData(prev => ({ ...prev, foto_rumah: null }));
        }
    };

    // Real-time Score Recalculation (Local)
    useEffect(() => {
        if (ocrResult && ocrResult.detected && isModalOpen) {
            const target = formData.stan_akhir || "";
            const detected = ocrResult.detected;

            // Unordered Digit Matching Logic (Same as Python V7)
            const tempDetected = detected.split('');
            let matchCount = 0;

            for (const digit of String(target)) {
                const idx = tempDetected.indexOf(digit);
                if (idx !== -1) {
                    matchCount++;
                    tempDetected.splice(idx, 1);
                }
            }

            const newRatio = String(target).length > 0 ? (matchCount / String(target).length) * 100 : 0;

            let newStatus = "RED";
            if (newRatio >= 99.9) newStatus = "GREEN";
            else if (newRatio >= 50) newStatus = "YELLOW";

            // Only update if similarity changed to avoid loops
            if (newRatio !== ocrResult.similarity) {
                setOcrResult(prev => ({
                    ...prev,
                    similarity: Math.round(newRatio * 100) / 100,
                    status: newStatus
                }));
            }
        }
    }, [formData.stan_akhir, isModalOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isUploading) return;

        const body = new FormData();
        Object.keys(formData).forEach(key => {
            if (key !== 'foto' && key !== 'foto_rumah') {
                body.append(key, (formData[key] === 0 || formData[key]) ? formData[key] : '');
            }
        });

        if (selectedFile) {
            body.append('foto', selectedFile);
        } else if (formData.foto) {
            body.append('foto', formData.foto);
        }

        if (selectedFileRumah) {
            body.append('foto_rumah', selectedFileRumah);
        } else if (formData.foto_rumah) {
            body.append('foto_rumah', formData.foto_rumah);
        }

        if (ocrResult && ocrResult.status) {
            body.append('ai_ocr_status', ocrResult.status);
        }

        const url = editingRecording ? `${API_URL}?id=${editingRecording.id}` : API_URL;

        try {
            Swal.fire({
                title: 'Menyimpan Data...',
                text: 'Mohon tunggu sebentar',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const res = await fetchWithAuth(url, { method: 'POST', body });
            const data = await res.json();
            if (data.message) {
                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Data pencatatan berhasil disimpan.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchRecordings();
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
            title: 'Hapus Pencatatan?',
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
            const res = await fetchWithAuth(`${API_URL}?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.message) {
                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Data pencatatan telah dihapus.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchRecordings();
            }
        } catch (err) {
            console.error('Delete failed:', err);
            Swal.fire('Error!', 'Gagal menghapus data.', 'error');
        }
    };

    // Export Logic
    const exportToCSV = () => {
        const visibleCols = ALL_COLUMNS.filter(col => visibleColumns.includes(col.id));
        const headers = visibleCols.map(col => col.label);

        const rows = filteredRecordings.map(rec => {
            return visibleCols.map(col => {
                if (col.id === 'status_laporan') {
                    return statusKondisiOptions.find(s => s.kode_kondisi === rec.status_laporan)?.status_kondisi || rec.status_laporan || '-';
                }
                if (col.id === 'koordinat') {
                    return rec.latitude && rec.longitude ? `${rec.latitude}, ${rec.longitude}` : '-';
                }
                if (col.id === 'pemakaian') {
                    return calculateUsage(rec);
                }
                if (col.id === 'update_date') {
                    return rec.update_date ? rec.update_date.slice(0, 10) : '-';
                }
                return rec[col.id] || '-';
            });
        });

        const csvContent = [headers, ...rows].map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const prefix = isHistory ? 'history_pencatatan' : 'pencatatan_berjalan';
        link.setAttribute("download", `${prefix}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToExcel = () => {
        const visibleCols = ALL_COLUMNS.filter(col => visibleColumns.includes(col.id));

        const data = filteredRecordings.map(rec => {
            const item = {};
            visibleCols.forEach(col => {
                let val = rec[col.id];
                if (col.id === 'status_laporan') {
                    val = statusKondisiOptions.find(s => s.kode_kondisi === rec.status_laporan)?.status_kondisi || rec.status_laporan || '-';
                } else if (col.id === 'koordinat') {
                    val = rec.latitude && rec.longitude ? `${rec.latitude}, ${rec.longitude}` : '-';
                } else if (col.id === 'pemakaian') {
                    val = calculateUsage(rec);
                } else if (col.id === 'update_date') {
                    val = rec.update_date ? rec.update_date.slice(0, 10) : '-';
                }
                item[col.label] = val || '-';
            });
            return item;
        });
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pencatatan");
        const prefix = isHistory ? 'history_pencatatan' : 'pencatatan_berjalan';
        XLSX.writeFile(workbook, `${prefix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        const now = new Date().toLocaleString('id-ID');
        const visibleCols = ALL_COLUMNS.filter(col => visibleColumns.includes(col.id));

        doc.setFontSize(18);
        doc.setTextColor(14, 165, 233);
        const title = isHistory ? "Laporan History Pencatatan Meter PDAM" : "Laporan Pencatatan Meter PDAM Bulan Berjalan";
        doc.text(title, 14, 15);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Jumlah Total: ${filteredRecordings.length} Data`, 14, 22);
        doc.text(`Waktu Cetak: ${now}`, 280, 22, { align: 'right' });

        const tableColumn = visibleCols.map(col => col.label);
        const tableRows = filteredRecordings.map(rec => {
            return visibleCols.map(col => {
                if (col.id === 'status_laporan') {
                    return statusKondisiOptions.find(s => s.kode_kondisi === rec.status_laporan)?.status_kondisi || rec.status_laporan || '-';
                }
                if (col.id === 'koordinat') {
                    return rec.latitude && rec.longitude ? `${rec.latitude}, ${rec.longitude}` : '-';
                }
                if (col.id === 'pemakaian') {
                    return calculateUsage(rec);
                }
                if (col.id === 'update_date') {
                    return rec.update_date ? rec.update_date.slice(0, 10) : '-';
                }
                return rec[col.id] || '-';
            });
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [241, 245, 249], textColor: [100, 116, 139], fontStyle: 'bold' }
        });
        // Signature Footer
        const finalY = doc.lastAutoTable.finalY || 28;
        const signatureY = finalY + 20;

        // Ensure we don't go off page
        if (signatureY + 40 > doc.internal.pageSize.height) {
            doc.addPage();
            doc.text(`Waktu Cetak: ${now}`, 280, 22, { align: 'right' });
        }

        const currentUser = localStorage.getItem('username') || 'Admin';

        doc.setFontSize(10);
        doc.setTextColor(50);

        // Right aligned signature box
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const textX = pageWidth - margin - 40; // Center of the signature area

        doc.text("Dicetak oleh,", textX, signatureY, { align: 'center' });
        doc.text("_______________________", textX, signatureY + 25, { align: 'center' });
        doc.text(currentUser, textX, signatureY + 30, { align: 'center' });

        const prefix = isHistory ? 'riwayat_pencatatan' : 'pencatatan_berjalan';
        doc.save(`${prefix}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handlePrint = () => window.print();

    const [filterDate, setFilterDate] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState(() => subMonths(startOfMonth(new Date()), 1));

    // Filter Logic
    const calculateUsage = (rec) => {
        // Find previous month data
        let prevMonth = parseInt(rec.bulan) - 1;
        let prevYear = parseInt(rec.tahun);
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }

        const prevRec = recordings.find(r =>
            r.id_pelanggan === rec.id_pelanggan &&
            parseInt(r.bulan) === prevMonth &&
            parseInt(r.tahun) === prevYear
        );

        if (!prevRec) return "Data Belum Tersedia";
        const usage = parseInt(rec.stan_akhir) - parseInt(prevRec.stan_akhir);
        // If negative, return 0 for billing/display purposes but keep the internal logic for analysis
        if (parseInt(rec.stan_akhir) === 0) return 0;
        return usage;
    };

    const filteredRecordings = recordings.filter(rec => {
        if (isHistory) {
            // Filter by Month and Year
            const recDate = rec.update_date ? new Date(rec.update_date) : null;
            if (!recDate) return false;

            const targetMonth = selectedMonth.getMonth();
            const targetYear = selectedMonth.getFullYear();

            if (recDate.getMonth() !== targetMonth || recDate.getFullYear() !== targetYear) return false;
        } else {
            // 1. Filter by Date (YYYY-MM-DD)
            const recDate = rec.update_date?.slice(0, 10);
            const targetDate = filterDate ? new Date(filterDate.getTime() - (filterDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 10) : null;
            if (targetDate && recDate !== targetDate) return false;
        }

        // 2. Filter by Search Term
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;

        if (searchCategory === 'nama') return (rec.nama?.toLowerCase() || '').includes(term);
        if (searchCategory === 'id_sambungan') return (rec.id_sambungan?.toLowerCase() || '').includes(term);
        if (searchCategory === 'petugas') return (rec.petugas?.toLowerCase() || '').includes(term);

        return (rec.nama?.toLowerCase() || '').includes(term);
    });

    useEffect(() => { setCurrentPage(1); }, [searchTerm, itemsPerPage]);

    const getPageNumbers = () => {
        let pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const totalPages = Math.ceil(filteredRecordings.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRecordings.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
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

                        .customer-table th, .customer-table td { 
                            border: 1px solid #000 !important; 
                            padding: 2px 4px !important;
                            white-space: normal !important;
                            word-break: break-word;
                            font-size: 7pt !important;
                        }
                        @page {
                            size: landscape;
                            margin: 0.5cm;
                        }
                        .print-footer { display: block !important; position: fixed; bottom: 0; right: 0; width: 300px; text-align: center; font-size: 10pt; color: #000; }
                    }
                    .print-footer { display: none; }

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
                        {isHistory ? 'History Pencatatan' : 'Pencatatan Meter'}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                        {isHistory ? 'History lengkap pencatatan meter pelanggan' : 'Manajemen pencatatan meter pelanggan bulan berjalan'}
                    </p>
                </div>
                <div className="header-actions no-print">
                    <button className="btn btn-outline" onClick={exportToCSV} title="Export CSV" style={{ height: '42px', width: '42px', padding: 0, borderRadius: '8px' }}><Download size={18} /></button>
                    <button className="btn btn-outline" onClick={exportToExcel} title="Export Excel" style={{ height: '42px', width: '42px', padding: 0, borderRadius: '8px' }}><FileSpreadsheet size={18} /></button>
                    <button className="btn btn-outline" onClick={exportToPDF} title="Export PDF" style={{ height: '42px', width: '42px', padding: 0, borderRadius: '8px' }}><FileText size={18} /></button>
                    <button className="btn btn-outline" onClick={handlePrint} title="Print" style={{ height: '42px', width: '42px', padding: 0, borderRadius: '8px' }}><Printer size={18} /></button>
                    {!isHistory && (
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
                            <span className="hide-mobile">Tambah Catatan</span>
                        </button>
                    )}
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
                                    padding: '1.25rem', minWidth: '240px', maxHeight: '450px', overflowY: 'auto'
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Tampilkan Kolom</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem' }}>
                                        {ALL_COLUMNS.filter(c => isHistory || c.id !== 'pemakaian').map(col => (
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
                                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <button onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.id))} style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Pilih Semua</button>
                                        <button onClick={() => setVisibleColumns(DEFAULT_COLUMNS)} style={{ fontSize: '0.8rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Reset Default</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search Filter */}
                        <div style={{ position: 'relative' }} ref={searchMenuRef}>
                            <button className="btn btn-outline" onClick={() => setIsSearchMenuOpen(!isSearchMenuOpen)}
                                style={{
                                    height: '42px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem',
                                    background: isSearchMenuOpen ? '#f1f5f9' : '#f8fafc',
                                    border: `1px solid ${isSearchMenuOpen ? 'var(--primary)' : 'var(--border)'}`,
                                    color: isSearchMenuOpen ? 'var(--primary)' : 'var(--text)', borderRadius: '8px', minWidth: '100px',
                                    fontWeight: 600
                                }}>
                                <span>Filter</span>
                                <ChevronDown size={16} />
                            </button>
                            {isSearchMenuOpen && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000, background: 'white',
                                    border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', padding: '0.5rem', minWidth: '200px'
                                }}>
                                    {[
                                        { id: 'nama', label: 'By Nama' },
                                        { id: 'id_sambungan', label: 'By No. Sambungan' },
                                        { id: 'petugas', label: 'By Petugas' }
                                    ].map(opt => (
                                        <button key={opt.id} onClick={() => { setSearchCategory(opt.id); setIsSearchMenuOpen(false); }}
                                            style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: searchCategory === opt.id ? '#f1f5f9' : 'none', color: searchCategory === opt.id ? 'var(--primary)' : 'var(--text)', borderRadius: '8px', cursor: 'pointer' }}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Custom Date Picker Filter / Month Picker */}
                        {isHistory ? (
                            <MonthYearPicker
                                value={selectedMonth}
                                onChange={(date) => setSelectedMonth(date)}
                                disableCurrent={true}
                                disablePastYears={true}
                            />
                        ) : (
                            <CustomDatePicker
                                value={filterDate}
                                onChange={(date) => setFilterDate(date)}
                            />
                        )}

                        <div style={{ position: 'relative', flex: '0 1 350px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input style={{ paddingLeft: '2.5rem', paddingRight: searchTerm ? '2.5rem' : '0.625rem', height: '42px', borderRadius: '8px', border: '1px solid var(--border)', background: '#f8fafc', width: '100%' }}
                                placeholder="Ketik kata kunci pencarian..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            {searchTerm && <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={16} /></button>}
                        </div>
                    </div>
                </div>

                {
                    loading ? <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-light)' }}>Loading recordings...</div> : (
                        <div className="table-container" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
                            <table className="customer-table" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
                                <thead>
                                    <tr>
                                        <th className="sticky-col-left" style={{ width: '60px', minWidth: '60px', textAlign: 'center' }}>NO</th>
                                        {visibleColumns.includes('id_sambungan') && (
                                            <th style={{ width: '140px', minWidth: '140px', textAlign: 'left' }}>NO. SAMBUNGAN</th>
                                        )}
                                        {visibleColumns.includes('nama') && <th style={{ width: '200px', minWidth: '200px', textAlign: 'left' }}>NAMA PELANGGAN</th>}
                                        {visibleColumns.includes('id_meter') && <th style={{ width: '120px', minWidth: '120px', textAlign: 'left' }}>ID METER</th>}
                                        {visibleColumns.includes('alamat') && <th style={{ width: '250px', minWidth: '250px', textAlign: 'left' }}>ALAMAT</th>}
                                        {visibleColumns.includes('stan_akhir') && <th style={{ width: '100px', minWidth: '100px', textAlign: 'center' }}>STAN AKHIR</th>}
                                        {isHistory && visibleColumns.includes('pemakaian') && <th style={{ width: '150px', minWidth: '150px', textAlign: 'center' }}>PEMAKAIAN (m³)</th>}
                                        {visibleColumns.includes('petugas') && <th style={{ width: '150px', minWidth: '150px', textAlign: 'left' }}>PETUGAS</th>}
                                        {visibleColumns.includes('foto') && <th style={{ width: '110px', minWidth: '110px', textAlign: 'center' }}>FOTO METER</th>}
                                        {visibleColumns.includes('foto_rumah') && <th style={{ width: '110px', minWidth: '110px', textAlign: 'center' }}>FOTO RUMAH</th>}
                                        {visibleColumns.includes('status_laporan') && <th style={{ width: '140px', minWidth: '140px', textAlign: 'center' }}>KONDISI METER</th>}
                                        {visibleColumns.includes('koordinat') && <th style={{ width: '150px', minWidth: '150px', textAlign: 'left' }}>KOORDINAT</th>}
                                        {visibleColumns.includes('update_date') && <th style={{ width: '140px', minWidth: '140px', textAlign: 'left' }}>TGL PENCATATAN</th>}
                                        {!isHistory && (
                                            <th className="no-print sticky-col-right" style={{ width: '100px', minWidth: '100px', textAlign: 'center', background: '#f8fafc', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AKSI</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length > 0 ? currentItems.map((rec, index) => (
                                        <tr key={rec.id}>
                                            <td className="sticky-col-left" style={{ width: '60px', minWidth: '60px', textAlign: 'center', fontWeight: 500, color: '#64748b' }}>
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            {visibleColumns.includes('id_sambungan') && (
                                                <td style={{ width: '140px', minWidth: '140px', fontWeight: 600, textAlign: 'left' }}>{rec.id_sambungan}</td>
                                            )}
                                            {visibleColumns.includes('nama') && <td style={{ width: '200px', minWidth: '200px', textAlign: 'left' }}>{rec.nama}</td>}
                                            {visibleColumns.includes('id_meter') && <td style={{ width: '120px', minWidth: '120px', textAlign: 'left' }}>{rec.id_meter}</td>}
                                            {visibleColumns.includes('alamat') && <td title={rec.alamat} style={{ width: '250px', maxWidth: '250px', minWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{rec.alamat}</td>}
                                            {visibleColumns.includes('stan_akhir') && (
                                                <td style={{ width: '100px', minWidth: '100px', textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                                                    {rec.stan_akhir}
                                                </td>
                                            )}
                                            {isHistory && visibleColumns.includes('pemakaian') && (
                                                <td style={{ width: '150px', minWidth: '150px', textAlign: 'center' }}>
                                                    {(() => {
                                                        const val = calculateUsage(rec);
                                                        if (val === "Data Belum Tersedia") {
                                                            return (
                                                                <span style={{
                                                                    fontSize: '0.7rem',
                                                                    color: '#64748b',
                                                                    background: '#f1f5f9',
                                                                    padding: '0.2rem 0.5rem',
                                                                    borderRadius: '4px',
                                                                    fontWeight: 500,
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    DATA BELUM TERSEDIA
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                                                                {val}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            )}
                                            {visibleColumns.includes('petugas') && <td style={{ width: '150px', minWidth: '150px', textAlign: 'left' }}>{rec.petugas}</td>}
                                            {visibleColumns.includes('foto') && (
                                                <td style={{ width: '110px', minWidth: '110px', textAlign: 'center' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '1px solid #e2e8f0', color: '#94a3b8', overflow: 'hidden', cursor: rec.foto ? 'pointer' : 'default' }}
                                                        onClick={() => rec.foto && setPreviewImage(rec.foto)}
                                                        title={rec.foto ? 'Klik untuk memperbesar' : 'Tidak ada foto'}>
                                                        {rec.foto ? <img src={rec.foto.startsWith('/') ? `${API_BASE_URL}${rec.foto}` : rec.foto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={16} />}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.includes('foto_rumah') && (
                                                <td style={{ width: '110px', minWidth: '110px', textAlign: 'center' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '1px solid #e2e8f0', color: '#94a3b8', overflow: 'hidden', cursor: rec.foto_rumah ? 'pointer' : 'default' }}
                                                        onClick={() => rec.foto_rumah && setPreviewImage(rec.foto_rumah)}
                                                        title={rec.foto_rumah ? 'Klik untuk memperbesar' : 'Tidak ada foto'}>
                                                        {rec.foto_rumah ? <img src={rec.foto_rumah.startsWith('/') ? `${API_BASE_URL}${rec.foto_rumah}` : rec.foto_rumah} alt="Foto Rumah" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={16} />}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.includes('status_laporan') && (
                                                <td style={{ width: '140px', minWidth: '140px', textAlign: 'center' }}>
                                                    {(() => {
                                                        const statusLabel = statusKondisiOptions.find(s => s.kode_kondisi === rec.status_laporan)?.status_kondisi || rec.status_laporan;
                                                        const isNormal = statusLabel === 'Normal';
                                                        return (
                                                            <span style={{
                                                                padding: '0.25rem 0.75rem',
                                                                borderRadius: '9999px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                backgroundColor: isNormal ? '#dcfce7' : (statusLabel ? '#fee2e2' : '#f1f5f9'),
                                                                color: isNormal ? '#166534' : (statusLabel ? '#991b1b' : '#64748b'),
                                                                display: 'inline-block'
                                                            }}>
                                                                {statusLabel || '-'}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            )}
                                            {visibleColumns.includes('koordinat') && (
                                                <td style={{ width: '150px', minWidth: '150px', textAlign: 'left' }}>
                                                    {rec.latitude && rec.longitude ? (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'underline', fontSize: '0.75rem' }}
                                                            title="Buka di Google Maps"
                                                        >
                                                            <span style={{ letterSpacing: '-0.02em' }}>{rec.latitude}, {rec.longitude}</span>
                                                        </a>
                                                    ) : '-'}
                                                </td>
                                            )}
                                            {visibleColumns.includes('update_date') && <td style={{ width: '140px', minWidth: '140px', fontSize: '0.75rem', textAlign: 'left' }}>{rec.update_date?.slice(0, 10)}</td>}
                                            {!isHistory && (
                                                <td className="no-print sticky-col-right" style={{ width: '100px', minWidth: '100px', textAlign: 'center', background: 'inherit', padding: '0.625rem 0.75rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                                                        <button className="btn btn-outline" style={{ padding: '0.25rem', width: '28px', height: '28px', borderRadius: '6px' }} onClick={() => handleOpenModal(rec)} title="Edit"><Edit2 size={14} /></button>
                                                        <button className="btn btn-outline" style={{ padding: '0.25rem', width: '28px', height: '28px', borderRadius: '6px', color: '#ef4444' }} onClick={() => handleDelete(rec.id)} title="Hapus"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={visibleColumns.length + 2} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>Tidak ada data pencatatan ditemukan.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )
                }

                {!loading && filteredRecordings.length > 0 && (
                    <div className="no-print" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                            Menampilkan <span style={{ fontWeight: 600, color: 'var(--text)' }}>{indexOfFirstItem + 1}</span> sampai <span style={{ fontWeight: 600, color: 'var(--text)' }}>{Math.min(indexOfLastItem, filteredRecordings.length)}</span> dari <span style={{ fontWeight: 600, color: 'var(--text)' }}>{filteredRecordings.length}</span> pencatatan
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', marginBottom: 0 }}>Baris per halaman:</label>
                                <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} style={{ width: 'auto', padding: '0.25rem 0.5rem', height: 'auto' }}>
                                    {[10, 25, 50, 100].map(val => <option key={val} value={val}>{val}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button className="btn btn-outline" style={{ padding: '0.4rem' }} disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft size={18} /></button>
                                <button className="btn btn-outline" style={{ padding: '0.4rem' }} disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}><ChevronLeft size={18} /></button>
                                {getPageNumbers().map(num => (
                                    <button key={num} className={`btn ${currentPage === num ? 'btn-primary' : 'btn-outline'}`} style={{ minWidth: '36px', height: '36px', padding: 0, justifyContent: 'center' }} onClick={() => setCurrentPage(num)}>{num}</button>
                                ))}
                                <button className="btn btn-outline" style={{ padding: '0.4rem' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}><ChevronRight size={18} /></button>
                                <button className="btn btn-outline" style={{ padding: '0.4rem' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}><ChevronsRight size={18} /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {
                isModalOpen && (
                    <div className="modal-overlay" style={{ animation: 'fadeIn 0.2s', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
                        <div className="modal-content" style={{ animation: 'slideUp 0.3s', maxWidth: '950px', borderRadius: '20px', padding: 0, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                                    {editingRecording ? 'Edit' : 'Tambah'} Catatan Meter
                                </h2>
                                <button onClick={handleCloseModal} style={{ width: '36px', height: '36px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                                <div className="modal-grid">
                                    {/* Left Side: Form Inputs */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                        <div className="form-group" style={{ position: 'relative' }} ref={customerDropdownRef}>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Pelanggan</label>
                                            <div
                                                onClick={() => !editingRecording && setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    borderRadius: '10px',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '0.95rem',
                                                    background: !!editingRecording ? '#f8fafc' : 'white',
                                                    cursor: !!editingRecording ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    minHeight: '45px'
                                                }}
                                            >
                                                <span style={{ color: formData.id_pelanggan ? '#1e293b' : '#94a3b8' }}>
                                                    {formData.id_pelanggan
                                                        ? `${formData.id_sambungan} - ${formData.nama}`
                                                        : 'Cari dan Pilih Pelanggan'}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {formData.id_pelanggan && !editingRecording && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    id_pelanggan: '',
                                                                    id_sambungan: '',
                                                                    id_meter: '',
                                                                    nama: '',
                                                                    alamat: '',
                                                                    kode_tarif: '',
                                                                    petugas: ''
                                                                }));
                                                                setCustomerHistory([]);
                                                                setIsCustomerDropdownOpen(false);
                                                            }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                padding: '4px',
                                                                cursor: 'pointer',
                                                                color: '#94a3b8',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                borderRadius: '50%'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                            title="Hapus pilihan"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                    {!editingRecording && <ChevronDown size={18} style={{ color: '#94a3b8', transform: isCustomerDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                                                </div>
                                            </div>

                                            {isCustomerDropdownOpen && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    zIndex: 100,
                                                    background: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '10px',
                                                    marginTop: '4px',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                    overflow: 'hidden',
                                                    animation: 'fadeIn 0.1s ease-out'
                                                }}>
                                                    <div style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                                        <div style={{ position: 'relative' }}>
                                                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                placeholder="Cari pelanggan (Nama / No. Sambungan)..."
                                                                value={customerSearch}
                                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid #e2e8f0',
                                                                    fontSize: '0.875rem'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                                        {filteredCustomersForForm
                                                            .filter(c =>
                                                                (c.nama || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
                                                                (c.id_sambungan || '').toLowerCase().includes(customerSearch.toLowerCase())
                                                            )
                                                            .map(c => (
                                                                <div
                                                                    key={c.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSelectCustomer(c.id);
                                                                        setIsCustomerDropdownOpen(false);
                                                                        setCustomerSearch('');
                                                                    }}
                                                                    style={{
                                                                        padding: '0.75rem 1rem',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.875rem',
                                                                        borderBottom: '1px solid #f8fafc',
                                                                        background: formData.id_pelanggan == c.id ? '#f0f9ff' : 'white',
                                                                        color: formData.id_pelanggan == c.id ? '#0ea5e9' : '#1e293b'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.background = formData.id_pelanggan == c.id ? '#f0f9ff' : 'white'}
                                                                >
                                                                    <div style={{ fontWeight: 600 }}>{c.id_sambungan}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.nama} - {c.alamat}</div>
                                                                </div>
                                                            ))}
                                                        {filteredCustomersForForm.filter(c =>
                                                            (c.nama || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
                                                            (c.id_sambungan || '').toLowerCase().includes(customerSearch.toLowerCase())
                                                        ).length === 0 && (
                                                                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                                                                    Pelanggan tidak ditemukan
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Tanggal Pencatatan</label>
                                            <div style={{
                                                width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc',
                                                display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem'
                                            }}>
                                                <Calendar size={16} />
                                                <span style={{ fontWeight: 600 }}>
                                                    {editingRecording
                                                        ? new Date(formData.tahun, formData.bulan - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
                                                        : new Date().toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Stan Awal (Bulan Lalu)</label>
                                            <div style={{
                                                width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0',
                                                background: customerHistory.length > 0 ? '#f0f9ff' : '#fff1f2',
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                color: customerHistory.length > 0 ? '#0369a1' : '#be123c',
                                                fontSize: '0.95rem', fontWeight: 700
                                            }}>
                                                <HardDrive size={16} />
                                                <span>
                                                    {customerHistory.length > 0 ? customerHistory[0].stan_akhir : 'Stan Awal Belum Tersedia'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Stan Akhir</label>
                                                <input
                                                    type="number"
                                                    style={{ width: '100%', padding: '0 0.75rem', height: '48px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                                    value={formData.stan_akhir}
                                                    onChange={(e) => setFormData({ ...formData, stan_akhir: e.target.value })}
                                                    onBlur={() => {
                                                        if (formData.stan_akhir && Number(formData.stan_akhir) !== 0 && selectedFile && !ocrResult) {
                                                            validateWithAI(selectedFile, formData.stan_akhir);
                                                        }
                                                    }}
                                                    placeholder="0"
                                                    autoComplete="off"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Pemakaian (m³)</label>
                                                <div style={{
                                                    width: '100%', padding: '0 0.75rem', height: '48px', borderRadius: '10px', border: '1px solid #e2e8f0',
                                                    background: '#f8fafc',
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    color: (formData.stan_akhir && Number(formData.stan_akhir) !== 0 && customerHistory.length > 0 && (Number(formData.stan_akhir) - Number(customerHistory[0].stan_akhir)) < 0) ? '#ef4444' : '#1e293b',
                                                    fontSize: '0.95rem', fontWeight: 800
                                                }}>
                                                    <Droplets size={16} color={(formData.stan_akhir && Number(formData.stan_akhir) !== 0 && customerHistory.length > 0 && (Number(formData.stan_akhir) - Number(customerHistory[0].stan_akhir)) < 0) ? '#ef4444' : '#0ea5e9'} />
                                                    <span>
                                                        {(() => {
                                                            const stanAkhir = Number(formData.stan_akhir);
                                                            if (!formData.stan_akhir || stanAkhir === 0) return "0 m³";
                                                            const stanAwal = customerHistory.length > 0 ? Number(customerHistory[0].stan_akhir) : 0;
                                                            const usage = stanAkhir - stanAwal;
                                                            return usage + " m³" + (usage < 0 ? " (Meter Mundur)" : "");
                                                        })()}
                                                    </span>
                                                </div>
                                                {/* Real OCR Badge Registration */}
                                                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                                    {isOcrLoading ? (
                                                        <div style={{ color: '#64748b', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <div className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></div>
                                                            <span>Menganalisa...</span>
                                                        </div>
                                                    ) : ocrResult ? (
                                                        <>
                                                            {ocrResult.status === 'ERROR' ? (
                                                                <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.7rem' }}>
                                                                    ⚠️ {ocrResult.message}
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <span className="badge" style={{
                                                                        backgroundColor: ocrResult.status === 'GREEN' ? '#dcfce7' : (ocrResult.status === 'YELLOW' ? '#fef9c3' : '#fee2e2'),
                                                                        color: ocrResult.status === 'GREEN' ? '#166534' : (ocrResult.status === 'YELLOW' ? '#854d0e' : '#991b1b'),
                                                                        fontSize: '0.75rem',
                                                                        padding: '0.25rem 0.75rem',
                                                                        border: '1px solid',
                                                                        borderColor: ocrResult.status === 'GREEN' ? '#bbf7d0' : (ocrResult.status === 'YELLOW' ? '#fef08a' : '#fecaca')
                                                                    }}>
                                                                        {ocrResult.status === 'GREEN' ? '✅ Match 100%' : (ocrResult.status === 'YELLOW' ? `⚠️ Match ${ocrResult.similarity}%` : `❌ Mismatch (${ocrResult.similarity}%)`)}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <SearchableSelect
                                                    label="Petugas"
                                                    value={formData.petugas}
                                                    onChange={(e) => setFormData({ ...formData, petugas: e.target.value })}
                                                    options={officers
                                                        .filter(officer => officer.status_aktif === 'Aktif')
                                                        .map(o => ({ value: o.nama, label: o.cabang ? `Cabang ${o.cabang}` : '' }))
                                                    }
                                                    placeholder="Pilih Petugas"
                                                    searchPlaceholder="Cari petugas..."
                                                    disabled={!!editingRecording}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <SearchableSelect
                                                    label="Status Laporan"
                                                    value={formData.status_laporan}
                                                    onChange={(e) => setFormData({ ...formData, status_laporan: e.target.value })}
                                                    options={statusKondisiOptions.map(s => ({ value: s.kode_kondisi, label: s.status_kondisi }))}
                                                    placeholder="Pilih Status Laporan"
                                                    searchPlaceholder="Cari status laporan..."
                                                    hideValue={true}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Latitude</label>
                                                <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="Contoh: -6.123456" />
                                            </div>
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Longitude</label>
                                                <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="Contoh: 106.123456" />
                                            </div>
                                        </div>

                                    </div>

                                    {/* Right Side: History & Photos */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                        {/* History Table */}
                                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
                                                <Calendar size={16} /> History Pencatatan
                                            </div>
                                            {customerHistory.length > 0 ? (
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Bulan</th>
                                                                <th style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Stan Akhir</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {customerHistory.map(h => (
                                                                <tr key={h.id}>
                                                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>{new Date(0, h.bulan - 1).toLocaleString('id-ID', { month: 'short' })} {h.tahun}</td>
                                                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>{h.stan_akhir}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '1rem', color: '#ef4444', fontSize: '0.75rem', fontStyle: 'italic', fontWeight: 600 }}>
                                                    Stan Awal Belum Tersedia
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }}></div>

                                        {/* Photos */}
                                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                            {[
                                                { id: 'foto', label: 'FOTO METER', preview: fotoPreview },
                                                { id: 'foto_rumah', label: 'FOTO RUMAH', preview: fotoRumahPreview }
                                            ].map(item => (
                                                <div key={item.id} style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{
                                                        width: '100%',
                                                        aspectRatio: '4/3',
                                                        border: editingRecording ? '2px solid #e2e8f0' : '2px dashed #e2e8f0',
                                                        borderRadius: '12px',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        background: editingRecording ? '#f1f5f9' : '#f8fafc',
                                                        cursor: editingRecording ? 'default' : 'pointer',
                                                        opacity: editingRecording ? 0.8 : 1
                                                    }}>
                                                        {item.preview ? (
                                                            <img src={item.preview && item.preview.startsWith('/') ? `${API_BASE_URL}${item.preview}` : item.preview} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: editingRecording ? 'grayscale(20%)' : 'none' }} alt="Preview" />
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                                                                <Camera size={24} />
                                                                <span style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Tidak Ada Foto</span>
                                                            </div>
                                                        )}
                                                        {!editingRecording && (
                                                            <input type="file" onChange={(e) => handleFileChange(e, item.id)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                                        )}
                                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.65rem', padding: '6px', fontWeight: 600, textAlign: 'center' }}>
                                                            {item.label} {editingRecording && '(View Only)'}
                                                        </div>
                                                        {item.preview && !editingRecording && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleResetPhoto(item.id); }}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '4px',
                                                                    right: '4px',
                                                                    zIndex: 20,
                                                                    background: '#ef4444',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: 'white',
                                                                    cursor: 'pointer',
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                                }}
                                                                title="Hapus Foto"
                                                            >
                                                                <X size={12} strokeWidth={3} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {isUploading && <div style={{ fontSize: '0.75rem', color: 'var(--primary)', textAlign: 'center' }}>Mengupload foto... ({Math.round(uploadProgress)}%)</div>}

                                    </div>
                                </div>

                                <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" className="btn btn-outline" style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', fontWeight: 600 }} onClick={handleCloseModal}>Batal</button>
                                    <button type="submit" className="btn btn-primary" style={{
                                        padding: '0.625rem 2rem',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
                                    }} disabled={isUploading}>
                                        {isUploading ? 'Memproses...' : (editingRecording ? 'Simpan Perubahan' : 'Simpan Data')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                previewImage && (
                    <div className="lightbox-overlay" onClick={() => setPreviewImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.2s' }}>
                        <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()}>
                            <button style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setPreviewImage(null)}><X size={32} /></button>
                            <img src={previewImage && previewImage.startsWith('/') ? `${API_BASE_URL}${previewImage}` : previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} />
                        </div>
                    </div>
                )
            }
            {/* Print Footer */}
            <div className="print-footer">
                <p style={{ margin: '0 0 40px 0' }}>Dicetak oleh,</p>
                <div style={{ borderBottom: '1px solid black', width: '200px', margin: '0 auto 10px auto' }}></div>
                <p>{localStorage.getItem('username') || 'Admin'}</p>
            </div>
        </div >
    );
}

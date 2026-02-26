import React, { useState, useEffect, useRef, useMemo } from 'react';
import SimpleImageViewer from './common/SimpleImageViewer';
import { Search, Droplets, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, FileSpreadsheet, FileText, Printer, BarChart2, SlidersHorizontal, Eye, RefreshCw, Edit2, ChevronDown, X, Calendar, Camera, ZoomIn, Trash2, HardDrive, MapPin, CheckCircle2, AlertCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import CustomDatePicker from './common/CustomDatePicker';
import { subMonths, startOfMonth, format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

const API_URL = './api/recordings.php';
const CUSTOMER_API = './api/customers.php';
const API_BASE_URL = 'http://localhost'; // Base URL for absolute paths (XAMPP)

const ALL_COLUMNS = [
    { id: 'id_sambungan', label: 'NO. SAMBUNGAN' },
    { id: 'id_meter', label: 'ID METER' },
    { id: 'id_tag', label: 'ID TAG' },
    { id: 'nama', label: 'NAMA' },
    { id: 'alamat', label: 'ALAMAT' },
    { id: 'kode_tarif', label: 'TARIF' },
    { id: 'stan_akhir', label: 'STAND AKHIR' },
    { id: 'stan_awal', label: 'STAN AWAL' },
    { id: 'koordinat', label: 'KOORDINAT' },
    { id: 'PEMAKAIAN (m³)', label: 'PEMAKAIAN (m³)' },
    { id: 'hasil_analisa', label: 'HASIL ANALISA' },
    { id: 'ai_ocr_status', label: 'STATUS OCR' },
    { id: 'status_laporan', label: 'KONDISI METER' },
    { id: 'tgl_verifikasi', label: 'TGL VERIFIKASI' }
];

const DEFAULT_COLUMNS = ['id_sambungan', 'id_meter', 'id_tag', 'nama', 'alamat', 'kode_tarif', 'stan_akhir', 'stan_awal', 'PEMAKAIAN (m³)', 'ai_ocr_status', 'hasil_analisa', 'status_laporan', 'tgl_verifikasi'];

// Helper Component for Edit Modal Content to prevent parent re-renders on typing
const EditRecordingForm = React.memo(({
    recording,
    initialFormData,
    officers,
    statusKondisiOptions,
    ocrStatusFilter,
    getCustomerInfo,
    getDerivedOcrStatus,
    onClose,
    onSubmit,
    setSimplePreviewImage,
    API_BASE_URL,
    loading
}) => {
    const [formData, setFormData] = useState(initialFormData);
    const [fotoPreview, setFotoPreview] = useState(recording.foto);
    const [fotoRumahPreview, setFotoRumahPreview] = useState(recording.foto_rumah);

    // Sync state when recording changes
    React.useEffect(() => {
        setFormData(initialFormData);
        setFotoPreview(recording.foto);
        setFotoRumahPreview(recording.foto_rumah);
    }, [recording.id, initialFormData]);

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (field === 'foto') {
                    setFotoPreview(reader.result);
                    setFormData(prev => ({ ...prev, foto: file }));
                } else {
                    setFotoRumahPreview(reader.result);
                    setFormData(prev => ({ ...prev, foto_rumah: file }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="modal-content" style={{ animation: 'slideUp 0.3s', width: '90%', maxWidth: '950px', borderRadius: '20px', padding: 0, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'white' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    Koreksi Analisa Meter
                </h2>
                <button type="button" onClick={onClose} style={{ width: '36px', height: '36px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={(e) => onSubmit(e, formData)} style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                {/* Detail Pelanggan Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem', borderLeft: '4px solid var(--primary)' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Detail Pelanggan</h3>
                    </div>
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem 1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Nama Pelanggan</div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>{formData.nama}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>No. Sambungan</div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155' }}>{formData.id_sambungan}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>ID Meter</div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155' }}>{formData.id_meter}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>ID Tag</div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155' }}>{formData.id_tag || getCustomerInfo(formData.id_pelanggan).id_tag || '-'}</div>
                        </div>
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                                {ocrStatusFilter === 'REVIEW' ? 'Pilih Status OCR' : 'Hasil OCR'}
                            </div>
                            {ocrStatusFilter === 'REVIEW' ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    {[
                                        { id: 'YELLOW', label: 'REVIEW', icon: <AlertCircle size={16} />, color: '#854d0e', bg: '#fef9c3' },
                                        { id: 'RED', label: 'TIDAK SESUAI', icon: <XCircle size={16} />, color: '#991b1b', bg: '#fee2e2' },
                                        { id: 'VERIFIED', label: 'VERIFIKASI', icon: <CheckCircle2 size={16} />, color: '#1d4ed8', bg: '#dbeafe' },
                                    ].map((status) => {
                                        const currentStatus = getDerivedOcrStatus(formData);
                                        const isActive = currentStatus === status.id;
                                        return (
                                            <button key={status.id} type="button" onClick={() => setFormData(prev => ({ ...prev, ai_ocr_status: status.id }))}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, transition: 'all 0.2s ease', cursor: 'pointer', border: isActive ? `2px solid ${status.color}` : '1px solid #e2e8f0', backgroundColor: isActive ? status.bg : '#fff', color: isActive ? status.color : '#64748b', boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transform: isActive ? 'scale(1.05)' : 'scale(1)' }}>
                                                {status.icon} <span>{status.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: getDerivedOcrStatus(formData) === 'GREEN' ? '#166534' : (getDerivedOcrStatus(formData) === 'YELLOW' ? '#854d0e' : (getDerivedOcrStatus(formData) === 'RED' ? '#991b1b' : (getDerivedOcrStatus(formData) === 'VERIFIED' ? '#1d4ed8' : '#64748b'))), fontWeight: 700, fontSize: '0.9rem' }}>
                                    {getDerivedOcrStatus(formData) === 'GREEN' && <CheckCircle2 size={18} />}
                                    {getDerivedOcrStatus(formData) === 'YELLOW' && <AlertCircle size={18} />}
                                    {getDerivedOcrStatus(formData) === 'RED' && <XCircle size={18} />}
                                    {(getDerivedOcrStatus(formData) === 'VERIFIED' || getDerivedOcrStatus(formData) === 'Sesuai (Manual)') && <CheckCircle2 size={18} />}
                                    <span style={{ textTransform: 'uppercase' }}>{getDerivedOcrStatus(formData) === 'GREEN' ? 'SESUAI' : (getDerivedOcrStatus(formData) === 'YELLOW' ? 'BUTUH REVIEW' : (getDerivedOcrStatus(formData) === 'RED' ? 'TIDAK SESUAI' : ((getDerivedOcrStatus(formData) === 'VERIFIED' || getDerivedOcrStatus(formData) === 'Sesuai (Manual)') ? 'SUDAH VERIFIKASI' : '-')))}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid-2-col">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Stan Awal (Bulan Lalu)</label>
                            <div style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f0f9ff', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0369a1', fontSize: '0.95rem', fontWeight: 700 }}>
                                <HardDrive size={16} /> <span>{formData.stan_awal}</span>
                            </div>
                        </div>
                        <div className="form-row" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Stan Akhir Input</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="number" value={formData.stan_akhir} onChange={(e) => setFormData(prev => ({ ...prev, stan_akhir: e.target.value }))} style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', fontWeight: 700 }} />
                                    <Edit2 size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Pemakaian (m³)</label>
                                <div style={{ width: '100%', padding: '0 0.75rem', height: '48px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontSize: '0.95rem', fontWeight: 800 }}>
                                    <Droplets size={16} color="#0ea5e9" />
                                    <span>{(() => { const akhir = Number(formData.stan_akhir || 0); if (akhir === 0) return "0 m³"; return (akhir - Number(formData.stan_awal || 0)) + " m³"; })()}</span>
                                </div>
                            </div>
                        </div>
                        {getDerivedOcrStatus(formData) !== 'GREEN' && (
                            <div className="form-group">
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Catatan Verifikasi {(getDerivedOcrStatus(formData) === 'YELLOW' || getDerivedOcrStatus(formData) === 'RED') && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                <textarea placeholder="Berikan alasan verifikasi atau catatan kesalahan (misal: Angka input tidak sama dengan foto)..." value={formData.verifikasi_catatan || ''} onChange={(e) => setFormData(prev => ({ ...prev, verifikasi_catatan: e.target.value }))} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.875rem', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                        )}
                    </div>
                    <div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            {[{ id: 'foto', label: 'FOTO METER', preview: fotoPreview }, { id: 'foto_rumah', label: 'FOTO RUMAH', preview: fotoRumahPreview }].map(item => (
                                <div key={item.id} style={{ textAlign: 'center', flex: 1 }}>
                                    <div onClick={() => item.preview && setSimplePreviewImage(item.preview)} style={{ width: '100%', aspectRatio: '4/3', border: '2px solid #e2e8f0', borderRadius: '12px', position: 'relative', overflow: 'hidden', background: '#f8fafc', cursor: item.preview ? 'pointer' : 'default' }}>
                                        {item.preview ? <img src={item.preview && item.preview.startsWith('/') ? `${API_BASE_URL}${item.preview}` : item.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.label} /> : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#cbd5e1' }}><Camera size={24} /><span style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Tidak Ada Foto</span></div>}
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.6rem', padding: '4px', textTransform: 'uppercase', fontWeight: 700 }}>{item.label}</div>
                                    </div>
                                    <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.4rem 0.75rem', fontSize: '0.7rem', cursor: 'pointer', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }}>
                                        <Camera size={14} /> Ganti Foto <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, item.id)} style={{ display: 'none' }} />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" className="btn btn-outline" style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', fontWeight: 600 }} onClick={onClose}>Batal</button>
                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.625rem 2rem', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)' }}>
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
        </div>
    );
});

export default function MeterAnalysis({ ocrStatusFilter }) {
    const [recordings, setRecordings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [statusKondisiOptions, setStatusKondisiOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);
    const columnMenuRef = useRef(null);
    const searchMenuRef = useRef(null);

    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('pdam_visible_columns_analysis');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [previousDetail, setPreviousDetail] = useState(null);
    const [customerHistory, setCustomerHistory] = useState([]);

    // AI OCR States
    const [ocrResult, setOcrResult] = useState(null);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [aiDebugImage, setAiDebugImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const previewModalRef = useRef(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchCategory, setSearchCategory] = useState('nama');
    const [filterDate, setFilterDate] = useState(new Date());

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

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecording, setEditingRecording] = useState(null);
    const [initialEditFormData, setInitialEditFormData] = useState(null); // Pass this to child
    const [officers, setOfficers] = useState([]);
    const [simplePreviewImage, setSimplePreviewImage] = useState(null);

    // Unified mount effect
    const fetchData = async () => {
        try {
            setLoading(true);

            // Format date for API (YYYY-MM-DD)
            const dateStr = filterDate ? new Date(filterDate.getTime() - (filterDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 10) : '';

            // Fetch recordings with date filter and high limit to get all data for analysis
            const recUrl = `${API_URL}?limit=1000&date=${dateStr}`;

            const [recRes, custRes] = await Promise.all([
                fetch(recUrl),
                fetch(CUSTOMER_API)
            ]);

            const [recData, custData] = await Promise.all([
                recRes.json(),
                custRes.json()
            ]);

            // Handle response format (success wrapper vs direct array)
            if (recData.status === 'success') {
                setRecordings(recData.data);
            } else if (Array.isArray(recData)) {
                setRecordings(recData);
            } else {
                setRecordings([]);
            }

            setCustomers(Array.isArray(custData) ? custData : []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            Swal.fire('Error', 'Gagal memuat data analis.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatusKondisi = async () => {
        try {
            const res = await fetch('./api/options.php?type=status_kondisi');
            const data = await res.json();
            setStatusKondisiOptions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch status kondisi:', err);
        }
    };

    const getCustomerInfo = (id_pelanggan) => {
        return customers.find(c => String(c.id) === String(id_pelanggan)) || {};
    };

    const getStanAwal = (rec) => {
        let prevMonth = parseInt(rec.bulan) - 1;
        let prevYear = parseInt(rec.tahun);
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }

        const prevRec = recordings.find(r =>
            (String(r.id_pelanggan) === String(rec.id_pelanggan) || (r.id_sambungan && rec.id_sambungan && String(r.id_sambungan) === String(rec.id_sambungan))) &&
            parseInt(r.bulan) === prevMonth &&
            parseInt(r.tahun) === prevYear
        );

        return prevRec ? parseInt(prevRec.stan_akhir) : 0;
    };

    const getGoogleMapsUrl = (lat, lng) => {
        if (!lat || !lng) return null;
        return `https://www.google.com/maps?q=${lat},${lng}`;
    };

    const [statusAnalisaOptions, setStatusAnalisaOptions] = useState([]);
    useEffect(() => {
        fetchData();
        fetchStatusKondisi();
        fetchStatusAnalisa();
        fetchOfficers();
    }, [filterDate]);

    const fetchOfficers = async () => {
        try {
            const res = await fetch('./api/officers.php');
            const data = await res.json();
            setOfficers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching officers:', error);
            setOfficers([]);
        }
    };

    const handleEditClick = async (row) => {
        setEditingRecording(row);
        const stanAwal = getStanAwal(row);
        const usage = parseInt(row.stan_akhir) - stanAwal;

        setInitialEditFormData({
            id: row.id,
            id_pelanggan: row.id_pelanggan,
            id_sambungan: row.id_sambungan,
            id_meter: row.id_meter,
            nama: row.nama,
            alamat: row.alamat,
            kode_tarif: row.kode_tarif,
            stan_awal: stanAwal,
            stan_akhir: row.stan_akhir,
            pemakaian: usage,
            petugas: row.petugas,
            status_laporan: row.status_laporan,
            latitude: row.latitude,
            longitude: row.longitude,
            foto: row.foto,
            foto_rumah: row.foto_rumah,
            bulan: row.bulan,
            tahun: row.tahun,
            ai_ocr_status: row.ai_ocr_status,
            verifikasi_catatan: row.verifikasi_catatan || ''
        });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingRecording(null);
        setInitialEditFormData(null);
    };
    const handleEditSubmit = async (e, finalFormData) => {
        e.preventDefault();

        // Validation for Verification Notes
        const currentOcrStatus = getDerivedOcrStatus(finalFormData);
        if ((currentOcrStatus === 'YELLOW' || currentOcrStatus === 'RED') && !finalFormData.verifikasi_catatan?.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Catatan Wajib Diisi',
                text: `Mohon isi Catatan Verifikasi untuk status ${currentOcrStatus === 'YELLOW' ? 'Review' : 'Tidak Sesuai'}`,
                confirmButtonColor: 'var(--primary)'
            });
            return;
        }

        try {
            setLoading(true);
            const body = new FormData();
            const now = new Date();
            const timestamp = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

            Object.keys(finalFormData).forEach(key => {
                body.append(key, (finalFormData[key] === 0 || finalFormData[key]) ? finalFormData[key] : '');
            });

            const originalStatus = getDerivedOcrStatus(editingRecording);
            if (originalStatus === 'YELLOW' || originalStatus === 'RED') {
                body.append('tgl_verifikasi', timestamp);
            }

            const res = await fetch(`${API_URL}${editingRecording ? '?id=' + editingRecording.id : ''}`, {
                method: 'POST',
                body: body
            });

            if (!res.ok) throw new Error('Failed to update recording');

            await fetchData();
            handleCloseEditModal();

            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: 'Data pencatatan berhasil diperbarui',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error saving edit:', error);
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat menyimpan data' });
        } finally {
            setLoading(false);
        }
    };


    // Column Menu Click Outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
                setIsColumnMenuOpen(false);
            }
            if (searchMenuRef.current && !searchMenuRef.current.contains(event.target)) {
                setIsSearchMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ... (keep existing useEffects)

    const fetchStatusAnalisa = async () => {
        try {
            const res = await fetch('./api/options.php?type=status_analisa');
            const data = await res.json();
            setStatusAnalisaOptions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch status analisa:', err);
        }
    };

    // ... (existing helper functions)

    const calculateUsage = (rec) => {
        const stanAwal = getStanAwal(rec);
        const usage = parseInt(rec.stan_akhir) - stanAwal;
        if (parseInt(rec.stan_akhir) === 0) return 0;
        return usage;
    };

    const getAnalysisStatus = (usage) => {
        if (usage < 0) return 'Meter Mundur';
        if (!statusAnalisaOptions.length) return '-';

        // Find matching range
        const status = statusAnalisaOptions.find(opt => {
            const min = parseInt(opt.min);
            const max = parseInt(opt.max);
            return usage >= min && usage <= max;
        });

        return status ? status.status_analisa : '-';
    };

    const getAnalysisBadgeColor = (status) => {
        if (!status) return '#64748b';
        const s = status.toLowerCase();
        if (s.includes('mundur')) return '#ef4444'; // Red for negative/mundur
        if (s.includes('lonjakan') || s.includes('tinggi') || s.includes('diatas')) return '#f97316'; // Orange for high usage
        if (s.includes('periksa')) return '#eab308'; // Yellow for warning
        if (s.includes('nol') || s.includes('tidak ada')) return '#8b5cf6'; // Purple for zero
        if (s.includes('normal')) return '#22c55e'; // Green for normal
        return '#64748b';
    };

    const getDerivedOcrStatus = (rec) => {
        if (!rec) return '';
        // If explicit status exists, use it (matches statusMap keys)
        if (rec.ai_ocr_status) return String(rec.ai_ocr_status);
        // Fallback for missing status but has data
        if (rec.stan_akhir && rec.foto) return 'GREEN';
        return '';
    };

    const filteredData = React.useMemo(() => {
        let items = recordings.filter(rec => {
            // 1. OCR Status Filter (Top Priority)
            // If ocrStatusFilter is active, show matching records
            if (ocrStatusFilter) {
                const currentStatus = getDerivedOcrStatus(rec);
                const normalizedCurrent = String(currentStatus).toUpperCase().trim();

                if (ocrStatusFilter === 'REVIEW') {
                    // Review mode shows both YELLOW (needs human review) and RED (mismatch)
                    if (normalizedCurrent !== 'YELLOW' && normalizedCurrent !== 'RED') return false;
                } else {
                    const targetStatus = String(ocrStatusFilter).toUpperCase().trim();
                    if (normalizedCurrent !== targetStatus) return false;
                }
            }

            // 2. Date Filter - Now handled by API, but we keep a check to be safe or if data lingers
            // const recDate = rec.update_date?.slice(0, 10);
            // const targetDate = filterDate ? new Date(filterDate.getTime() - (filterDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 10) : null;
            // if (targetDate && recDate !== targetDate) return false;

            // 3. Search Term Filter
            const term = searchTerm.toLowerCase().trim();
            if (!term) return true;

            const customer = getCustomerInfo(rec.id_pelanggan);
            const searchableText = [
                rec.nama,
                rec.id_sambungan,
                rec.id_meter,
                customer.id_tag
            ].filter(Boolean).map(s => String(s).toLowerCase()).join(' ');

            return searchableText.includes(term);
        });

        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'PEMAKAIAN (m³)') {
                    aValue = calculateUsage(a);
                    bValue = calculateUsage(b);
                } else if (sortConfig.key === 'hasil_analisa') {
                    aValue = getAnalysisStatus(calculateUsage(a));
                    bValue = getAnalysisStatus(calculateUsage(b));
                } else if (sortConfig.key === 'ai_ocr_status') {
                    aValue = getDerivedOcrStatus(a);
                    bValue = getDerivedOcrStatus(b);
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }

                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

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
    }, [recordings, searchTerm, filterDate, ocrStatusFilter, customers, sortConfig]);

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

    useEffect(() => { setCurrentPage(1); }, [searchTerm, itemsPerPage, filterDate]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getExportData = () => {
        const columns = ALL_COLUMNS.filter(col => visibleColumns.includes(col.id));
        const headers = columns.map(col => col.label);

        const rows = filteredData.map((rec, index) => {
            const customer = getCustomerInfo(rec.id_pelanggan);
            const stanAwal = getStanAwal(rec);
            const usage = calculateUsage(rec);

            return columns.map(col => {
                if (col.id === 'id_sambungan') return `="${rec.id_sambungan}"`;
                if (col.id === 'id_meter') return `="${rec.id_meter}"`;
                if (col.id === 'id_tag') return customer.id_tag ? `="${customer.id_tag}"` : '-';
                if (col.id === 'nama') return rec.nama;
                if (col.id === 'alamat') return rec.alamat;
                if (col.id === 'kode_tarif') return rec.kode_tarif;
                if (col.id === 'stan_akhir') return rec.stan_akhir;
                if (col.id === 'stan_awal') return stanAwal;
                if (col.id === 'koordinat') return rec.latitude && rec.longitude ? `${rec.latitude}, ${rec.longitude}` : '-';
                if (col.id === 'ai_ocr_status') {
                    const status = rec.ai_ocr_status || (rec.stan_akhir && rec.foto ? 'GREEN' : '');
                    return status === 'GREEN' ? 'Sesuai' : (status === 'YELLOW' ? 'Butuh Review' : (status === 'RED' ? 'Mismatch' : '-'));
                }
                if (col.id === 'PEMAKAIAN (m³)') return usage;
                if (col.id === 'hasil_analisa') return getAnalysisStatus(usage);
                if (col.id === 'status_laporan') return statusKondisiOptions.find(s => s.kode_kondisi === rec.status_laporan)?.status_kondisi || rec.status_laporan || '-';
                if (col.id === 'tgl_verifikasi') return rec.tgl_verifikasi ? format(new Date(rec.tgl_verifikasi), 'dd/MM/yyyy HH:mm:ss') : '-';
                return '';
            });
        });

        return { headers, rows, columns };
    };

    const exportToCSV = () => {
        const { headers, rows } = getExportData();
        const csvHeaders = ["No", ...headers];
        const csvRows = rows.map((row, index) => [index + 1, ...row]);

        const csvContent = [csvHeaders, ...csvRows].map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Analisa_Meter_${format(filterDate, 'dd_MMM_yyyy')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToExcel = () => {
        const { headers, rows } = getExportData();
        const data = rows.map((row, index) => {
            const rowObj = { "NO": index + 1 };
            headers.forEach((header, i) => {
                rowObj[header] = row[i];
            });
            return rowObj;
        });
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Analisa Baca Meter");
        XLSX.writeFile(workbook, `Analisa_Meter_${format(filterDate, 'dd_MMM_yyyy')}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        const now = new Date().toLocaleString('id-ID');
        const { headers, rows } = getExportData();

        doc.setFontSize(18);
        doc.setTextColor(14, 165, 233);
        doc.text("Laporan Analisa Baca Meter", 14, 15);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Tanggal: ${format(filterDate, 'dd MMMM yyyy')}`, 14, 22);
        doc.text(`Jumlah Data: ${filteredData.length}`, 14, 27);
        doc.text(`Dicetak pada: ${now}`, 280, 22, { align: 'right' });

        const tableColumn = ["No", ...headers];
        const tableRows = rows.map((row, index) => [index + 1, ...row]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 32,
            theme: 'grid',
            headStyles: { fillColor: [241, 245, 249], textColor: [100, 116, 139], fontStyle: 'bold' },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 }
            }
        });

        // Signature Footer
        const finalY = doc.lastAutoTable.finalY || 32;
        const signatureY = finalY + 20;

        // Ensure we don't go off page
        if (signatureY + 40 > doc.internal.pageSize.height) {
            doc.addPage();
            doc.text(`Dicetak pada: ${now}`, 280, 22, { align: 'right' });
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

        doc.save(`Analisa_Meter_${format(filterDate, 'dd_MMM_yyyy')}.pdf`);
    };

    const handlePrint = () => window.print();

    const fetchCustomerHistory = async (id_sambungan) => {
        // Placeholder for fetching customer history
        // In a real application, this would fetch data from an API
        console.log("Fetching history for:", id_sambungan);
        setCustomerHistory([]); // Clear previous history
        try {
            const response = await fetch(`./api/customer_history.php?id_sambungan=${id_sambungan}`);
            const data = await response.json();
            setCustomerHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching customer history:", error);
            setCustomerHistory([]);
        }
    };

    const handleOpenDetail = async (rec) => {
        if (!rec) return;
        setSelectedDetail(rec);

        // Get previous month data
        const prevData = recordings.find(item =>
            item.id_sambungan === rec.id_sambungan &&
            Number(item.bulan) === (Number(rec.bulan) === 1 ? 12 : Number(rec.bulan) - 1) &&
            Number(item.tahun) === (Number(rec.bulan) === 1 ? Number(rec.tahun) - 1 : Number(rec.tahun))
        );
        setPreviousDetail(prevData || null);
        setIsDetailModalOpen(true);

        // Fetch History
        fetchCustomerHistory(rec.id_sambungan);
    };
    const handleCloseDetail = () => {
        setIsDetailModalOpen(false);
        setSelectedDetail(null);
        setPreviousDetail(null);
        setCustomerHistory([]);
    };


    // AI Validation Logic
    const validateWithAI = async (imageFile, userInput) => {
        if (!imageFile || !userInput) return;

        setIsOcrLoading(true);
        try {
            const formDataAi = new FormData();
            formDataAi.append('image', imageFile);
            formDataAi.append('user_input', userInput);

            const response = await fetch('http://localhost:5000/validate', {
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
            const response = await fetch(fullUrl);
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


    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <style>
                {`
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    
                    .customer-table {
                        width: 100%;
                        border-collapse: separate;
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
                    .customer-table tbody tr { transition: all 0.2s ease; }
                    .customer-table tbody tr:nth-of-type(even) td { background-color: #fafbfc; }
                    .customer-table tbody tr:hover td { background-color: #eff6ff !important; }
                    .customer-table td { 
                        padding: 0.875rem 1.25rem !important; vertical-align: middle; 
                        border-bottom: 1px solid #f1f5f9; 
                        font-size: 0.875rem; color: #334155;
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
                    .customer-table tbody tr:nth-of-type(even) .sticky-col-left {
                        background-color: #fafbfc !important;
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
                    .customer-table tbody tr:nth-of-type(even) .sticky-col-right {
                        background-color: #fafbfc !important;
                    }

                    .badge { 
                        padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; 
                        display: inline-flex; align-items: center; gap: 0.35rem; white-space: nowrap;
                    }
                    
                    .card {
                        background: var(--surface); border-radius: var(--radius);
                        box-shadow: var(--shadow);
                        padding: 1.5rem; border: 1px solid var(--border);
                    }

                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; margin: 0 !important; }
                        .card { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }
                        .customer-table { font-size: 7pt !important; width: 100% !important; border-collapse: collapse !important; }
                        .customer-table th, .customer-table td { 
                            border: 1px solid #000 !important; 
                            padding: 2px 4px !important; 
                            white-space: normal !important;
                            word-break: break-word;
                        }
                        @page { size: landscape; margin: 0.5cm; }
                        .print-footer { display: block !important; position: fixed; bottom: 0; right: 0; width: 300px; text-align: center; font-size: 10pt; color: #000; }
                    }
                    .print-footer { display: none; }
                    @media (max-width: 768px) {
                        .header {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 1rem;
                        }
                        .header-actions {
                            width: 100%;
                            justify-content: flex-start;
                            overflow-x: auto;
                            padding-bottom: 0.5rem;
                        }
                        .hide-mobile {
                            display: none;
                        }
                        .table-container {
                            margin: 1rem 0 !important;
                            width: 100% !important;
                            overflow-x: auto !important;
                        }
                        .card {
                            padding: 1rem !important;
                        }
                    }
                `}
            </style>

            <header className="header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                        <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.625rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BarChart2 size={32} color="var(--primary)" />
                        </div>
                        {ocrStatusFilter === 'REVIEW' ? 'Update Analisa Meter' : 'Analisa Baca Meter'}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                        {ocrStatusFilter === 'REVIEW'
                            ? 'Review dan verifikasi hasil pembacaan meter otomatis (Kuning & Merah)'
                            : 'Dashboard analisis penggunaan meter pelanggan seluruh area'}
                    </p>
                </div>
                <div className="header-actions no-print" style={{ display: 'flex', gap: '0.5rem' }}>
                    {ocrStatusFilter === 'REVIEW' ? (
                        <button
                            className="btn btn-primary"
                            onClick={fetchData}
                            disabled={loading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.625rem 1.25rem',
                                borderRadius: '8px',
                                fontWeight: 600,
                                boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
                            }}
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            {loading ? 'Memuat...' : 'Refresh Data'}
                        </button>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </header>


            <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>
                <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }} ref={columnMenuRef}>
                        <button className="btn btn-outline" onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                            style={{ height: '42px', padding: '0 1.25rem', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <SlidersHorizontal size={18} /><span>Pilih Kolom</span>
                        </button>
                        {isColumnMenuOpen && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000, background: 'white', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '1.25rem', minWidth: '240px' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Tampilkan Kolom</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {ALL_COLUMNS.map(col => (
                                        <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', cursor: 'pointer', borderRadius: '6px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                                            <input type="checkbox" checked={visibleColumns.includes(col.id)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} onChange={() => setVisibleColumns(prev => prev.includes(col.id) ? prev.filter(id => id !== col.id) : [...prev, col.id])} />
                                            <span style={{ fontSize: '0.875rem', color: visibleColumns.includes(col.id) ? 'var(--text)' : 'var(--text-light)' }}>{col.label}</span>
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

                    {/* Search Category Filter */}
                    <div style={{ position: 'relative' }} ref={searchMenuRef}>
                        <button className="btn btn-outline" onClick={() => setIsSearchMenuOpen(!isSearchMenuOpen)}
                            style={{
                                height: '42px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem',
                                background: isSearchMenuOpen ? '#f1f5f9' : '#f8fafc',
                                border: `1px solid ${isSearchMenuOpen ? 'var(--primary)' : 'var(--border)'}`,
                                color: isSearchMenuOpen ? 'var(--primary)' : 'var(--text)', borderRadius: '8px', minWidth: '100px'
                            }}>
                            <span style={{ fontWeight: 600 }}>Filter</span>
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
                                    { id: 'id_meter', label: 'By ID Meter' },
                                    { id: 'id_tag', label: 'By ID Tag' }
                                ].map(opt => (
                                    <button key={opt.id} onClick={() => { setSearchCategory(opt.id); setIsSearchMenuOpen(false); }}
                                        style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: searchCategory === opt.id ? '#f1f5f9' : 'none', color: searchCategory === opt.id ? 'var(--primary)' : 'var(--text)', borderRadius: '8px', cursor: 'pointer' }}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ height: '42px', display: 'flex', alignItems: 'center' }}>
                        <CustomDatePicker value={filterDate} onChange={setFilterDate} />
                    </div>

                    <div style={{ position: 'relative', flex: '0 1 350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                        <input style={{ paddingLeft: '2.5rem', paddingRight: searchTerm ? '2.5rem' : '0.625rem', height: '42px', borderRadius: '8px', border: '1px solid var(--border)', background: '#f8fafc', width: '100%', fontSize: '0.875rem' }}
                            placeholder="Ketik kata kunci pencarian..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        {searchTerm && <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={16} /></button>}
                    </div>
                </div>

                <div className="table-container" style={{ flex: 1, overflow: 'auto', minHeight: 0, margin: '1rem -1rem 0', width: 'calc(100% + 2rem)' }}>
                    <table className="customer-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th className="sticky-col-left" style={{ width: '80px', textAlign: 'center' }}>NO</th>
                                {visibleColumns.includes('id_sambungan') && (
                                    <th onClick={() => handleSort('id_sambungan')} style={{ width: '180px', minWidth: '180px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            NO. SAMBUNGAN {getSortIcon('id_sambungan')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.includes('id_meter') && (
                                    <th onClick={() => handleSort('id_meter')} style={{ width: '150px', minWidth: '150px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            ID METER {getSortIcon('id_meter')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.includes('id_tag') && (
                                    <th onClick={() => handleSort('id_tag')} style={{ width: '150px', minWidth: '150px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            ID TAG {getSortIcon('id_tag')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.includes('nama') && (
                                    <th onClick={() => handleSort('nama')} style={{ width: '250px', minWidth: '250px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            NAMA {getSortIcon('nama')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.includes('alamat') && (
                                    <th onClick={() => handleSort('alamat')} style={{ width: '350px', minWidth: '350px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            ALAMAT {getSortIcon('alamat')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.includes('kode_tarif') && (
                                    <th onClick={() => handleSort('kode_tarif')} style={{ width: '100px', minWidth: '100px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            TARIF {getSortIcon('kode_tarif')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.includes('stan_akhir') && (
                                    <th onClick={() => handleSort('stan_akhir')} style={{ width: '130px', minWidth: '130px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            STAND AKHIR {getSortIcon('stan_akhir')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.includes('stan_awal') && (
                                    <th onClick={() => handleSort('stan_awal')} style={{ width: '130px', minWidth: '130px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            STAN AWAL {getSortIcon('stan_awal')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.includes('koordinat') && <th style={{ width: '200px', minWidth: '200px', textAlign: 'left' }}>KOORDINAT</th>}
                                {visibleColumns.includes('PEMAKAIAN (m³)') && (
                                    <th onClick={() => handleSort('PEMAKAIAN (m³)')} style={{ width: '160px', minWidth: '160px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            PEMAKAIAN (m³) {getSortIcon('PEMAKAIAN (m³)')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.includes('ai_ocr_status') && (
                                    <th onClick={() => handleSort('ai_ocr_status')} style={{ width: '180px', minWidth: '180px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            STATUS OCR {getSortIcon('ai_ocr_status')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.includes('hasil_analisa') && (
                                    <th onClick={() => handleSort('hasil_analisa')} style={{ width: '180px', minWidth: '180px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            HASIL ANALISA {getSortIcon('hasil_analisa')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.includes('status_laporan') && (
                                    <th onClick={() => handleSort('status_laporan')} style={{ width: '180px', minWidth: '180px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            KONDISI METER {getSortIcon('status_laporan')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.includes('tgl_verifikasi') && (
                                    <th onClick={() => handleSort('tgl_verifikasi')} style={{ width: '180px', minWidth: '180px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            TGL VERIFIKASI {getSortIcon('tgl_verifikasi')}
                                        </div>
                                    </th>
                                )}
                                <th className="no-print sticky-col-right" style={{ width: '120px', minWidth: '120px', textAlign: 'center' }}>AKSI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={visibleColumns.length + 2} style={{ textAlign: 'center', padding: '3rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <RefreshCw size={32} className="animate-spin" color="var(--primary)" />
                                        <span style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Memuat data...</span>
                                    </div>
                                </td></tr>
                            ) : currentItems.length === 0 ? (
                                <tr><td colSpan={visibleColumns.length + 2} style={{ textAlign: 'center', padding: '3rem' }}>
                                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Tidak ada data ditemukan</div>
                                </td></tr>
                            ) : (
                                currentItems.map((rec, index) => {
                                    const customer = getCustomerInfo(rec.id_pelanggan);
                                    const stanAwal = getStanAwal(rec);
                                    const usage = calculateUsage(rec);

                                    return (
                                        <tr key={rec.id}>
                                            <td className="sticky-col-left" style={{ textAlign: 'center', fontWeight: 500, color: '#64748b', padding: '0.625rem 0.75rem' }}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            {visibleColumns.includes('id_sambungan') && (
                                                <td style={{ textAlign: 'left' }}>{rec.id_sambungan}</td>
                                            )}
                                            {visibleColumns.includes('id_meter') && <td style={{ textAlign: 'left' }}>{rec.id_meter}</td>}
                                            {visibleColumns.includes('id_tag') && <td style={{ textAlign: 'left' }}>{customer.id_tag || '-'}</td>}
                                            {visibleColumns.includes('nama') && <td style={{ fontWeight: 600, color: '#334155', textAlign: 'left' }}>{rec.nama}</td>}
                                            {visibleColumns.includes('alamat') && <td style={{ fontSize: '0.8rem', maxWidth: '300px', whiteSpace: 'normal', textAlign: 'left' }}>{rec.alamat}</td>}
                                            {visibleColumns.includes('kode_tarif') && <td style={{ textAlign: 'center' }}>{rec.kode_tarif}</td>}
                                            {visibleColumns.includes('stan_akhir') && <td style={{ textAlign: 'center' }}>{rec.stan_akhir}</td>}
                                            {visibleColumns.includes('stan_awal') && <td style={{ textAlign: 'center' }}>{stanAwal}</td>}
                                            {visibleColumns.includes('koordinat') && (
                                                <td style={{ width: '180px', textAlign: 'left' }}>
                                                    {rec.latitude && rec.longitude ? (
                                                        <a
                                                            href={getGoogleMapsUrl(rec.latitude, rec.longitude)}
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
                                            {visibleColumns.includes('PEMAKAIAN (m³)') && <td style={{ fontWeight: 600, textAlign: 'center', color: '#0f172a', fontSize: '0.9rem' }}>{usage}</td>}
                                            {visibleColumns.includes('ai_ocr_status') && (
                                                <td style={{ textAlign: 'center' }}>
                                                    {(() => {
                                                        const ocrStatus = getDerivedOcrStatus(rec);
                                                        if (!ocrStatus) return '-';

                                                        const statusMap = {
                                                            'GREEN': { label: 'Sesuai', color: '#166534', bg: '#dcfce7', border: '#bbf7d0', icon: '✅ ' },
                                                            'YELLOW': { label: 'Butuh Review', color: '#854d0e', bg: '#fef9c3', border: '#fef08a', icon: '⚠️ ' },
                                                            'RED': { label: 'Tidak Sesuai', color: '#991b1b', bg: '#fee2e2', border: '#fecaca', icon: '❌ ' },
                                                            'VERIFIED': { label: 'Sudah Di Verifikasi', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', icon: '✔️ ' },
                                                            'Sesuai (Manual)': { label: 'Sudah Terverifikasi', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', icon: '✔️ ' }
                                                        };

                                                        const cfg = statusMap[ocrStatus] || { label: ocrStatus, color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', icon: '' };

                                                        return (
                                                            <span className="badge" style={{
                                                                backgroundColor: cfg.bg,
                                                                color: cfg.color,
                                                                border: '1px solid',
                                                                borderColor: cfg.border,
                                                                fontSize: '0.7rem',
                                                                padding: '0.35rem 0.875rem',
                                                                borderRadius: '10px',
                                                                fontWeight: 700,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.35rem',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                            }}>
                                                                {cfg.icon}{cfg.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            )}
                                            {visibleColumns.includes('hasil_analisa') && (
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="badge" style={{
                                                        backgroundColor: getAnalysisBadgeColor(getAnalysisStatus(usage)) + '15',
                                                        color: getAnalysisBadgeColor(getAnalysisStatus(usage)),
                                                        padding: '0.35rem 0.875rem',
                                                        borderRadius: '10px',
                                                        fontWeight: 800,
                                                        fontSize: '0.7rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                                    }}>
                                                        {getAnalysisStatus(usage)}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.includes('status_laporan') && (
                                                <td style={{ textAlign: 'center' }}>
                                                    {(() => {
                                                        const statusLabel = statusKondisiOptions.find(s => s.kode_kondisi === rec.status_laporan)?.status_kondisi || rec.status_laporan;
                                                        const isNormal = statusLabel === 'Normal';
                                                        return (
                                                            <span className="badge" style={{
                                                                backgroundColor: isNormal ? '#dcfce7' : (statusLabel ? '#fee2e2' : '#f1f5f9'),
                                                                color: isNormal ? '#166534' : (statusLabel ? '#991b1b' : '#64748b'),
                                                                padding: '0.35rem 0.875rem',
                                                                borderRadius: '10px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 700,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                            }}>
                                                                {statusLabel || '-'}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            )}
                                            {visibleColumns.includes('tgl_verifikasi') && (
                                                <td style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                                                    {rec.tgl_verifikasi ? format(new Date(rec.tgl_verifikasi), 'dd/MM/yyyy HH:mm:ss') : '-'}
                                                </td>
                                            )}
                                            <td className="no-print sticky-col-right" style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                    <button className="btn btn-outline" style={{ padding: '0.3rem', borderRadius: '6px' }} onClick={() => handleOpenDetail(rec)} title="Lihat">
                                                        <Eye size={14} color="#0ea5e9" />
                                                    </button>
                                                    <button className="btn btn-outline" style={{ padding: '0.3rem', borderRadius: '6px' }} onClick={() => handleEditClick(rec)} title="Edit">
                                                        <Edit2 size={14} color="#202328ff" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredData.length > 0 && (
                    <div className="no-print" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                            Menampilkan <span style={{ fontWeight: 600, color: 'var(--text)' }}>{(currentPage - 1) * itemsPerPage + 1}</span> sampai <span style={{ fontWeight: 600, color: 'var(--text)' }}>{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari <span style={{ fontWeight: 600, color: 'var(--text)' }}>{filteredData.length}</span> data analisa
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
            {isDetailModalOpen && selectedDetail && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
                    <div className="modal-content" style={{
                        background: 'white',
                        width: '90%',
                        maxWidth: '650px',
                        maxHeight: '85vh',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        animation: 'slideUp 0.3s'
                    }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Detail Analisa Meter</h2>
                            <button onClick={handleCloseDetail} style={{ width: '36px', height: '36px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.25rem 2rem', overflowY: 'auto', flex: 1 }}>
                            <div style={{ maxWidth: '580px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                {/* Group Label: Detail Pelanggan */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '2px solid #f1f5f9',
                                    marginBottom: '0.25rem'
                                }}>
                                    <div style={{ width: '4px', height: '1.25rem', background: 'var(--primary)', borderRadius: '2px' }}></div>
                                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.025em' }}>Detail Pelanggan</h3>
                                </div>

                                {/* Detailed Customer Info - Tidy Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '1.25rem 1rem',
                                    padding: '1.5rem',
                                    background: '#f8fafc',
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Nama Pelanggan</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{selectedDetail.nama}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>No. Sambungan</div>
                                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#334155' }}>{selectedDetail.id_sambungan}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>ID Meter</div>
                                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#334155' }}>{selectedDetail.id_meter}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>ID Tag</div>
                                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#334155' }}>{getCustomerInfo(selectedDetail.id_pelanggan).id_tag || '-'}</div>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', paddingTop: '0.5rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Hasil OCR</div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            color: getDerivedOcrStatus(selectedDetail) === 'GREEN' ? '#166534' :
                                                (getDerivedOcrStatus(selectedDetail) === 'YELLOW' ? '#854d0e' :
                                                    (getDerivedOcrStatus(selectedDetail) === 'RED' ? '#991b1b' :
                                                        (getDerivedOcrStatus(selectedDetail) === 'VERIFIED' ? '#1d4ed8' : '#64748b'))),
                                            fontWeight: 700,
                                            fontSize: '0.875rem'
                                        }}>
                                            {getDerivedOcrStatus(selectedDetail) === 'GREEN' && <CheckCircle2 size={18} />}
                                            {getDerivedOcrStatus(selectedDetail) === 'YELLOW' && <AlertCircle size={18} />}
                                            {getDerivedOcrStatus(selectedDetail) === 'RED' && <XCircle size={18} />}
                                            {(getDerivedOcrStatus(selectedDetail) === 'VERIFIED' || getDerivedOcrStatus(selectedDetail) === 'Sesuai (Manual)') && <CheckCircle2 size={18} />}

                                            <span style={{ textTransform: 'uppercase' }}>
                                                {getDerivedOcrStatus(selectedDetail) === 'GREEN' ? 'SESUAI' :
                                                    (getDerivedOcrStatus(selectedDetail) === 'YELLOW' ? 'BUTUH REVIEW' :
                                                        (getDerivedOcrStatus(selectedDetail) === 'RED' ? 'TIDAK SESUAI' :
                                                            ((getDerivedOcrStatus(selectedDetail) === 'VERIFIED' || getDerivedOcrStatus(selectedDetail) === 'Sesuai (Manual)') ? 'SUDAH VERIFIKASI' : '-')))}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }}></div>

                                {/* Photo Comparison - First Row: Rumah Awal & Rumah Akhir */}
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            background: 'white',
                                            padding: '0.4rem',
                                            borderRadius: '16px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                        }}>
                                            <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Foto Rumah Awal</label>
                                            <div
                                                onClick={() => previousDetail?.foto_rumah && setPreviewImage(previousDetail.foto_rumah)}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '4/3',
                                                    border: '1px solid #f1f5f9',
                                                    borderRadius: '10px',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    background: '#f8fafc',
                                                    cursor: previousDetail?.foto_rumah ? 'zoom-in' : 'default',
                                                    transition: 'transform 0.2s'
                                                }}
                                                onMouseEnter={(e) => previousDetail?.foto_rumah && (e.currentTarget.style.transform = 'scale(1.02)')}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                title={previousDetail?.foto_rumah ? 'Klik untuk memperbesar' : ''}
                                            >
                                                {previousDetail?.foto_rumah ? (
                                                    <>
                                                        <img src={previousDetail.foto_rumah.startsWith('/') ? `${API_BASE_URL}${previousDetail.foto_rumah}` : previousDetail.foto_rumah} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Foto Rumah Awal" />
                                                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(255, 255, 255, 0.9)', padding: '0.25rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <ZoomIn size={16} color="#64748b" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                                                        <Camera size={24} />
                                                        <span style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Tidak Ada Foto</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            background: 'white',
                                            padding: '0.4rem',
                                            borderRadius: '16px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                        }}>
                                            <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Foto Rumah Akhir</label>
                                            <div
                                                onClick={() => selectedDetail.foto_rumah && setPreviewImage(selectedDetail.foto_rumah)}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '4/3',
                                                    border: '1px solid #f1f5f9',
                                                    borderRadius: '10px',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    background: '#f8fafc',
                                                    cursor: selectedDetail.foto_rumah ? 'zoom-in' : 'default',
                                                    transition: 'transform 0.2s'
                                                }}
                                                onMouseEnter={(e) => selectedDetail.foto_rumah && (e.currentTarget.style.transform = 'scale(1.02)')}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                title={selectedDetail.foto_rumah ? 'Klik untuk memperbesar' : ''}
                                            >
                                                {selectedDetail.foto_rumah ? (
                                                    <>
                                                        <img src={selectedDetail.foto_rumah && selectedDetail.foto_rumah.startsWith('/') ? `${API_BASE_URL}${selectedDetail.foto_rumah}` : selectedDetail.foto_rumah} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Foto Rumah Akhir" />
                                                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(255, 255, 255, 0.9)', padding: '0.25rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <ZoomIn size={16} color="#64748b" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                                                        <Camera size={24} />
                                                        <span style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Tidak Ada Foto</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Photo Comparison - Second Row: Meter Awal & Meter Akhir */}
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            background: 'white',
                                            padding: '0.4rem',
                                            borderRadius: '16px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                        }}>
                                            <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Foto Meter Awal</label>
                                            <div
                                                onClick={() => previousDetail?.foto && setPreviewImage(previousDetail.foto)}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '4/3',
                                                    border: '1px solid #f1f5f9',
                                                    borderRadius: '10px',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    background: '#f8fafc',
                                                    cursor: previousDetail?.foto ? 'zoom-in' : 'default',
                                                    transition: 'transform 0.2s'
                                                }}
                                                onMouseEnter={(e) => previousDetail?.foto && (e.currentTarget.style.transform = 'scale(1.02)')}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                title={previousDetail?.foto ? 'Klik untuk memperbesar' : ''}
                                            >
                                                {previousDetail?.foto ? (
                                                    <>
                                                        <img src={previousDetail?.foto && previousDetail.foto.startsWith('/') ? `${API_BASE_URL}${previousDetail.foto}` : previousDetail.foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Foto Meter Awal" />
                                                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(255, 255, 255, 0.9)', padding: '0.25rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <ZoomIn size={16} color="#64748b" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                                                        <Camera size={24} />
                                                        <span style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Tidak Ada Foto</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            background: 'white',
                                            padding: '0.4rem',
                                            borderRadius: '16px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                        }}>
                                            <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Foto Meter Akhir</label>
                                            <div
                                                onClick={() => selectedDetail.foto && setPreviewImage(selectedDetail.foto)}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '4/3',
                                                    border: '1px solid #f1f5f9',
                                                    borderRadius: '10px',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    background: '#f8fafc',
                                                    cursor: selectedDetail.foto ? 'zoom-in' : 'default',
                                                    transition: 'transform 0.2s'
                                                }}
                                                onMouseEnter={(e) => selectedDetail.foto && (e.currentTarget.style.transform = 'scale(1.02)')}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                title={selectedDetail.foto ? 'Klik untuk memperbesar' : ''}
                                            >
                                                {selectedDetail.foto ? (
                                                    <>
                                                        <img src={selectedDetail.foto && selectedDetail.foto.startsWith('/') ? `${API_BASE_URL}${selectedDetail.foto}` : selectedDetail.foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Foto Meter Akhir" />
                                                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(255, 255, 255, 0.9)', padding: '0.25rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <ZoomIn size={16} color="#64748b" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                                                        <Camera size={24} />
                                                        <span style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Tidak Ada Foto</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stan Comparison Row */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    {/* First Row: Stan Awal and Stan Akhir */}
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                        <div className="form-group" style={{ flex: '1', maxWidth: '280px' }}>
                                            <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '0.375rem', display: 'block', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.05em' }}>Stan Awal</label>
                                            <div style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #bfdbfe', background: '#f0f9ff', color: '#0284c7', textAlign: 'center', fontSize: '1rem', fontWeight: 700, boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)' }}>
                                                {previousDetail ? previousDetail.stan_akhir : 0}
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ flex: '1', maxWidth: '280px' }}>
                                            <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '0.375rem', display: 'block', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.05em' }}>Stan Akhir</label>
                                            <div style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #bfdbfe', background: '#f0f9ff', color: '#0284c7', textAlign: 'center', fontSize: '1rem', fontWeight: 700, boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)' }}>
                                                {selectedDetail.stan_akhir}
                                            </div>
                                        </div>
                                    </div>


                                    {/* Second Row: Pemakaian (Centered) */}
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <div className="form-group" style={{ width: 'calc(33.33% - 0.5rem)' }}>
                                            <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem', display: 'block', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.05em' }}>Pemakaian</label>
                                            <div style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '2px solid #3b82f6', background: '#e0f2fe', color: '#1d4ed8', textAlign: 'center', fontSize: '1.0625rem', fontWeight: 800, boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.15)' }}>
                                                {(() => {
                                                    const stanAkhir = parseInt(selectedDetail.stan_akhir);
                                                    if (stanAkhir === 0) return "0 m³";
                                                    const stanAwal = previousDetail ? parseInt(previousDetail.stan_akhir) : 0;
                                                    const usage = stanAkhir - stanAwal;
                                                    return usage + " m³";
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verification Notes Display */}
                                    {selectedDetail.verifikasi_catatan && (
                                        <div style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Catatan Verifikasi</label>
                                            <div style={{ fontSize: '0.875rem', color: '#334155', fontStyle: 'italic', lineHeight: '1.5', textAlign: 'center' }}>
                                                "{selectedDetail.verifikasi_catatan}"
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                                <button className="btn btn-outline" style={{ padding: '0.75rem 4rem', borderRadius: '10px', fontWeight: 600 }} onClick={handleCloseDetail}>Tutup</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal with Zoom */}
            <SimpleImageViewer
                isOpen={!!simplePreviewImage}
                onClose={() => setSimplePreviewImage(null)}
                imageSrc={simplePreviewImage && simplePreviewImage.startsWith('/') ? `${API_BASE_URL}${simplePreviewImage}` : simplePreviewImage}
            />

            {/* Simple Image Preview Modal (for Edit Modal) */}
            {simplePreviewImage && (
                <div
                    className="modal-overlay"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 3000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'fadeIn 0.2s'
                    }}
                    onClick={() => setSimplePreviewImage(null)}
                >
                    <div
                        style={{
                            position: 'relative',
                            maxWidth: '90%',
                            maxHeight: '90vh'
                        }}
                    >
                        <img
                            src={simplePreviewImage && simplePreviewImage.startsWith('/') ? `${API_BASE_URL}${simplePreviewImage}` : simplePreviewImage}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: '12px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                            alt="Preview"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSimplePreviewImage(null);
                            }}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'white',
                                border: 'none',
                                padding: '12px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                                transition: 'transform 0.2s',
                                zIndex: 10
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <X size={24} color="#1e293b" />
                        </button>
                    </div>
                </div>
            )}
            {/* Edit Modal */}
            {isEditModalOpen && initialEditFormData && (
                <div className="modal-overlay" style={{ animation: 'fadeIn 0.2s', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EditRecordingForm
                        recording={editingRecording}
                        initialFormData={initialEditFormData}
                        officers={officers}
                        statusKondisiOptions={statusKondisiOptions}
                        ocrStatusFilter={ocrStatusFilter}
                        getCustomerInfo={getCustomerInfo}
                        getDerivedOcrStatus={getDerivedOcrStatus}
                        onClose={handleCloseEditModal}
                        onSubmit={handleEditSubmit}
                        setSimplePreviewImage={setSimplePreviewImage}
                        API_BASE_URL={API_BASE_URL}
                        loading={loading}
                    />
                </div>
            )}

            {/* Print Footer */}
            <div className="print-footer">
                <p style={{ margin: '0 0 40px 0' }}>Dicetak oleh,</p>
                <div style={{ borderBottom: '1px solid black', width: '200px', margin: '0 auto 10px auto' }}></div>
                <p>{localStorage.getItem('username') || 'Admin'}</p>
            </div>
            <style>
                {`
                    .card, .table-container {
                        position: relative;
                        z-index: 1;
                    }
                `}
            </style>
        </div >
    );
}

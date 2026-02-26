import React, { useState, useEffect } from 'react';
import { Users, Building2, RefreshCw, Layers, MapPin, Search, X, SlidersHorizontal, ChevronDown, Check, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Swal from 'sweetalert2';
import SearchableSelect from './common/SearchableSelect';

const ALL_COLUMNS = [
    { id: 'kode_rute', label: 'RUTE', width: '100px', align: 'left' },
    { id: 'id_sambungan', label: 'NO. SAMBUNGAN', width: '150px', align: 'left' },
    { id: 'kode_tarif', label: 'TARIF', width: '80px', align: 'center' },
    { id: 'nama', label: 'NAMA PELANGGAN', width: '200px', align: 'left' },
    { id: 'alamat', label: 'ALAMAT', width: '250px', align: 'left' },
    { id: 'koordinat', label: 'KOORDINAT', width: '100px', align: 'center' }
];

export default function OfficerMapping() {
    const [branches, setBranches] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters & UI State
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedOfficer, setSelectedOfficer] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCategory, setSearchCategory] = useState('all'); // all, nama, id_sambungan, alamat, kode_rute
    const [visibleColumns, setVisibleColumns] = useState(ALL_COLUMNS.map(c => c.id));
    const [isColumnSelectOpen, setIsColumnSelectOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

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

    const filteredCustomers = React.useMemo(() => {
        let items = customers.filter(c => {
            const term = searchTerm.toLowerCase();
            if (!term) return true;

            if (searchCategory === 'all') {
                return (
                    c.nama.toLowerCase().includes(term) ||
                    c.id_sambungan.includes(term) ||
                    (c.alamat && c.alamat.toLowerCase().includes(term)) ||
                    c.kode_rute.includes(term)
                );
            } else if (searchCategory === 'nama') {
                return c.nama.toLowerCase().includes(term);
            } else if (searchCategory === 'id_sambungan') {
                return c.id_sambungan.includes(term);
            } else if (searchCategory === 'alamat') {
                return c.alamat && c.alamat.toLowerCase().includes(term);
            } else if (searchCategory === 'kode_rute') {
                return c.kode_rute.includes(term);
            }
            return true;
        });

        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

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
    }, [customers, searchTerm, searchCategory, sortConfig]);

    useEffect(() => {
        fetchBranches();
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setIsColumnSelectOpen(false);
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await fetch('./api/options.php?type=cabang');
            const data = await res.json();
            setBranches(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch branches:', err);
        }
    };

    const fetchOfficersByBranch = async (branchCode) => {
        if (!branchCode) {
            setOfficers([]);
            return;
        }
        try {
            const res = await fetch(`./api/officers.php?branch_code=${branchCode}`);
            const data = await res.json();
            setOfficers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch officers:', err);
        }
    };

    const fetchCustomersByOfficer = async (officerId) => {
        if (!officerId) {
            setCustomers([]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`./api/customers.php?officer_id=${officerId}`);
            const data = await res.json();
            const validData = Array.isArray(data) ? data : [];
            setCustomers(validData);
        } catch (err) {
            console.error('Failed to fetch customers:', err);
            Swal.fire('Error', 'Gagal memuat data pelanggan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleColumn = (columnId) => {
        setVisibleColumns(prev =>
            prev.includes(columnId)
                ? prev.filter(id => id !== columnId)
                : [...prev, columnId]
        );
    };

    const getSearchPlaceholder = () => {
        switch (searchCategory) {
            case 'nama': return 'Cari nama pelanggan...';
            case 'id_sambungan': return 'Cari no. sambungan...';
            case 'alamat': return 'Cari alamat...';
            case 'kode_rute': return 'Cari rute...';
            default: return 'Ketik kata kunci pencarian...';
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            <header className="header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                        <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.625rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers size={32} color="var(--primary)" />
                        </div>
                        Pemetaan Tugas
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Daftar Wilayah Pencatatan Petugas</p>
                </div>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                        <SearchableSelect
                            label="PILIH CABANG"
                            placeholder="-- Pilih Cabang --"
                            icon={Building2}
                            options={branches.map(b => ({ value: b.kode_cabang, label: b.cabang }))}
                            value={selectedBranch}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedBranch(val);
                                setSelectedOfficer('');
                                fetchOfficersByBranch(val);
                                setCustomers([]);
                            }}
                            containerStyle={{ flex: '0 0 250px', marginBottom: 0 }}
                            hideValue={true}
                        />

                        <SearchableSelect
                            label="PILIH PETUGAS"
                            placeholder={selectedBranch ? "-- Pilih Petugas --" : "Pilih cabang dahulu"}
                            icon={Users}
                            options={(() => {
                                const uniqueNames = Array.from(new Set(officers.map(o => o.nama)));
                                return uniqueNames.map(nama => {
                                    const o = officers.find(off => off.nama === nama);
                                    return { value: String(o.id), label: o.nama };
                                });
                            })()}
                            value={selectedOfficer}
                            disabled={!selectedBranch}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedOfficer(val);
                                fetchCustomersByOfficer(val);
                            }}
                            containerStyle={{ flex: '0 0 280px', marginBottom: 0 }}
                            hideValue={true}
                        />

                        {loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                                <RefreshCw size={16} className="spin" />
                                <span>Memproses...</span>
                            </div>
                        )}
                    </div>

                    {!loading && selectedOfficer && (
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            {/* Column Selector */}
                            <div style={{ position: 'relative' }} className="dropdown-container">
                                <button
                                    onClick={() => setIsColumnSelectOpen(!isColumnSelectOpen)}
                                    style={{
                                        height: '42px',
                                        padding: '0 1.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.625rem',
                                        background: isColumnSelectOpen ? '#f1f5f9' : 'white',
                                        border: `1px solid ${isColumnSelectOpen ? 'var(--primary)' : '#e2e8f0'}`,
                                        color: isColumnSelectOpen ? 'var(--primary)' : '#334155',
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
                                {isColumnSelectOpen && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                        padding: '1.25rem', zIndex: 100, minWidth: '240px',
                                        animation: 'fadeIn 0.2s ease-out'
                                    }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Tampilkan Kolom</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem' }}>
                                            {ALL_COLUMNS.map(col => (
                                                <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem', color: '#334155', borderRadius: '6px', transition: 'background 0.2s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns.includes(col.id)}
                                                        onChange={() => toggleColumn(col.id)}
                                                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                                                    />
                                                    <span style={{ color: visibleColumns.includes(col.id) ? '#334155' : '#94a3b8', fontWeight: visibleColumns.includes(col.id) ? 500 : 400 }}>{col.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                            <button
                                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                                                onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.id))}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                            >Pilih Semua</button>
                                            <button
                                                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                                                onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.id))}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                            >Reset Default</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Filter Logic */}
                            <div style={{ position: 'relative' }} className="dropdown-container">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    style={{
                                        height: '42px',
                                        padding: '0 1.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.625rem',
                                        background: isFilterOpen ? '#f1f5f9' : 'white',
                                        border: `1px solid ${isFilterOpen ? 'var(--primary)' : '#e2e8f0'}`,
                                        color: isFilterOpen ? 'var(--primary)' : '#334155',
                                        borderRadius: '8px',
                                        minWidth: '100px',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Filter size={16} />
                                    <span style={{ fontWeight: 600 }}>Filter</span>
                                    <ChevronDown size={14} style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                </button>
                                {isFilterOpen && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                                        boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                                        padding: '0.5rem', zIndex: 100, minWidth: '200px',
                                        animation: 'fadeIn 0.2s ease-out'
                                    }}>
                                        {[
                                            { id: 'all', label: 'Semua' },
                                            { id: 'nama', label: 'Nama Pelanggan' },
                                            { id: 'id_sambungan', label: 'No. Sambungan' },
                                            { id: 'alamat', label: 'Alamat' },
                                            { id: 'kode_rute', label: 'Rute' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => { setSearchCategory(opt.id); setIsFilterOpen(false); }}
                                                style={{
                                                    width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none',
                                                    background: searchCategory === opt.id ? '#f1f5f9' : 'none',
                                                    color: searchCategory === opt.id ? 'var(--primary)' : '#334155',
                                                    borderRadius: '8px', fontSize: '0.875rem',
                                                    fontWeight: searchCategory === opt.id ? 600 : 400,
                                                    cursor: 'pointer', transition: 'background 0.2s',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}
                                                onMouseEnter={(e) => { if (searchCategory !== opt.id) e.currentTarget.style.background = '#f8fafc'; }}
                                                onMouseLeave={(e) => { if (searchCategory !== opt.id) e.currentTarget.style.background = 'none'; }}
                                            >
                                                {opt.label}
                                                {searchCategory === opt.id && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Search Bar */}
                            <div style={{ position: 'relative', width: '300px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder={getSearchPlaceholder()}
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
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        style={{
                                            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
                                            color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={() => fetchCustomersByOfficer(selectedOfficer)}
                                title="Perbarui Data"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.75rem',
                                    height: '42px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white',
                                    color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="table-container" style={{ flex: 1, overflow: 'auto' }}>
                    <table className="customer-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>NO</th>
                                {ALL_COLUMNS.map(col => visibleColumns.includes(col.id) && (
                                    <th key={col.id} onClick={() => handleSort(col.id)} style={{ width: col.width, textAlign: col.align, cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'center' ? 'center' : 'flex-start', gap: '0.5rem' }}>
                                            {col.label} {getSortIcon(col.id)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((cust, index) => (
                                    <tr key={index}>
                                        <td style={{ textAlign: 'center', color: '#64748b' }}>{index + 1}</td>
                                        {visibleColumns.includes('kode_rute') && <td style={{ fontWeight: 500 }}>{cust.kode_rute}</td>}
                                        {visibleColumns.includes('id_sambungan') && <td style={{ fontWeight: 500 }}>{cust.id_sambungan}</td>}
                                        {visibleColumns.includes('kode_tarif') && <td style={{ textAlign: 'center', fontWeight: 500 }}>{cust.kode_tarif}</td>}
                                        {visibleColumns.includes('nama') && <td style={{ fontWeight: 600, color: '#0f172a' }}>{cust.nama}</td>}
                                        {visibleColumns.includes('alamat') && <td style={{ color: '#64748b' }}>{cust.alamat || '-'}</td>}
                                        {visibleColumns.includes('koordinat') && (
                                            <td style={{ textAlign: 'center' }}>
                                                {cust.latitude && cust.longitude ? (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${cust.latitude},${cust.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}
                                                    >
                                                        <MapPin size={14} /> Lihat
                                                    </a>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>-</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={visibleColumns.length + 1} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        {selectedOfficer ? 'Tidak ada data pelanggan ditemukan.' : 'Silakan pilih cabang dan petugas terlebih dahulu.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>
                {`
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    
                    .card {
                        background: white;
                        border-radius: 16px;
                        border: 1px solid var(--border);
                        /* Create stacking context for sticky headers */
                        position: relative;
                        z-index: 1;
                    }

                    /* Standard Table Styles */
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
                        padding: 1rem 1.25rem;
                        white-space: nowrap;
                    }
                    .customer-table tbody tr:nth-of-type(even) td {
                        background-color: #fafbfc;
                    }
                    .customer-table tbody tr:hover td {
                        background-color: #eff6ff;
                    }
                    .customer-table td {
                        padding: 0.875rem 1.25rem;
                        vertical-align: middle;
                        font-size: 0.875rem;
                        color: #334155;
                        border-bottom: 1px solid #e2e8f0;
                    }
                `}
            </style>
        </div>
    );
}

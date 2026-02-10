import React, { useState, useEffect } from 'react';
import { Users, Building2, RefreshCw, Layers, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';
import SearchableSelect from './common/SearchableSelect';

export default function OfficerMapping() {
    const [branches, setBranches] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedOfficer, setSelectedOfficer] = useState('');

    useEffect(() => {
        fetchBranches();
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
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Daftar wilayah tugas petugas</p>
                </div>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>

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
                        containerStyle={{ flex: '0 0 280px', marginBottom: 0 }}
                        hideValue={true}
                    />

                    <SearchableSelect
                        label="PILIH PETUGAS"
                        placeholder={selectedBranch ? "-- Pilih Petugas --" : "Pilih cabang dahulu"}
                        icon={Users}
                        options={officers.map(o => ({ value: String(o.id), label: o.nama }))}
                        value={selectedOfficer}
                        disabled={!selectedBranch}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSelectedOfficer(val);
                            fetchCustomersByOfficer(val);
                        }}
                        containerStyle={{ flex: '0 0 320px', marginBottom: 0 }}
                        hideValue={true}
                    />

                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', marginLeft: '1rem' }}>
                            <RefreshCw size={16} className="spin" />
                            <span>Memproses...</span>
                        </div>
                    )}

                    {!loading && selectedOfficer && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                                onClick={() => fetchCustomersByOfficer(selectedOfficer)}
                                title="Perbarui Data"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                    padding: '0.5rem 0.75rem', color: 'var(--primary)', cursor: 'pointer',
                                    fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                            >
                                <RefreshCw size={14} />
                                Refresh Data
                            </button>
                            <span style={{ fontSize: '0.875rem', color: '#64748b', background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                Total: <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{customers.length}</strong> Pelanggan
                            </span>
                        </div>
                    )}
                </div>

                <div className="table-container" style={{ flex: 1, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>NO</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>RUTE</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>NO. SAMBUNGAN</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>NAMA PELANGGAN</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>ALAMAT</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>KOORDINAT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length > 0 ? (
                                customers.map((cust, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748b' }}>{index + 1}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}>{cust.kode_rute}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}>{cust.id_sambungan}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{cust.nama}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748b' }}>{cust.alamat || '-'}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
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
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        {selectedOfficer ? 'Tidak ada data pelanggan untuk petugas ini.' : 'Silakan pilih cabang dan petugas terlebih dahulu.'}
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
                `}
            </style>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Users, Building2, UserCheck, CheckCircle2, AlertCircle, ArrowLeft, TrendingUp, Calendar, RefreshCw, Droplets, Info, X } from 'lucide-react';

const StatCard = ({ title, value, subValue, icon: Icon, color, gradient, onClick }) => (
    <div
        onClick={onClick}
        style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px -5px rgba(0,0,0,0.05)';
        }}
    >
        <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            background: gradient,
            opacity: 0.05,
            borderRadius: '50%'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
                padding: '0.75rem',
                borderRadius: '12px',
                background: gradient,
                color: 'white',
                boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)'
            }}>
                <Icon size={24} />
            </div>
            <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{title}</p>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e293b', margin: '0.25rem 0' }}>{value}</h3>
            </div>
        </div>

        {subValue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                <div style={{ padding: '2px', borderRadius: '4px', background: '#ecfdf5', display: 'flex' }}>
                    <TrendingUp size={12} style={{ color: '#10b981' }} />
                </div>
                <span>{subValue}</span>
            </div>
        )}
    </div>
);

const ProgressBar = ({ percentage, color }) => (
    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginTop: '0.5rem' }}>
        <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: color,
            borderRadius: '4px',
            transition: 'width 1s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }} />
    </div>
);

const Dashboard = ({ onTabChange }) => {
    const [stats, setStats] = useState(null);
    const [showAbnormalModal, setShowAbnormalModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(3);

    // Drill-down states
    const [viewMode, setViewMode] = useState('overview'); // 'overview', 'branch', 'officer'
    const [drillData, setDrillData] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [drillLoading, setDrillLoading] = useState(false);

    useEffect(() => {
        fetchStats();
    }, [period]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await fetch(`./api/dashboard_stats.php?months=${period}`);
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrillDown = async (branchCode = null) => {
        setDrillLoading(true);
        try {
            let url = './api/dashboard_drilldown.php';
            if (branchCode) url += `?branch_code=${branchCode}`;
            const response = await fetch(url);
            const data = await response.json();
            setDrillData(data.data);
            if (!branchCode) {
                setViewMode('branch');
            } else {
                setViewMode('officer');
            }
        } catch (error) {
            console.error('Error fetching drilldown:', error);
        } finally {
            setDrillLoading(false);
        }
    };

    const handleBranchClick = (branch) => {
        setSelectedBranch(branch);
        fetchDrillDown(branch.kode_cabang);
    };

    const goBack = () => {
        if (viewMode === 'officer') {
            fetchDrillDown(); // Go back to branch list
        } else {
            setViewMode('overview');
            setDrillData([]);
            setSelectedBranch(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <RefreshCw size={40} className="animate-spin" style={{ color: '#0ea5e9' }} />
                    <p style={{ color: '#64748b', fontWeight: 500 }}>Memuat data dashboard...</p>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="dashboard-container" style={{ padding: '0.5rem', animation: 'fadeIn 0.5s ease-out' }}>
            {/* ===== HEADER ===== */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>PDAM Smart Dashboard</p>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>Dashboard Overview</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem' }}>Statistik real-time pencatatan meter dan analisa data.</p>
                </div>
                <div style={{ padding: '0.5rem 1rem', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', fontSize: '0.8rem', fontWeight: 700, color: '#0369a1' }}>
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* ===== PROGRESS CARD / DRILLDOWN ===== */}
            {viewMode === 'overview' ? (
                <div className="main-progress-card"
                    onClick={() => fetchDrillDown()}
                    style={{ marginBottom: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.005)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {/* Decorative blobs */}
                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)', opacity: 0.06, borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: '-30px', left: '30%', width: '150px', height: '150px', background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', opacity: 0.05, borderRadius: '50%' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>PROGRES PENCATATAN (KLIK UNTUK DETAIL)</span>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0', lineHeight: 1.2 }}>
                                Bulan {new Date().toLocaleString('id-ID', { month: 'long' })} {new Date().getFullYear()}
                            </h2>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '3.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #0ea5e9, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                                {stats.summary.reading_progress.percentage}%
                            </span>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, margin: '0.25rem 0 0', textAlign: 'right' }}>Tingkat Ketercapaian</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                        <div style={{
                            width: `${stats.summary.reading_progress.percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #0ea5e9, #10b981)',
                            borderRadius: '6px',
                            transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            boxShadow: '0 2px 8px rgba(14, 165, 233, 0.4)'
                        }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: 'white', display: 'flex' }}>
                                <CheckCircle2 size={18} />
                            </div>
                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>
                                <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>{stats.summary.reading_progress.count.toLocaleString()}</strong>
                                <span style={{ color: '#94a3b8', margin: '0 0.4rem' }}>dari</span>
                                <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>{stats.summary.reading_progress.total.toLocaleString()}</strong>
                                <span style={{ color: '#94a3b8', marginLeft: '0.4rem' }}>Pelanggan telah tercatat</span>
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>Aktif</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '2rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
                    border: '1px solid #f1f5f9',
                    minHeight: '300px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={goBack}
                                style={{
                                    padding: '0.6rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    background: 'white',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    display: 'flex',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0ea5e9'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b'; }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                    {viewMode === 'branch' ? 'Detail Progres per Cabang' : `Progres Petugas - ${selectedBranch?.nama}`}
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>Bulan {new Date().toLocaleString('id-ID', { month: 'long' })} {new Date().getFullYear()}</p>
                            </div>
                        </div>
                    </div>

                    {drillLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                            <RefreshCw size={32} className="animate-spin" style={{ color: '#0ea5e9' }} />
                        </div>
                    ) : viewMode === 'branch' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            {drillData.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleBranchClick(item)}
                                    style={{
                                        padding: '1.5rem',
                                        borderRadius: '20px',
                                        background: '#f8fafc',
                                        border: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#0ea5e922'; e.currentTarget.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.nama}</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0ea5e9' }}>{item.percentage}%</span>
                                    </div>
                                    <ProgressBar percentage={item.percentage} color={item.percentage >= 100 ? '#10b981' : '#0ea5e9'} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                                        <span>Tercatat: <strong>{item.pelanggan_tercatat}</strong></span>
                                        <span>Total: <strong>{item.total_pelanggan}</strong></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                            paddingRight: '0.5rem',
                            msOverflowStyle: 'none',
                            scrollbarWidth: 'thin'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.4rem' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'white' }}>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left', borderRadius: '12px 0 0 12px' }}>Nama Petugas</th>
                                        <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left' }}>Progres</th>
                                        <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left' }}>Tercatat/Total</th>
                                        <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>Capaian</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {drillData.map((item, idx) => (
                                        <tr key={idx} className="table-row-hover" style={{ transition: 'all 0.2s ease' }}>
                                            <td style={{ padding: '0.6rem 1rem', background: '#ffffff', borderRadius: '12px 0 0 12px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0ea5e9', fontWeight: 800, fontSize: '0.75rem' }}>
                                                        {item.nama.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{item.nama}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.6rem 1rem', background: '#ffffff', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ flex: 1, minWidth: '120px', height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${item.percentage}%`, height: '100%', background: item.percentage >= 100 ? '#10b981' : '#0ea5e9', borderRadius: '3px' }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.6rem 1rem', background: '#ffffff', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{item.pelanggan_tercatat}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0.2rem' }}>/</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{item.total_pelanggan}</span>
                                            </td>
                                            <td style={{ padding: '0.6rem 1rem', background: '#ffffff', borderRadius: '0 12px 12px 0', textAlign: 'right', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 800,
                                                    color: item.percentage >= 100 ? '#10b981' : '#0ea5e9',
                                                    background: item.percentage >= 100 ? '#ecfdf5' : '#f0f9ff',
                                                    border: `1px solid ${item.percentage >= 100 ? '#d1fae5' : '#e0f2fe'}`
                                                }}>
                                                    {item.percentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ===== SECONDARY KPI CARDS ===== */}
            {(() => {
                const totalAbnormal = stats.meter_condition
                    .filter(item => !item.label.toLowerCase().includes('normal'))
                    .reduce((acc, curr) => acc + curr.value, 0);

                return (
                    <div className="secondary-kpi-grid" style={{ marginBottom: '2.5rem' }}>
                        <StatCard
                            title="Total Cabang"
                            value={stats.summary.total_branches}
                            icon={Building2}
                            gradient="linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                            onClick={() => onTabChange('cabang')}
                        />
                        <StatCard
                            title="Total Pelanggan"
                            value={stats.summary.total_customers.toLocaleString()}
                            icon={Users}
                            gradient="linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)"
                            onClick={() => onTabChange('pelanggan')}
                        />
                        <StatCard
                            title="Kondisi Meter"
                            value={totalAbnormal.toLocaleString()}
                            subValue="Unit Abnormal"
                            icon={AlertCircle}
                            gradient="linear-gradient(135deg, #f43f5e 0%, #be123c 100%)"
                            onClick={() => setShowAbnormalModal(true)}
                        />
                        <StatCard
                            title="Total Petugas"
                            value={stats.summary.total_officers}
                            icon={UserCheck}
                            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            onClick={() => onTabChange('petugas')}
                        />
                    </div>
                );
            })()}

            {/* ===== KONDISI METER MODAL ===== */}
            {showAbnormalModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => setShowAbnormalModal(false)}>
                    <div style={{
                        background: 'white',
                        width: '100%',
                        maxWidth: '900px',
                        maxHeight: '85vh',
                        borderRadius: '32px',
                        padding: '2.5rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        animation: 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.75rem', borderRadius: '14px', background: '#fef2f2', color: '#ef4444' }}>
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Rincian Kondisi Meter</h3>
                                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Kondisi abnormal yang tercatat saat ini</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAbnormalModal(false)}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left', borderRadius: '12px 0 0 12px' }}>Kondisi Laporan</th>
                                        <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left' }}>Jumlah</th>
                                        <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.meter_condition
                                        .filter(item => !item.label.toLowerCase().includes('normal'))
                                        .map((item, idx) => {
                                            const isDanger = /rusak|macet|buram|anjing|dikunci/i.test(item.label);
                                            const themeColor = isDanger ? '#ef4444' : '#f59e0b';
                                            return (
                                                <tr key={idx}>
                                                    <td style={{ padding: '1.25rem 1.5rem', background: '#fcfdfe', borderRadius: '16px 0 0 16px', border: '1px solid #f1f5f9', borderRight: 'none' }}>
                                                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.label}</span>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem', background: '#fcfdfe', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{item.value}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.4rem' }}>Unit</span>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem', background: '#fcfdfe', borderRadius: '0 16px 16px 0', textAlign: 'right', border: '1px solid #f1f5f9', borderLeft: 'none' }}>
                                                        <span style={{
                                                            padding: '0.4rem 0.8rem',
                                                            borderRadius: '100px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 800,
                                                            background: isDanger ? '#fef2f2' : '#fffbeb',
                                                            color: themeColor,
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {isDanger ? 'Mendesak' : 'Perhatian'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}


            {/* ===== BOTTOM GRID ===== */}
            <div className="bottom-grid">
                {/* OCR Status Distribution */}
                <div className="status-card-compact">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ width: '4px', height: '20px', background: 'linear-gradient(180deg, #0ea5e9, #2563eb)', borderRadius: '2px' }} />
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} style={{ color: '#0ea5e9' }} /> Kualitas Hasil Baca Meter
                        </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[
                            { key: 'GREEN', label: 'Sesuai', color: '#10b981' },
                            { key: 'YELLOW', label: 'Butuh Review', color: '#f59e0b' },
                            { key: 'VERIFIED', label: 'Terverifikasi', color: '#64748b' },
                            { key: 'RED', label: 'Tidak Sesuai / Mismatch', color: '#ef4444' }
                        ].map((status, idx) => {
                            const data = stats.ocr_status.find(s => s.label.toUpperCase() === status.key) || { value: 0 };
                            const percentage = stats.summary.reading_progress.count > 0
                                ? ((data.value / stats.summary.reading_progress.count) * 100).toFixed(1)
                                : "0.0";

                            return (
                                <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: status.color }} />
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>{status.label}</span>
                                        </div>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                                            {data.value.toLocaleString()}
                                            <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.75rem', marginLeft: '0.5rem' }}>({percentage}%)</span>
                                        </span>
                                    </div>
                                    <ProgressBar percentage={percentage} color={status.color} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="trend-card-compact">
                    <div className="trend-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '4px', height: '20px', background: 'linear-gradient(180deg, #10b981, #0ea5e9)', borderRadius: '2px' }} />
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <TrendingUp size={18} style={{ color: '#10b981' }} /> Tren Pemakaian (m³)
                            </h3>
                        </div>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(parseInt(e.target.value))}
                            style={{
                                padding: '0.5rem 2rem 0.5rem 1rem',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: '#131414ff',
                                background: '#f8fafc',
                                cursor: 'pointer',
                                width: 'fit-content',
                                minWidth: '160px',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23131414' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.75rem center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                        >
                            <option value={1}>1 Bulan Terakhir</option>
                            <option value={2}>2 Bulan Terakhir</option>
                            <option value={3}>3 Bulan Terakhir</option>
                            <option value={4}>4 Bulan Terakhir</option>
                            <option value={5}>5 Bulan Terakhir</option>
                        </select>
                    </div>

                    <div style={{ position: 'relative', height: '240px', width: '100%', padding: '0 1rem' }}>
                        <svg viewBox="0 0 1000 240" preserveAspectRatio="none" style={{ width: '100%', height: '200px', overflow: 'visible' }}>
                            <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* SVG PATHS */}
                            {(() => {
                                const maxVal = Math.max(...stats.usage_trends.map(t => t.usage), 1);
                                const paddingH = 60; // Horizontal padding in SVG units
                                const paddingV = 40; // Vertical padding in SVG units
                                const chartHeight = 160; // Actual height for the line

                                const points = stats.usage_trends.map((t, i) => {
                                    const x = stats.usage_trends.length > 1
                                        ? paddingH + (i / (stats.usage_trends.length - 1)) * (1000 - 2 * paddingH)
                                        : 500;
                                    const y = (200 - paddingV) - (t.usage / maxVal) * chartHeight;
                                    return { x, y, usage: t.usage, month: t.month };
                                });

                                const linePath = points.length > 1
                                    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
                                    : '';
                                const areaPath = points.length > 1
                                    ? `${linePath} L ${points[points.length - 1].x},200 L ${points[0].x},200 Z`
                                    : '';

                                return (
                                    <>
                                        {/* Area Fill */}
                                        {areaPath && <path d={areaPath} fill="url(#lineGradient)" />}

                                        {/* Main Line */}
                                        {linePath && (
                                            <path
                                                d={linePath}
                                                fill="none"
                                                stroke="#0ea5e9"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        )}

                                        {/* Grid Lines (Horizontal) */}
                                        {[0, 0.5, 1].map(tick => (
                                            <line
                                                key={tick}
                                                x1={paddingH} y1={200 - paddingV - tick * chartHeight}
                                                x2={1000 - paddingH} y2={200 - paddingV - tick * chartHeight}
                                                stroke="#f1f5f9"
                                                strokeWidth="1"
                                                strokeDasharray="4 4"
                                            />
                                        ))}

                                        {/* Data Points */}
                                        {points.map((p, i) => (
                                            <g key={i}>
                                                <circle
                                                    cx={p.x} cy={p.y} r="5"
                                                    fill="white" stroke="#0ea5e9" strokeWidth="3"
                                                />
                                                <text
                                                    x={p.x} y={p.y - 15}
                                                    textAnchor="middle"
                                                    style={{ fontSize: '14px', fontWeight: 800, fill: '#1e293b' }}
                                                >
                                                    {Math.round(p.usage).toLocaleString('id-ID')} m³
                                                </text>
                                            </g>
                                        ))}
                                    </>
                                );
                            })()}
                        </svg>

                        {/* X-Axis Labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', padding: '0 60px' }}>
                            {stats.usage_trends.map((item, idx) => (
                                <span key={idx} style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, width: '40px', textAlign: 'center' }}>
                                    {item.month}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .main-progress-card {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem 2.5rem;
                    box-shadow: 0 4px 24px -4px rgba(14, 165, 233, 0.12), 0 1px 4px rgba(0,0,0,0.04);
                    border: 1px solid rgba(14, 165, 233, 0.12);
                    position: relative;
                    overflow: hidden;
                    width: 100%;
                }
                .secondary-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.25rem;
                }
                @media (max-width: 1400px) {
                    .secondary-kpi-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                .condition-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.25rem;
                }
                .bottom-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.25rem;
                    margin-top: 2.5rem;
                }
                .status-card-compact, .trend-card-compact {
                    background: white;
                    padding: 1.75rem;
                    border-radius: 20px;
                    box-shadow: 0 4px 24px -4px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                }

                @media (max-width: 1100px) {
                    .secondary-kpi-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .condition-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .bottom-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .main-progress-card {
                        padding: 1.5rem;
                    }
                    .secondary-kpi-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                    .condition-grid {
                        grid-template-columns: 1fr;
                    }
                    .trend-header {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 1rem;
                    }
                    .trend-header select {
                        width: 100% !important;
                    }
                }
            `}</style>
        </div >
    );
};

export default Dashboard;

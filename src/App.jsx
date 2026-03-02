import React, { useState, useEffect } from 'react';
import { Building2, Users, Droplets, BarChart2, History, FileText, X, LayoutDashboard, Settings, UserCircle, LogOut, Menu, ChevronLeft, Building, UserPlus, MapPin, ClipboardList, TrendingUp, HelpCircle, ChevronDown, FileSpreadsheet, FileDown, Table, Construction } from 'lucide-react';
import CustomerManagement from './components/CustomerManagement';
import BranchManagement from './components/BranchManagement';
import RecordingManagement from './components/RecordingManagement';
import OfficerManagement from './components/OfficerManagement';
import OfficerMapping from './components/OfficerMapping';
import MeterAnalysis from './components/MeterAnalysis';
import CustomerMapping from './components/CustomerMapping';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/Settings';
import SearchableSelect from './components/common/SearchableSelect';


// Memoized Components to prevent unnecessary re-renders when sidebar toggles
const MemoizedDashboard = React.memo(Dashboard);
const MemoizedCustomerManagement = React.memo(CustomerManagement);
const MemoizedBranchManagement = React.memo(BranchManagement);
const MemoizedRecordingManagement = React.memo(RecordingManagement);
const MemoizedOfficerManagement = React.memo(OfficerManagement);
const MemoizedOfficerMapping = React.memo(OfficerMapping);
const MemoizedMeterAnalysis = React.memo(MeterAnalysis);
const MemoizedCustomerMapping = React.memo(CustomerMapping);
const MemoizedSettings = React.memo(SettingsPanel);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedMenus, setExpandedMenus] = useState(['analisa']); // Keep analisa expanded by default or from storage
  const [showReportFilter, setShowReportFilter] = useState(false);
  const [showPerformanceFilter, setShowPerformanceFilter] = useState(false);
  const [showCustomerReportFilter, setShowCustomerReportFilter] = useState(false);
  const [showGpsReportFilter, setShowGpsReportFilter] = useState(false);
  const [showUsageSummaryFilter, setShowUsageSummaryFilter] = useState(false);
  const [showZeroUsageFilter, setShowZeroUsageFilter] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    kondisi: [],
    usage: [],
    branches: []
  });
  const [selectedFilters, setSelectedFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    kondisi: 'Semua',
    ocr: 'Semua',
    usage: 'Semua',
    branch: 'Semua',
    date: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });



  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [kondisiRes, usageRes, branchesRes] = await Promise.all([
          fetch('./api/options.php?type=status_kondisi'),
          fetch('./api/options.php?type=status_analisa'),
          fetch('./api/options.php?type=cabang')
        ]);
        const KondisiData = await kondisiRes.json();
        const UsageData = await usageRes.json();
        const BranchData = await branchesRes.json();
        setFilterOptions({
          kondisi: Array.isArray(KondisiData) ? KondisiData : [],
          usage: Array.isArray(UsageData) ? UsageData : [],
          branches: Array.isArray(BranchData) ? BranchData : []
        });
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    fetchOptions();
  }, []);

  const handleGenerateReport = () => {
    const params = new URLSearchParams({
      month: selectedFilters.month,
      year: selectedFilters.year,
      kondisi_meter: selectedFilters.kondisi,
      ocr_status: selectedFilters.ocr,
      usage_status: selectedFilters.usage
    });
    window.open(`./api/ocr_report_pdf.php?${params.toString()}`, '_blank');
    setShowReportFilter(false);
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams({
      month: selectedFilters.month,
      year: selectedFilters.year,
      kondisi_meter: selectedFilters.kondisi,
      ocr_status: selectedFilters.ocr,
      usage_status: selectedFilters.usage,
      format: 'excel'
    });
    window.location.href = `./api/ocr_report_csv.php?${params.toString()}`;
    setShowReportFilter(false);
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      month: selectedFilters.month,
      year: selectedFilters.year,
      kondisi_meter: selectedFilters.kondisi,
      ocr_status: selectedFilters.ocr,
      usage_status: selectedFilters.usage,
      format: 'csv'
    });
    window.location.href = `./api/ocr_report_csv.php?${params.toString()}`;
    setShowReportFilter(false);
  };

  const handleGeneratePerformanceReport = () => {
    const params = new URLSearchParams({
      month: selectedFilters.month,
      year: selectedFilters.year,
      branch_code: selectedFilters.branch,
      date: selectedFilters.date,
      start_date: selectedFilters.startDate,
      end_date: selectedFilters.endDate
    });
    window.open(`./api/officer_performance_report_pdf.php?${params.toString()}`, '_blank');
    setShowPerformanceFilter(false);
  };

  const handleExportPerformanceCSV = () => {
    const params = new URLSearchParams({
      month: selectedFilters.month,
      year: selectedFilters.year,
      branch_code: selectedFilters.branch,
      date: selectedFilters.date,
      start_date: selectedFilters.startDate,
      end_date: selectedFilters.endDate,
      format: 'csv'
    });
    window.location.href = `./api/officer_performance_report_csv.php?${params.toString()}`;
    setShowPerformanceFilter(false);
  };
  const handleExportPerformanceExcel = () => {
    const params = new URLSearchParams({
      month: selectedFilters.month,
      year: selectedFilters.year,
      branch_code: selectedFilters.branch,
      date: selectedFilters.date,
      start_date: selectedFilters.startDate,
      end_date: selectedFilters.endDate,
      format: 'excel'
    });
    window.location.href = `./api/officer_performance_report_csv.php?${params.toString()}`;
    setShowPerformanceFilter(false);
  };

  const handleGenerateCustomerReport = () => {
    const params = new URLSearchParams({
      branch_code: selectedFilters.branch
    });
    window.open(`./api/customer_list_report_pdf.php?${params.toString()}`, '_blank');
    setShowCustomerReportFilter(false);
  };

  const handleGenerateGpsReport = () => {
    const params = new URLSearchParams({
      month: selectedFilters.month,
      year: selectedFilters.year,
      branch_code: selectedFilters.branch
    });
    window.open(`./api/gps_audit_report_pdf.php?${params.toString()}`, '_blank');
    setShowGpsReportFilter(false);
  };

  const handleGenerateUsageSummaryReport = () => {
    const params = new URLSearchParams({
      month: selectedFilters.month,
      year: selectedFilters.year,
      branch_code: selectedFilters.branch
    });
    window.open(`./api/usage_summary_report_pdf.php?${params.toString()}`, '_blank');
    setShowUsageSummaryFilter(false);
  };

  const handleGenerateZeroUsageReport = () => {
    const params = new URLSearchParams({
      month: selectedFilters.month,
      year: selectedFilters.year,
      branch_code: selectedFilters.branch
    });
    window.open(`./api/zero_usage_report_pdf.php?${params.toString()}`, '_blank');
    setShowZeroUsageFilter(false);
  };

  const handleExportCustomerCSV = () => {
    const params = new URLSearchParams({
      branch_code: selectedFilters.branch,
      format: 'csv'
    });
    window.location.href = `./api/customer_list_report_csv.php?${params.toString()}`;
    setShowCustomerReportFilter(false);
  };

  const handleExportCustomerExcel = () => {
    const params = new URLSearchParams({
      branch_code: selectedFilters.branch,
      format: 'excel'
    });
    window.location.href = `./api/customer_list_report_csv.php?${params.toString()}`;
    setShowCustomerReportFilter(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'catat', label: 'Pencatatan Bulan Berjalan', icon: <Droplets size={20} /> },
    {
      id: 'analisa',
      label: 'Analisa Baca Meter',
      icon: <BarChart2 size={20} />,
      subItems: [
        { id: 'analisa_review', label: 'Daftar Koreksi ABM' },
      ]
    },
    { id: 'pelanggan', label: 'Data Pelanggan', icon: <Users size={20} /> },
    {
      id: 'cabang_parent',
      label: 'Manajemen Operasional',
      icon: <Building2 size={20} />,
      subItems: [
        { id: 'cabang', label: 'Daftar Cabang' },
        { id: 'petugas', label: 'Daftar Petugas' },
        { id: 'petugas_mapping', label: 'Pemetaan Tugas' },
        { id: 'pelanggan_mapping', label: 'Pemetaan Pelanggan' },
      ]
    },
    {
      id: 'laporan_parent',
      label: 'Laporan',
      icon: <FileText size={20} />,
      subItems: [
        { id: 'laporan_cabang', label: 'Report Cabang' },
        { id: 'laporan_petugas', label: 'Report Petugas' },
        { id: 'laporan_analisa_ocr', label: 'Report ABM' },
        { id: 'laporan_kinerja', label: 'Report Kinerja' },
        { id: 'laporan_pelanggan_list', label: 'Report Pelanggan' },
        { id: 'laporan_gps_audit', label: 'Report Audit GPS' },
        { id: 'laporan_usage_summary', label: 'Report Rekap Pemakaian' },
        { id: 'laporan_zero_usage', label: 'Report Meter Nol' },
      ]
    },
    { id: 'history_catat', label: 'History Pencatatan', icon: <History size={20} /> },
    { id: 'pengaturan', label: 'Pengaturan', icon: <Settings size={20} /> },
  ];

  const handleTabClick = (id) => {
    if (id === 'laporan_petugas') {
      window.open('./api/officer_report_pdf.php', '_blank');
      return;
    }
    if (id === 'laporan_cabang') {
      window.open('./api/branch_report_pdf.php', '_blank');
      return;
    }
    if (id === 'laporan_analisa_ocr') {
      setShowReportFilter(true);
      return;
    }
    if (id === 'laporan_kinerja') {
      setShowPerformanceFilter(true);
      return;
    }
    if (id === 'laporan_pelanggan_list') {
      setShowMaintenanceModal(true);
      return;
    }
    if (id === 'laporan_gps_audit') {
      setShowGpsReportFilter(true);
      return;
    }
    if (id === 'laporan_usage_summary') {
      setShowUsageSummaryFilter(true);
      return;
    }
    if (id === 'laporan_zero_usage') {
      setShowZeroUsageFilter(true);
      return;
    }
    setActiveTab(id);
    if (isMobile) setIsSidebarOpen(false);
  };

  const toggleMenu = (id) => {
    setExpandedMenus(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="app-layout">
      {/* Sidebar Overlay for Mobile */}
      <div
        className={`sidebar-overlay ${isMobile && isSidebarOpen ? 'visible' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          <button className="btn-menu" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
        </div>

        <div className="mobile-header-center">
          <div className="mobile-logo-container">
            <img src="logo-icon.svg" alt="" className="mobile-logo-icon" />
            <span className="mobile-logo-text">PDAM SMART</span>
          </div>
        </div>

        <div className="mobile-header-right">
          {/* Placeholder for Profile or Other actions like in ss 1 */}
          <button className="btn-menu">
            <UserCircle size={24} />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`sidebar ${isMobile ? (isSidebarOpen ? 'visible-mobile' : 'hidden-mobile') : (isSidebarOpen ? 'open' : 'closed')}`}
        style={isMobile && !isSidebarOpen ? { display: 'none' } : {}}
      >
        <div className="sidebar-header" style={{ justifyContent: 'center', padding: (isSidebarOpen || isMobile) ? '2rem 1rem' : '1rem 0.5rem', transition: 'padding 0.3s ease' }}>
          <img
            src="logo.png"
            alt="PDAM App"
            style={{
              height: '130px',
              maxHeight: '15vh',
              width: 'auto',
              maxWidth: '100%',
              borderRadius: '8px',
              display: (isSidebarOpen || isMobile) ? 'block' : 'none',
              animation: 'fadeIn 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
          />

          <img
            src="logo-icon.svg"
            alt="PDAM"
            style={{
              height: '40px',
              width: '40px',
              objectFit: 'contain',
              display: (isSidebarOpen || isMobile) ? 'none' : 'block'
            }}
          />
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{ position: 'absolute', right: '10px', top: '15px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExactActive = activeTab === item.id;
            const isParentOfActive = hasSubItems && item.subItems.some(sub => sub.id === activeTab);
            const isExpanded = expandedMenus.includes(item.id);

            return (
              <div key={item.id} className="menu-group">
                <button
                  className={`nav-item ${isExactActive ? 'active' : ''} ${isParentOfActive ? 'parent-active' : ''}`}
                  onClick={() => {
                    if (hasSubItems) {
                      toggleMenu(item.id);
                      if (item.id !== 'cabang_parent' && item.id !== 'laporan_parent') {
                        handleTabClick(item.id);
                      }
                      if (!isSidebarOpen) setIsSidebarOpen(true);
                    } else {
                      handleTabClick(item.id);
                    }
                  }}
                >
                  {item.icon}
                  {(isSidebarOpen || isMobile) && (
                    <>
                      <span>{item.label}</span>
                      {hasSubItems && (
                        <ChevronDown
                          size={16}
                          className={`chevron-icon ${isExpanded ? 'rotated' : ''}`}
                        />
                      )}
                    </>
                  )}
                </button>

                {hasSubItems && (isSidebarOpen || isMobile) && (
                  <div className={`nav-submenu ${isExpanded ? 'open' : ''}`}>
                    {item.subItems.map(sub => (
                      <button
                        key={sub.id}
                        className={`sub-nav-item ${activeTab === sub.id ? 'active' : ''}`}
                        onClick={() => handleTabClick(sub.id)}
                      >
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }}></div>
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {!isMobile && (
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          {activeTab === 'dashboard' && <MemoizedDashboard onTabChange={handleTabClick} />}
          {activeTab === 'pelanggan' && <MemoizedCustomerManagement />}
          {activeTab === 'catat' && <MemoizedRecordingManagement />}
          {activeTab === 'history_catat' && <MemoizedRecordingManagement isHistory={true} />}
          {(activeTab === 'petugas' || activeTab === 'laporan_petugas') && <MemoizedOfficerManagement isReport={activeTab === 'laporan_petugas'} onReportClose={() => setActiveTab('petugas')} />}
          {activeTab === 'petugas_mapping' && <MemoizedOfficerMapping />}
          {(activeTab === 'analisa' || activeTab === 'analisa_all') && <MemoizedMeterAnalysis key="analisa_all" />}
          {activeTab === 'analisa_review' && <MemoizedMeterAnalysis key="analisa_review" ocrStatusFilter="REVIEW" />}
          {activeTab === 'pelanggan_mapping' && <MemoizedCustomerMapping />}
          {(activeTab === 'cabang' || activeTab === 'laporan_cabang') && <MemoizedBranchManagement isReport={activeTab === 'laporan_cabang'} onReportClose={() => setActiveTab('cabang')} />}
          {activeTab === 'pengaturan' && <MemoizedSettings />}

        </div>

        {/* Filter Modal for Report Analisa OCR */}
        {showReportFilter && (
          <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-content" style={{ width: '450px', background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'fadeInScale 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', overflow: 'visible' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Filter Laporan ABM</h3>
                <button onClick={() => setShowReportFilter(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Bulan</label>
                    <select
                      value={selectedFilters.month}
                      onChange={(e) => setSelectedFilters({ ...selectedFilters, month: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthIndex = i;
                        const date = new Date();
                        const currentMonth = date.getMonth();
                        const currentYear = date.getFullYear();
                        const isFuture = selectedFilters.year > currentYear || (Number(selectedFilters.year) === currentYear && monthIndex > currentMonth);

                        return (
                          <option key={i + 1} value={i + 1} disabled={isFuture}>
                            {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Tahun</label>
                    <select
                      value={selectedFilters.year}
                      onChange={(e) => setSelectedFilters({ ...selectedFilters, year: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                    >
                      {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Kondisi Meter</label>
                  <select
                    value={selectedFilters.kondisi}
                    onChange={(e) => setSelectedFilters({ ...selectedFilters, kondisi: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                  >
                    <option value="Semua">Semua Kondisi</option>
                    {filterOptions.kondisi.map(opt => (
                      <option key={opt.kode_kondisi} value={opt.kode_kondisi}>{opt.status_kondisi}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Kesesuaian Foto (AI)</label>
                  <select
                    value={selectedFilters.ocr}
                    onChange={(e) => setSelectedFilters({ ...selectedFilters, ocr: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Sesuai">Sesuai</option>
                    <option value="Terverifikasi">Terverifikasi (Verif Petugas)</option>
                    <option value="Butuh Review">Butuh Review</option>
                    <option value="Mismatch">Mismatch</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Status Pemakaian</label>
                  <select
                    value={selectedFilters.usage}
                    onChange={(e) => setSelectedFilters({ ...selectedFilters, usage: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                  >
                    <option value="Semua">Semua Pemakaian</option>
                    <option value="Meter Mundur">Meter Mundur</option>
                    {filterOptions.usage.map(opt => (
                      <option key={opt.status_analisa} value={opt.status_analisa}>{opt.status_analisa}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={handleGenerateReport}
                    style={{
                      padding: '0.75rem', borderRadius: '10px', border: 'none',
                      background: '#2563eb',
                      color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#1d4ed8';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FileText size={16} />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    style={{
                      padding: '0.75rem', borderRadius: '10px', border: 'none',
                      background: '#059669',
                      color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#047857';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#059669';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FileSpreadsheet size={16} />
                    <span>EXCEL</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    style={{
                      padding: '0.75rem', borderRadius: '10px', border: 'none',
                      background: '#475569',
                      color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#334155';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#475569';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FileDown size={16} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Modal for Officer Performance Report */}
        {showPerformanceFilter && (
          <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-content" style={{ width: '400px', background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'fadeInScale 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', overflow: 'visible' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Filter Laporan Kinerja</h3>
                <button onClick={() => setShowPerformanceFilter(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <SearchableSelect
                    label="Cabang"
                    options={[
                      { value: 'Semua', label: 'Semua Cabang' },
                      ...filterOptions.branches.map(b => ({ value: b.kode_cabang, label: b.cabang }))
                    ]}
                    value={selectedFilters.branch}
                    onChange={(e) => setSelectedFilters({ ...selectedFilters, branch: e.target.value })}
                    hideValue={true}
                    containerStyle={{ marginBottom: 0 }}
                    placeholder="Pilih Cabang..."
                    searchPlaceholder="Cari nama cabang..."
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#64748b', marginBottom: '0.75rem' }}>
                    <span>Pilih Tanggal</span>
                    {(selectedFilters.startDate || selectedFilters.endDate) && (
                      <button
                        onClick={() => setSelectedFilters({ ...selectedFilters, startDate: '', endDate: '' })}
                        style={{ fontSize: '0.7rem', color: '#ef4444', background: '#fee2e2', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Reset Tanggal
                      </button>
                    )}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="input-group">
                      <small style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: '0.25rem', display: 'block' }}>Dari Tanggal</small>
                      <input
                        type="date"
                        value={selectedFilters.startDate}
                        onChange={(e) => setSelectedFilters({ ...selectedFilters, startDate: e.target.value, date: '' })}
                        max={new Date().toISOString().split('T')[0]}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div className="input-group">
                      <small style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: '0.25rem', display: 'block' }}>Sampai Tanggal</small>
                      <input
                        type="date"
                        value={selectedFilters.endDate}
                        onChange={(e) => setSelectedFilters({ ...selectedFilters, endDate: e.target.value, date: '' })}
                        max={new Date().toISOString().split('T')[0]}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>
                  {(() => {
                    const diffTime = Math.abs(new Date(selectedFilters.endDate) - new Date(selectedFilters.startDate));
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    if (diffDays > 7) {
                      return (
                        <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 600 }}>
                          ⚠️ Maksimal Penarikan 7 hari
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'
                }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Bulan</label>
                    <select
                      value={selectedFilters.month}
                      onChange={(e) => setSelectedFilters({ ...selectedFilters, month: e.target.value, startDate: '', endDate: '' })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthIndex = i;
                        const date = new Date();
                        const currentMonthCount = date.getMonth() + 1;
                        const currentYearCount = date.getFullYear();
                        const isFuture = selectedFilters.year > currentYearCount || (Number(selectedFilters.year) === currentYearCount && monthIndex + 1 > currentMonthCount);

                        return (
                          <option key={i + 1} value={i + 1} disabled={isFuture}>
                            {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Tahun</label>
                    <select
                      value={selectedFilters.year}
                      onChange={(e) => setSelectedFilters({ ...selectedFilters, year: e.target.value, startDate: '', endDate: '' })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                    >
                      {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1.5rem',
                  opacity: (() => {
                    const now = new Date();
                    const isCurrentMonth = Number(selectedFilters.month) === (now.getMonth() + 1) && Number(selectedFilters.year) === now.getFullYear();
                    const diffTime = Math.abs(new Date(selectedFilters.endDate) - new Date(selectedFilters.startDate));
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                    // Logic: Must use range and <= 7 days IF it's current month. 
                    // Or if range is used anywhere, must be <= 7 days.
                    const isRangeUsed = selectedFilters.startDate && selectedFilters.endDate;
                    if (isRangeUsed && diffDays > 7) return 0.5;
                    if (isCurrentMonth && !isRangeUsed) return 0.5;
                    return 1;
                  })(),
                  pointerEvents: (() => {
                    const now = new Date();
                    const isCurrentMonth = Number(selectedFilters.month) === (now.getMonth() + 1) && Number(selectedFilters.year) === now.getFullYear();
                    const diffTime = Math.abs(new Date(selectedFilters.endDate) - new Date(selectedFilters.startDate));
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                    const isRangeUsed = selectedFilters.startDate && selectedFilters.endDate;
                    if (isRangeUsed && diffDays > 7) return 'none';
                    if (isCurrentMonth && !isRangeUsed) return 'none';
                    return 'auto';
                  })()
                }}>
                  <button
                    onClick={handleGeneratePerformanceReport}
                    style={{
                      padding: '0.75rem', borderRadius: '10px', border: 'none',
                      background: '#2563eb',
                      color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#1d4ed8';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FileText size={16} />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={handleExportPerformanceExcel}
                    style={{
                      padding: '0.75rem', borderRadius: '10px', border: 'none',
                      background: '#059669',
                      color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#047857';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#059669';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FileSpreadsheet size={16} />
                    <span>EXCEL</span>
                  </button>

                  <button
                    onClick={handleExportPerformanceCSV}
                    style={{
                      padding: '0.75rem', borderRadius: '10px', border: 'none',
                      background: '#475569',
                      color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#334155';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#475569';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FileDown size={16} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Modal for GPS Audit Report */}
        {showGpsReportFilter && (
          <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-content" style={{ width: '400px', background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'fadeInScale 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', overflow: 'visible' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Filter Audit GPS</h3>
                <button onClick={() => setShowGpsReportFilter(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <SearchableSelect
                    label="Cabang"
                    options={[{ value: 'Semua', label: 'Semua Cabang' }, ...filterOptions.branches.map(b => ({ value: b.kode_cabang, label: b.cabang }))]}
                    value={selectedFilters.branch}
                    onChange={(e) => setSelectedFilters({ ...selectedFilters, branch: e.target.value })}
                    hideValue={true} containerStyle={{ marginBottom: 0 }} placeholder="Pilih Cabang..." searchPlaceholder="Cari nama cabang..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Bulan</label>
                    <select value={selectedFilters.month} onChange={(e) => setSelectedFilters({ ...selectedFilters, month: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Tahun</label>
                    <select value={selectedFilters.year} onChange={(e) => setSelectedFilters({ ...selectedFilters, year: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleGenerateGpsReport} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <FileText size={18} /> <span>Generate Report (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Modal for Usage Summary Report */}
        {showUsageSummaryFilter && (
          <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-content" style={{ width: '400px', background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'fadeInScale 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', overflow: 'visible' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Filter Rekap Pemakaian</h3>
                <button onClick={() => setShowUsageSummaryFilter(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <SearchableSelect
                    label="Cabang"
                    options={[{ value: 'Semua', label: 'Semua Cabang' }, ...filterOptions.branches.map(b => ({ value: b.kode_cabang, label: b.cabang }))]}
                    value={selectedFilters.branch}
                    onChange={(e) => setSelectedFilters({ ...selectedFilters, branch: e.target.value })}
                    hideValue={true} containerStyle={{ marginBottom: 0 }} placeholder="Pilih Cabang..." searchPlaceholder="Cari nama cabang..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Bulan</label>
                    <select value={selectedFilters.month} onChange={(e) => setSelectedFilters({ ...selectedFilters, month: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Tahun</label>
                    <select value={selectedFilters.year} onChange={(e) => setSelectedFilters({ ...selectedFilters, year: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleGenerateUsageSummaryReport} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#059669', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <FileText size={18} /> <span>Generate Report (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Modal for Zero Usage Report */}
        {showZeroUsageFilter && (
          <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-content" style={{ width: '400px', background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'fadeInScale 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', overflow: 'visible' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Filter Laporan Meter Nol</h3>
                <button onClick={() => setShowZeroUsageFilter(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <SearchableSelect
                    label="Cabang"
                    options={[{ value: 'Semua', label: 'Semua Cabang' }, ...filterOptions.branches.map(b => ({ value: b.kode_cabang, label: b.cabang }))]}
                    value={selectedFilters.branch}
                    onChange={(e) => setSelectedFilters({ ...selectedFilters, branch: e.target.value })}
                    hideValue={true} containerStyle={{ marginBottom: 0 }} placeholder="Pilih Cabang..." searchPlaceholder="Cari nama cabang..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Bulan</label>
                    <select value={selectedFilters.month} onChange={(e) => setSelectedFilters({ ...selectedFilters, month: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Tahun</label>
                    <select value={selectedFilters.year} onChange={(e) => setSelectedFilters({ ...selectedFilters, year: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleGenerateZeroUsageReport} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#1e293b', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <FileText size={18} /> <span>Generate Report (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal for Under Development Features */}
        {showMaintenanceModal && (
          <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-content" style={{ width: '400px', background: 'white', borderRadius: '16px', padding: '2.5rem 2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'fadeInScale 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Construction size={40} color="#d97706" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Tahap Pengembangan</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '2rem' }}>
                Fitur <strong>Laporan Pelanggan</strong> sedang dalam proses integrasi data. Mohon tunggu pembaruan selanjutnya!
              </p>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                style={{
                  width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: 'white', fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

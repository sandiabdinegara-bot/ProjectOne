import React, { useState, useEffect } from 'react';
import { Building2, Users, Droplets, BarChart2, History, FileText, X, LayoutDashboard, Settings, UserCircle, LogOut, Menu, ChevronLeft, Building, UserPlus, MapPin, ClipboardList, TrendingUp, HelpCircle, ChevronDown, FileSpreadsheet, FileDown } from 'lucide-react';
import CustomerManagement from './components/CustomerManagement';
import BranchManagement from './components/BranchManagement';
import RecordingManagement from './components/RecordingManagement';
import OfficerManagement from './components/OfficerManagement';
import OfficerMapping from './components/OfficerMapping';
import MeterAnalysis from './components/MeterAnalysis';
import CustomerMapping from './components/CustomerMapping';
import Dashboard from './components/Dashboard';


// Memoized Components to prevent unnecessary re-renders when sidebar toggles
const MemoizedDashboard = React.memo(Dashboard);
const MemoizedCustomerManagement = React.memo(CustomerManagement);
const MemoizedBranchManagement = React.memo(BranchManagement);
const MemoizedRecordingManagement = React.memo(RecordingManagement);
const MemoizedOfficerManagement = React.memo(OfficerManagement);
const MemoizedOfficerMapping = React.memo(OfficerMapping);
const MemoizedMeterAnalysis = React.memo(MeterAnalysis);
const MemoizedCustomerMapping = React.memo(CustomerMapping);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedMenus, setExpandedMenus] = useState(['analisa']); // Keep analisa expanded by default or from storage
  const [showReportFilter, setShowReportFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    kondisi: [],
    usage: []
  });
  const [selectedFilters, setSelectedFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    kondisi: 'Semua',
    ocr: 'Semua',
    usage: 'Semua'
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
        const [kondisiRes, usageRes] = await Promise.all([
          fetch('./api/options.php?type=status_kondisi'),
          fetch('./api/options.php?type=status_analisa')
        ]);
        const KondisiData = await kondisiRes.json();
        const UsageData = await usageRes.json();
        setFilterOptions({
          kondisi: Array.isArray(KondisiData) ? KondisiData : [],
          usage: Array.isArray(UsageData) ? UsageData : []
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard size={20} /> },
    {
      id: 'cabang_parent',
      label: 'Data Cabang',
      icon: <Building2 size={20} />,
      subItems: [
        { id: 'cabang', label: 'Daftar Cabang' },
        { id: 'petugas', label: 'Daftar Petugas' },
        { id: 'petugas_mapping', label: 'Pemetaan Tugas' },
        { id: 'pelanggan_mapping', label: 'Pemetaan Pelanggan' },
      ]
    },
    { id: 'pelanggan', label: 'Data Pelanggan', icon: <Users size={20} /> },
    { id: 'catat', label: 'Pencatatan Bulan Berjalan', icon: <Droplets size={20} /> },
    {
      id: 'analisa',
      label: 'Analisa Baca Meter',
      icon: <BarChart2 size={20} />,
      subItems: [
        { id: 'analisa_review', label: 'Daftar Koreksi ABM' },
      ]
    },
    { id: 'history_catat', label: 'History Pencatatan', icon: <History size={20} /> },
    {
      id: 'laporan_parent',
      label: 'Laporan',
      icon: <FileText size={20} />,
      subItems: [
        { id: 'laporan_cabang', label: 'Report Cabang' },
        { id: 'laporan_petugas', label: 'Report Petugas' },
        { id: 'laporan_analisa_ocr', label: 'Report ABM' },
      ]
    },
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
        <button className="btn-menu" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="logo.svg" alt="PDAM Smart" style={{ height: '50px', width: 'auto' }} />
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobile ? (isSidebarOpen ? 'visible-mobile' : 'hidden-mobile') : (isSidebarOpen ? 'open' : 'closed')}`}>
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
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Status OCR (Kesesuaian)</label>
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
      </main>
    </div>
  );
}

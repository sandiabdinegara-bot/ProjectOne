import React, { useState, useEffect } from 'react';
import { Users, Building2, Droplets, Menu, X, User, History, BarChart2, ChevronDown } from 'lucide-react';
import CustomerManagement from './components/CustomerManagement';
import BranchManagement from './components/BranchManagement';
import RecordingManagement from './components/RecordingManagement';
import OfficerManagement from './components/OfficerManagement';
import OfficerMapping from './components/OfficerMapping';
import MeterAnalysis from './components/MeterAnalysis';


export default function App() {
  const [activeTab, setActiveTab] = useState(localStorage.getItem('pdam_active_tab') || 'pelanggan');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedMenus, setExpandedMenus] = useState(['analisa']); // Keep analisa expanded by default or from storage

  useEffect(() => {
    localStorage.setItem('pdam_active_tab', activeTab);
  }, [activeTab]);

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

  const menuItems = [
    {
      id: 'cabang_parent',
      label: 'Data Cabang',
      icon: <Building2 size={20} />,
      subItems: [
        { id: 'cabang', label: 'Daftar Cabang' },
        { id: 'petugas', label: 'Daftar Petugas' },
        { id: 'petugas_mapping', label: 'Pemetaan Tugas' },
      ]
    },
    { id: 'pelanggan', label: 'Data Pelanggan', icon: <Users size={20} /> },
    { id: 'catat', label: 'Pencatatan Meter Berjalan', icon: <Droplets size={20} /> },
    {
      id: 'analisa',
      label: 'Analisa Baca Meter',
      icon: <BarChart2 size={20} />,
      subItems: [
        { id: 'analisa_review', label: 'Daftar Koreksi ABM' },
      ]
    },
    { id: 'history_catat', label: 'History Pencatatan', icon: <History size={20} /> },
  ];

  const handleTabClick = (id) => {
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
          {/* Large Logo - Always rendered but hidden when closed */}
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

          {/* Small Logo - Always rendered but hidden when open */}
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
                      if (item.id !== 'cabang_parent') {
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
          {activeTab === 'pelanggan' ? <CustomerManagement /> :
            activeTab === 'catat' ? <RecordingManagement /> :
              activeTab === 'history_catat' ? <RecordingManagement isHistory={true} /> :
                activeTab === 'petugas' ? <OfficerManagement /> :
                  activeTab === 'petugas_mapping' ? <OfficerMapping /> :
                    (activeTab === 'analisa' || activeTab === 'analisa_all') ? <MeterAnalysis key="analisa_all" /> :
                      activeTab === 'analisa_review' ? <MeterAnalysis key="analisa_review" ocrStatusFilter="REVIEW" /> :
                        <BranchManagement />}
        </div>
      </main>
    </div>
  );
}

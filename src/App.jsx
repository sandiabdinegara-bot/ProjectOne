import React, { useState, useEffect } from 'react';
import { Droplets, Menu, X, User, History, BarChart2, ChevronDown, LogOut,  CheckCheck, Database, ShieldAlert, ClipboardList } from 'lucide-react';
import CustomerManagement from './components/CustomerManagement';
import BranchManagement from './components/BranchManagement';
import RecordingManagement from './components/RecordingManagement';
import OfficerManagement from './components/OfficerManagement';
import OfficerMapping from './components/OfficerMapping';
import MeterAnalysis from './components/MeterAnalysis';
import LoginPage from './components/LoginPage';
import { AUTH_KEY, TOKEN_KEY, USER_KEY, isAuthenticated as checkAuth, clearExpiredAuth } from './auth';

function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth);
  const [activeTab, setActiveTab] = useState(localStorage.getItem('pdam_active_tab') || 'pelanggan');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedMenus, setExpandedMenus] = useState(['analisa']); // Keep analisa expanded by default or from storage

  useEffect(() => {
    clearExpiredAuth();
  }, []);

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
    { id: 'catat', label: 'Pencatatan Meter Berjalan', icon: <Droplets size={20} /> },
    { id: 'history_catat', label: 'Histori Pencatatan Meter', icon: <History size={20} /> },
    { id: 'analisa_review', label: 'Analisa Pencatatan Meter', icon: <BarChart2 size={20} /> },
    { id: 'analisa_review', label: 'Koreksi Pencatatan Meter', icon: <CheckCheck size={20} /> },
    { id: 'analisa_kebocoran', label: 'Analisa Kebocoran', icon: <ShieldAlert size={20} /> },
    {
      id: 'laporan_parent',
      label: 'Laporan',
      icon: <ClipboardList size={20} />,
      subItems: [
        { id: 'cabang', label: 'Laporan Produktivitas' },
        { id: 'user', label: 'Laporan Debit Air' },
        { id: 'petugas', label: 'Laporan Distribusi' },
      ]
    },
    {
      id: 'cabang_parent',
      label: 'Data Master',
      icon: <Database size={20} />,
      subItems: [
        { id: 'cabang', label: 'Data Cabang' },
        { id: 'user', label: 'Data User' },
        { id: 'petugas', label: 'Data Petugas' },
        { id: 'pelanggan', label: 'Data Pelanggan' },
        { id: 'petugas_mapping', label: 'Data Rute' },
      ]
    },
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

  if (!isAuthenticated) {
    return (
      <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
    );
  }

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

        <div className="sidebar-footer">
          <button type="button" className="sidebar-logout" onClick={() => { logout(); setIsAuthenticated(false); }}>
            <LogOut size={20} />
            {(isSidebarOpen || isMobile) && <span>Keluar</span>}
          </button>
        </div>

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

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Building2, Map as MapIcon, Search, RefreshCw, Filter, Layers, Navigation, Info, User, Home, Phone, Hash, MapPin } from 'lucide-react';
import L from 'leaflet';
import Swal from 'sweetalert2';
import SearchableSelect from './common/SearchableSelect';

// Leaflet marker icons fix for React
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Component to handle map center and zoom changes
function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
}

const CustomerMapping = () => {
    const [branches, setBranches] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters & UI State
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedRoute, setSelectedRoute] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showList, setShowList] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Map State
    const [mapCenter, setMapCenter] = useState([-7.5, 110.5]); // Default center (Central Java area)
    const [mapZoom, setMapZoom] = useState(13);

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

    const fetchRoutesByBranch = async (branchCode) => {
        if (!branchCode) {
            setRoutes([]);
            return;
        }
        try {
            const res = await fetch(`./api/options.php?type=rute&kode_cabang=${branchCode}`);
            const data = await res.json();
            setRoutes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch routes:', err);
        }
    };

    const fetchCustomers = async (routeCode) => {
        if (!routeCode) {
            setCustomers([]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`./api/customers.php?kode_rute=${routeCode}&kode_cabang=${selectedBranch}`);
            const data = await res.json();
            const validData = Array.isArray(data) ? data : [];

            // Filter to ensure exact route match
            const filteredData = validData.filter(c => c.kode_rute === routeCode);
            setCustomers(filteredData);

            // Find first customer with coordinates to center the map
            const firstWithCoords = filteredData.find(c => c.latitude && c.longitude);
            if (firstWithCoords) {
                setMapCenter([parseFloat(firstWithCoords.latitude), parseFloat(firstWithCoords.longitude)]);
                setMapZoom(16);
            }
        } catch (err) {
            console.error('Failed to fetch customers:', err);
            Swal.fire('Error', 'Gagal memuat data pelanggan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const term = searchTerm.toLowerCase();
            if (!term) return true;
            return (
                c.nama.toLowerCase().includes(term) ||
                c.id_sambungan.includes(term) ||
                (c.alamat && c.alamat.toLowerCase().includes(term))
            );
        });
    }, [customers, searchTerm]);

    const mappedCustomers = filteredCustomers.filter(c => c.latitude && c.longitude);
    const unmappedCount = filteredCustomers.length - mappedCustomers.length;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            {!isFullscreen && (
                <header className="header" style={{ marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                            <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.625rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MapIcon size={32} color="var(--primary)" />
                            </div>
                            Pemetaan Pelanggan
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Visualisasi Lokasi Pelanggan Berdasarkan Rute</p>
                    </div>
                </header>
            )}

            <div className="card" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: isFullscreen ? '0' : '1.5rem',
                gap: isFullscreen ? '0' : '1.5rem',
                height: isFullscreen ? '100vh' : 'calc(100vh - 130px)',
                minHeight: isFullscreen ? '100vh' : 'calc(100vh - 130px)',
                position: isFullscreen ? 'fixed' : 'relative',
                top: isFullscreen ? 0 : 'auto',
                left: isFullscreen ? 0 : 'auto',
                width: isFullscreen ? '100vw' : '100%',
                zIndex: isFullscreen ? 1000 : 'auto',
                borderRadius: isFullscreen ? 0 : 'var(--radius)',
                border: isFullscreen ? 'none' : '1px solid var(--border)',
                transition: 'all 0.3s ease'
            }}>
                {/* Filters Bar */}
                {!isFullscreen && (
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <SearchableSelect
                            label="CABANG"
                            placeholder="-- Pilih Cabang --"
                            icon={Building2}
                            options={branches.map(b => ({ value: b.kode_cabang, label: b.cabang }))}
                            value={selectedBranch}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedBranch(val);
                                setSelectedRoute('');
                                fetchRoutesByBranch(val);
                                setCustomers([]);
                            }}
                            containerStyle={{ flex: '0 0 220px', marginBottom: 0 }}
                            hideValue={true}
                        />

                        <SearchableSelect
                            label="RUTE"
                            placeholder={selectedBranch ? "-- Pilih Rute --" : "Pilih cabang dahulu"}
                            icon={Navigation}
                            options={routes.map(r => ({ value: r.kode_rute, label: `${r.kode_rute} - ${r.rute}` }))}
                            value={selectedRoute}
                            disabled={!selectedBranch}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedRoute(val);
                                fetchCustomers(val);
                            }}
                            containerStyle={{ flex: '0 0 280px', marginBottom: 0 }}
                            hideValue={true}
                        />

                        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                CARI PELANGGAN
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="Nama, No. Sambungan..."
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
                                        background: 'white'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setShowList(!showList)}
                                disabled={!selectedRoute}
                                title={showList ? "Tutup Daftar" : "Review Pelanggan"}
                                style={{
                                    height: '42px',
                                    padding: '0 1rem',
                                    borderRadius: '8px',
                                    border: `1px solid ${showList ? 'var(--primary)' : '#e2e8f0'}`,
                                    background: showList ? '#f0f9ff' : 'white',
                                    color: showList ? 'var(--primary)' : '#64748b',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {showList ? <MapIcon size={18} /> : <Layers size={18} />}
                                <span className="hide-mobile">{showList ? "Tutup Daftar" : "Daftar Pelanggan"}</span>
                            </button>

                            <button
                                onClick={() => fetchCustomers(selectedRoute)}
                                disabled={!selectedRoute || loading}
                                style={{
                                    height: '42px',
                                    padding: '0 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    background: 'white',
                                    color: 'var(--primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 600
                                }}
                            >
                                <RefreshCw size={18} className={loading ? 'spin' : ''} />
                                Refresh
                            </button>
                        </div>
                    </div>
                )}

                {/* Statistics */}
                {selectedRoute && !isFullscreen && (
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div style={{ flex: 1, background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '0.75rem', borderRadius: '10px' }}>
                                <User size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>TOTAL PELANGGAN</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{filteredCustomers.length}</div>
                            </div>
                        </div>
                        <div style={{ flex: 1, background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#f0fdf4', color: '#22c55e', padding: '0.75rem', borderRadius: '10px' }}>
                                <Layers size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>TERPETAKAN</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{mappedCustomers.length}</div>
                            </div>
                        </div>
                        <div style={{ flex: 1, background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.75rem', borderRadius: '10px' }}>
                                <Info size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>BELUM TERPETAKAN</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{unmappedCount}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div style={{ flex: 1, display: 'flex', gap: isFullscreen ? '0' : '1.5rem', overflow: 'hidden', position: 'relative' }}>
                    {/* Map Container */}
                    <div style={{
                        flex: 1,
                        overflow: 'hidden',
                        border: isFullscreen ? 'none' : '1px solid #e2e8f0',
                        borderRadius: isFullscreen ? 0 : '12px',
                        minHeight: '200px',
                        position: 'relative'
                    }}>
                        <MapContainer
                            center={mapCenter}
                            zoom={mapZoom}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                            attributionControl={false}
                        >
                            <ChangeView center={mapCenter} zoom={mapZoom} />
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {mappedCustomers.map((customer) => (
                                <Marker
                                    key={customer.id}
                                    position={[parseFloat(customer.latitude), parseFloat(customer.longitude)]}
                                >
                                    <Popup minWidth={250}>
                                        <div style={{ padding: '0.5rem 0' }}>
                                            {customer.foto_rumah && (
                                                <div style={{
                                                    marginBottom: '1rem',
                                                    borderRadius: '10px',
                                                    overflow: 'hidden',
                                                    border: '1px solid #e2e8f0',
                                                    background: '#f8fafc',
                                                    height: '140px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <img
                                                        src={customer.foto_rumah}
                                                        alt="Foto Rumah"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.parentElement.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>
                                                <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700 }}>{customer.nama}</h3>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{customer.id_sambungan}</div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                    <Home size={14} style={{ marginTop: '3px', color: '#94a3b8' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Alamat</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>{customer.alamat || '-'}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                    <Phone size={14} style={{ marginTop: '3px', color: '#94a3b8' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Telepon</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#334155' }}>{customer.telepon || '-'}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                    <Hash size={14} style={{ marginTop: '3px', color: '#94a3b8' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Detail Teknis</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#334155' }}>Tarif: {customer.kode_tarif} | Rute: {customer.kode_rute}</div>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => {
                                                            setMapCenter([parseFloat(customer.latitude), parseFloat(customer.longitude)]);
                                                            setMapZoom(18);
                                                        }}
                                                        style={{
                                                            background: 'none',
                                                            border: '1px solid var(--primary)',
                                                            color: 'var(--primary)',
                                                            padding: '4px 10px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            marginRight: '0.5rem'
                                                        }}
                                                    >
                                                        Fokus
                                                    </button>
                                                    <a
                                                        href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            background: 'var(--primary)',
                                                            color: 'white',
                                                            padding: '4px 10px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            textDecoration: 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <Navigation size={12} /> Maps
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>

                        {/* Fullscreen Toggle Button */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                zIndex: 1000,
                                background: 'white',
                                border: '2px solid rgba(0,0,0,0.2)',
                                borderRadius: '4px',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
                                transition: 'all 0.2s'
                            }}
                            title={isFullscreen ? "Keluar Fullscreen" : "Tampilan Penuh"}
                        >
                            <div style={{ color: '#333' }}>
                                {isFullscreen ? <X size={20} /> : <Layers size={20} />}
                            </div>
                        </button>

                        {/* Floating List Toggle in Fullscreen */}
                        {isFullscreen && (
                            <button
                                onClick={() => setShowList(!showList)}
                                style={{
                                    position: 'absolute',
                                    top: '60px',
                                    right: '10px',
                                    zIndex: 1000,
                                    background: 'white',
                                    border: '2px solid rgba(0,0,0,0.2)',
                                    borderRadius: '4px',
                                    padding: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 1px 5px rgba(0,0,0,0.4)'
                                }}
                                title="Daftar Pelanggan"
                            >
                                <Search size={20} color="var(--primary)" />
                            </button>
                        )}
                    </div>

                    {/* Review List Sidebar */}
                    {showList && (
                        <div style={{
                            width: isFullscreen ? '300px' : '350px',
                            border: isFullscreen ? 'none' : '1px solid #e2e8f0',
                            borderLeft: isFullscreen ? '1px solid #e2e8f0' : 'none',
                            borderRadius: isFullscreen ? 0 : '12px',
                            background: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            position: isFullscreen ? 'absolute' : 'relative',
                            right: 0,
                            top: 0,
                            height: '100%',
                            zIndex: 1001,
                            boxShadow: isFullscreen ? '-5px 0 15px rgba(0,0,0,0.1)' : 'none',
                            animation: 'slideInRight 0.3s ease-out'
                        }}>
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#334155' }}>DAFTAR PELANGGAN</h3>
                                <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 700, background: 'var(--primary)', padding: '2px 10px', borderRadius: '20px' }}>
                                    {mappedCustomers.length}
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                                {mappedCustomers.length > 0 ? (
                                    mappedCustomers.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => {
                                                setMapCenter([parseFloat(c.latitude), parseFloat(c.longitude)]);
                                                setMapZoom(18);
                                            }}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '10px',
                                                border: '1px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                marginBottom: '0.25rem'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#f1f5f9';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'none';
                                                e.currentTarget.style.borderColor = 'transparent';
                                            }}
                                        >
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{c.nama}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>{c.id_sambungan}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                                                <MapPin size={12} /> {parseFloat(c.latitude).toFixed(6)}, {parseFloat(c.longitude).toFixed(6)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <Layers size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                        <p style={{ fontSize: '0.875rem' }}>Tidak ada pelanggan terpetakan di rute ini.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>
                {`
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    
                    /* Custom Popup Styles */
                    .leaflet-popup-content-wrapper {
                        border-radius: 12px;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                        padding: 0;
                    }
                    .leaflet-popup-content {
                        margin: 12px 16px;
                    }
                    .leaflet-popup-close-button {
                        top: 5px !important;
                        right: 5px !important;
                        padding: 8px !important;
                    }
                    .leaflet-container {
                        font-family: inherit;
                    }

                    @keyframes slideInRight {
                        from { transform: translateX(20px); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    
                    .card {
                        background: var(--surface);
                        border-radius: var(--radius);
                        box-shadow: var(--shadow);
                        border: 1px solid var(--border);
                    }
                `}
            </style>
        </div>
    );
};

export default CustomerMapping;

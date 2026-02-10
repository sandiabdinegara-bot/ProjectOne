import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, RefreshCcw, Loader2 } from 'lucide-react';

const OCRPrototype = () => {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const handleValidate = async () => {
        if (!image) {
            setError("Silakan pilih atau ambil foto terlebih dahulu.");
            return;
        }
        if (!userInput) {
            setError("Silakan masukkan angka meter secara manual.");
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', image);
        formData.append('user_input', userInput);

        try {
            const response = await fetch('http://localhost:5000/validate', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error("Gagal menghubungi server OCR. Pastikan backend Python berjalan.");

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setImage(null);
        setPreview(null);
        setUserInput('');
        setResult(null);
        setError(null);
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Validasi Foto Meter</h2>
                <p style={styles.subtitle}>Upload foto meter dan input<b>angka Kilometer(m³)</b></p>

                <div style={styles.contentGrid}>
                    {/* Input Section */}
                    <div style={styles.inputSection}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Angka Kilometer (m³)</label>
                            <input
                                type="number"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Contoh: 1832"
                                style={styles.input}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                *Hanya masukkan angka pada drum hitam. Abaikan angka merah di belakang.
                            </p>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Foto Meter</label>
                            <div
                                style={{
                                    ...styles.dropzone,
                                    borderColor: preview ? 'var(--primary)' : 'var(--border)'
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {preview ? (
                                    <img src={preview} alt="Preview" style={styles.previewImg} />
                                ) : (
                                    <div style={styles.dropzonePlaceholder}>
                                        <Upload size={32} color="var(--secondary)" />
                                        <span>Klik untuk upload atau ambil foto</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept="image/*"
                                capture="environment"
                            />
                        </div>

                        <div style={styles.buttonGroup}>
                            <button
                                onClick={handleValidate}
                                disabled={loading}
                                style={{ ...styles.btn, ...styles.btnPrimary }}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                {loading ? 'Memproses...' : 'Validasi Sekarang'}
                            </button>
                            <button onClick={reset} style={{ ...styles.btn, ...styles.btnOutline }}>
                                <RefreshCcw size={20} /> Reset
                            </button>
                        </div>

                        {error && (
                            <div style={styles.errorBox}>
                                <AlertCircle size={20} /> {error}
                            </div>
                        )}
                    </div>

                    {/* Result Section */}
                    <div style={styles.resultSection}>
                        {result ? (
                            <div style={styles.resultCard}>
                                <div style={styles.resultHeader}>
                                    <h3 style={styles.resultTitle}>Hasil Validasi</h3>
                                    <span style={{
                                        ...styles.badge,
                                        backgroundColor: result.is_match ? '#dcfce7' : '#fee2e2',
                                        color: result.is_match ? '#166534' : '#991b1b'
                                    }}>
                                        {result.is_match ? 'Sesuai' : 'Tidak Sesuai'}
                                    </span>
                                </div>

                                <div style={styles.statsGrid}>
                                    <div style={styles.statBox}>
                                        <label style={styles.statLabel}>Terdeteksi AI (Hitam)</label>
                                        <div style={styles.statValue}>{result.detected || '-'}</div>
                                    </div>
                                    <div style={styles.statBox}>
                                        <label style={styles.statLabel}>Input Petugas</label>
                                        <div style={styles.statValue}>{result.user_input}</div>
                                    </div>
                                </div>

                                <div style={styles.similaritySection}>
                                    <div style={styles.similarityHeader}>
                                        <span>Kemiripan</span>
                                        <span style={{ fontWeight: '700' }}>{result.similarity_percent}%</span>
                                    </div>
                                    <div style={styles.progressBarBg}>
                                        <div style={{
                                            ...styles.progressBarFill,
                                            width: `${result.similarity_percent}%`,
                                            backgroundColor: result.similarity_percent > 80 ? '#22c55e' :
                                                result.similarity_percent > 50 ? '#f59e0b' : '#ef4444'
                                        }} />
                                    </div>
                                </div>

                                <div style={styles.rawText}>
                                    <label style={styles.statLabel}>Teks Mentah Terdeteksi:</label>
                                    <p>{result.raw_results.join(', ') || 'Tidak ada teks terdeteksi'}</p>
                                </div>
                            </div>
                        ) : (
                            <div style={styles.emptyResult}>
                                <Camera size={48} color="var(--border)" />
                                <p>Tunggu hasil validasi muncul di sini</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: "'Inter', sans-serif"
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        padding: '2rem',
        border: '1px solid #e2e8f0'
    },
    title: {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: '0.5rem'
    },
    subtitle: {
        color: '#64748b',
        marginBottom: '2rem'
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem'
    },
    formGroup: {
        marginBottom: '1.5rem'
    },
    label: {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '600',
        marginBottom: '0.5rem',
        color: '#475569'
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '1rem'
    },
    dropzone: {
        width: '100%',
        height: '240px',
        borderRadius: '12px',
        border: '2px dashed #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.2s'
    },
    dropzonePlaceholder: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        color: '#64748b'
    },
    previewImg: {
        width: '100%',
        height: '100%',
        objectFit: 'contain'
    },
    buttonGroup: {
        display: 'flex',
        gap: '1rem',
        marginTop: '2rem'
    },
    btn: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s'
    },
    btnPrimary: {
        backgroundColor: '#0ea5e9',
        color: 'white'
    },
    btnOutline: {
        backgroundColor: 'transparent',
        border: '1px solid #e2e8f0',
        color: '#475569'
    },
    errorBox: {
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#fef2f2',
        color: '#991b1b',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem'
    },
    resultSection: {
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '400px'
    },
    emptyResult: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        color: '#94a3b8'
    },
    resultCard: {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
    },
    resultHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
    },
    resultTitle: {
        fontWeight: '700',
        fontSize: '1.125rem'
    },
    badge: {
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: '700'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1.5rem'
    },
    statBox: {
        backgroundColor: '#f8fafc',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
    },
    statLabel: {
        fontSize: '0.75rem',
        color: '#64748b',
        textTransform: 'uppercase',
        fontWeight: '700',
        display: 'block',
        marginBottom: '0.25rem'
    },
    statValue: {
        fontSize: '1.25rem',
        fontWeight: '700',
        color: '#0f172a'
    },
    similaritySection: {
        marginBottom: '1.5rem'
    },
    similarityHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.875rem',
        marginBottom: '0.5rem'
    },
    progressBarBg: {
        height: '10px',
        backgroundColor: '#e2e8f0',
        borderRadius: '999px',
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        transition: 'width 0.5s ease-out'
    },
    rawText: {
        fontSize: '0.875rem',
        color: '#64748b'
    }
};

export default OCRPrototype;

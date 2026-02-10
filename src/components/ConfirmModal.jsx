import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        right: '1.5rem',
                        top: '1.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-light)',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{
                    width: '64px',
                    height: '64px',
                    background: type === 'danger' ? '#fee2e2' : '#e0f2fe',
                    color: type === 'danger' ? '#ef4444' : 'var(--primary)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <AlertTriangle size={32} />
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>{title}</h3>
                <p style={{ color: 'var(--text-light)', marginBottom: '2rem', fontSize: '0.925rem' }}>{message}</p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'stretch' }}>
                    <button
                        className="btn btn-outline"
                        style={{ flex: 1, justifyContent: 'center', height: '42px', borderRadius: '8px', fontWeight: 600 }}
                        onClick={onClose}
                    >
                        Batal
                    </button>
                    <button
                        className="btn"
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            height: '42px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            background: type === 'danger' ? '#ef4444' : 'var(--primary)',
                            color: 'white',
                            boxShadow: type === 'danger' ? '0 4px 6px -1px rgba(239, 68, 68, 0.2)' : '0 4px 6px -1px rgba(14, 165, 233, 0.2)'
                        }}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {type === 'danger' ? 'Ya, Hapus' : 'Ya, Konfirmasi'}
                    </button>
                </div>
            </div>
        </div>
    );
}

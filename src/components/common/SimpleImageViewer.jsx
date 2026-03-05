import React, { useEffect, useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

const SimpleImageViewer = ({ isOpen, onClose, imageSrc, altText = "Preview", onSaveRotation }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
            // Reset state on open
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setRotation(0);
        }

        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
            document.body.style.userSelect = 'unset';
        };
    }, [isOpen, onClose]);

    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY * -0.01;
            setScale(s => Math.min(Math.max(0.5, s + delta), 4));
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        document.body.style.userSelect = 'none'; // Prevent selection while dragging
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        document.body.style.userSelect = 'unset';
    };

    // Add global mouse up listener to handle dragging outside component
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('mousemove', handleMouseMove);
        }
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [isDragging]);


    if (!isOpen || !imageSrc) return null;

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)', // Lighter dim as requested
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeIn 0.2s ease-out',
                overflow: 'hidden'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <img
                    ref={imageRef}
                    src={imageSrc}
                    alt={altText}
                    draggable={false}
                    onMouseDown={handleMouseDown}
                    style={{
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        objectFit: 'contain',
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px) rotate(${rotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        borderRadius: '4px',
                        // Prevent closing when clicking the image (handled by drag)
                    }}
                    onClick={(e) => e.stopPropagation()}
                />

                {/* Floating Controls */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '30px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '10px',
                        padding: '10px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '30px',
                        backdropFilter: 'blur(4px)',
                        zIndex: 10000
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} style={btnStyle} title="Zoom Out"><ZoomOut size={20} /></button>
                    <button onClick={() => setScale(1)} style={btnStyle} title="Reset">100%</button>
                    <button onClick={() => setScale(s => Math.min(4, s + 0.2))} style={btnStyle} title="Zoom In"><ZoomIn size={20} /></button>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>
                    <button onClick={() => setRotation(r => r + 90)} style={btnStyle} title="Rotate"><RotateCw size={20} /></button>
                    {onSaveRotation && rotation % 360 !== 0 && (
                        <>
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>
                            <button
                                onClick={() => onSaveRotation(rotation)}
                                style={{ ...btnStyle, background: 'var(--primary)', borderRadius: '20px', padding: '5px 15px' }}
                                title="Simpan Rotasi"
                            >
                                Simpan
                            </button>
                        </>
                    )}
                </div>

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'white',
                        border: 'none',
                        color: '#333',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 10001,
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <X size={24} />
                </button>
            </div>

            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
};

const btnStyle = {
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 600
};

export default SimpleImageViewer;

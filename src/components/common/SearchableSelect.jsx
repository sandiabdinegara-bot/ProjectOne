import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const SearchableSelect = ({
    label,
    options,
    value,
    onChange,
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari...',
    disabled = false,
    displayTop = false, // Manual override
    required = false,
    containerStyle = {},
    hideValue = false, // New prop to hide the value (code) and show only label
    icon: Icon = null // New prop for prefix icon
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [autoDirection, setAutoDirection] = useState('bottom');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useLayoutEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;

            // Dropdown max height is around 250px (search: 50px + list: 200px)
            const dropdownHeight = 300;

            if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                setAutoDirection('top');
            } else {
                setAutoDirection('bottom');
            }
        }
    }, [isOpen]);

    const finalDirection = displayTop ? 'top' : autoDirection;

    const filteredOptions = options.filter(opt => {
        const label = String(opt.label || '').toLowerCase();
        const valueStr = String(opt.value || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return label.includes(search) || valueStr.includes(search);
    });

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    return (
        <div className="searchable-select-container" style={{ position: 'relative', width: '100%', marginBottom: label ? '1rem' : '0', ...containerStyle }} ref={containerRef}>
            {label && (
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 600, color: 'var(--text-light)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label} {required && <span style={{ color: 'red' }}>*</span>}
                </label>
            )}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    background: disabled ? '#f8fafc' : 'white',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    minHeight: '42px',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                }}
            >
                {Icon && <Icon size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />}
                <span style={{
                    flex: 1,
                    minWidth: 0,
                    color: value ? 'var(--text)' : '#94a3b8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: value ? 500 : 400
                }}>
                    {selectedOption
                        ? (hideValue
                            ? (selectedOption.label || selectedOption.value)
                            : (selectedOption.label && String(selectedOption.label) !== String(selectedOption.value)
                                ? `${selectedOption.value} - ${selectedOption.label}`
                                : selectedOption.value))
                        : placeholder}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                    {value && !disabled && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange({ target: { value: '' } });
                                setIsOpen(false);
                            }}
                            style={{
                                background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#94a3b8',
                                display: 'flex', alignItems: 'center', borderRadius: '50%', transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={16} style={{ color: '#94a3b8', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    [finalDirection === 'top' ? 'bottom' : 'top']: '100%',
                    left: 0, right: 0, zIndex: 1000,
                    background: 'white', border: '1px solid var(--border)', borderRadius: '8px',
                    [finalDirection === 'top' ? 'marginBottom' : 'marginTop']: '4px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                autoFocus
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                                    borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.875rem',
                                    outline: 'none', height: '38px'
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '0.25rem' }}>
                        {filteredOptions.map(opt => (
                            <div
                                key={opt.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange({ target: { value: opt.value } });
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                                style={{
                                    padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.875rem',
                                    borderRadius: '6px',
                                    marginBottom: '2px',
                                    background: String(value) === String(opt.value) ? 'var(--background)' : 'white',
                                    color: String(value) === String(opt.value) ? 'var(--primary)' : 'var(--text)',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = String(value) === String(opt.value) ? 'var(--background)' : 'white'}
                            >
                                {hideValue ? (
                                    <div style={{ fontWeight: 600 }}>{opt.label || opt.value}</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{opt.value}</div>
                                        {opt.label && <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{opt.label}</div>}
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                                Data tidak ditemukan
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;

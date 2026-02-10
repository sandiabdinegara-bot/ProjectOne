import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format, addYears, subYears, startOfMonth } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

const MonthYearPicker = ({ value, onChange, disableCurrent = false, disablePastYears = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value || new Date());
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const handleSelectMonth = (monthIndex) => {
        const isFuture = viewDate.getFullYear() > currentYear || (viewDate.getFullYear() === currentYear && (disableCurrent ? monthIndex >= currentMonth : monthIndex > currentMonth));
        if (isFuture) return;

        const newDate = new Date(viewDate.getFullYear(), monthIndex, 1);
        onChange(newDate);
        setIsOpen(false);
    };

    return (
        <div style={{ position: 'relative' }} ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    height: '42px',
                    padding: '0 0.75rem 0 2.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: '#f8fafc',
                    fontSize: '0.875rem',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    minWidth: '180px',
                    fontWeight: 600,
                    position: 'relative'
                }}
            >
                <CalendarIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                {format(value, 'MMMM yyyy', { locale: localeID })}
                <ChevronDown size={16} style={{ marginLeft: 'auto', color: '#64748b' }} />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    zIndex: 1000,
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    width: '280px',
                    padding: '1.25rem',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <button
                            onClick={() => !disablePastYears && setViewDate(subYears(viewDate, 1))}
                            disabled={disablePastYears}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: disablePastYears ? 'not-allowed' : 'pointer',
                                color: disablePastYears ? '#e2e8f0' : '#64748b'
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{viewDate.getFullYear()}</span>
                        <button
                            onClick={() => {
                                if (viewDate.getFullYear() < currentYear) setViewDate(addYears(viewDate, 1));
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: viewDate.getFullYear() < currentYear ? 'pointer' : 'not-allowed',
                                color: viewDate.getFullYear() < currentYear ? '#64748b' : '#e2e8f0'
                            }}
                            disabled={viewDate.getFullYear() >= currentYear}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {months.map((month, index) => {
                            const isSelected = value.getMonth() === index && value.getFullYear() === viewDate.getFullYear();
                            const isFuture = viewDate.getFullYear() > currentYear || (viewDate.getFullYear() === currentYear && (disableCurrent ? index >= currentMonth : index > currentMonth));
                            const isPastYear = disablePastYears && viewDate.getFullYear() < currentYear;
                            const isDisabled = isFuture || isPastYear;

                            return (
                                <button
                                    key={month}
                                    onClick={() => !isDisabled && handleSelectMonth(index)}
                                    disabled={isDisabled}
                                    style={{
                                        padding: '10px 5px',
                                        borderRadius: '8px',
                                        border: '1px solid ' + (isSelected ? 'var(--primary)' : 'transparent'),
                                        background: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                                        color: isSelected ? 'var(--primary)' : (isDisabled ? '#cbd5e1' : '#1e293b'),
                                        fontSize: '0.8125rem',
                                        fontWeight: isSelected ? 700 : 500,
                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: isDisabled ? 0.6 : 1
                                    }}
                                    onMouseEnter={(e) => { if (!isSelected && !isDisabled) e.target.style.background = '#f1f5f9' }}
                                    onMouseLeave={(e) => { if (!isSelected && !isDisabled) e.target.style.background = 'transparent' }}
                                >
                                    {month.substring(0, 3)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default MonthYearPicker;

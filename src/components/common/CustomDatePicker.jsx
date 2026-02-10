import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    addYears,
    subYears,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isBefore,
    isAfter,
    isToday,
    startOfToday
} from 'date-fns';
import { id } from 'date-fns/locale';

const CustomDatePicker = ({
    value,
    onChange,
    minDate = startOfMonth(new Date()),
    maxDate = new Date() // Default to today to disable future dates
}) => {
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

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        const prev = subMonths(viewDate, 1);
        if (isBefore(endOfMonth(prev), minDate)) return;
        setViewDate(prev);
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        const next = addMonths(viewDate, 1);
        if (isAfter(startOfMonth(next), maxDate)) return;
        setViewDate(next);
    };

    const handlePrevYear = (e) => {
        e.stopPropagation();
        const prev = subYears(viewDate, 1);
        if (isBefore(endOfMonth(prev), minDate)) return;
        setViewDate(prev);
    };

    const handleNextYear = (e) => {
        e.stopPropagation();
        const next = addYears(viewDate, 1);
        if (isAfter(startOfMonth(next), maxDate)) return;
        setViewDate(next);
    };

    const handleSelectDay = (day) => {
        if (isBefore(day, minDate) && !isSameDay(day, minDate)) return;
        if (isAfter(day, maxDate) && !isSameDay(day, maxDate)) return;
        onChange(day);
        setIsOpen(false);
    };

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(viewDate)),
        end: endOfWeek(endOfMonth(viewDate))
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div className="custom-datepicker" style={{ position: 'relative' }} ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    height: '42px',
                    padding: '0 0.75rem 0 2.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: '#f8fafc',
                    fontSize: '0.875rem',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    minWidth: '180px',
                    fontWeight: 500,
                    position: 'relative'
                }}
            >
                <CalendarIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                {value ? format(value, 'dd MMMM yyyy', { locale: id }) : 'Pilih Tanggal'}
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
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    width: '300px',
                    padding: '1.25rem',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    {/* Header: Month & Year Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                        {/* Month Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={handlePrevMonth}
                                disabled={isBefore(endOfMonth(subMonths(viewDate, 1)), minDate)}
                                style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: isBefore(endOfMonth(subMonths(viewDate, 1)), minDate) ? '#e2e8f0' : '#64748b' }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span style={{ minWidth: '45px', textAlign: 'center', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                                {format(viewDate, 'MMM')}
                            </span>
                            <button
                                onClick={handleNextMonth}
                                disabled={isAfter(startOfMonth(addMonths(viewDate, 1)), maxDate)}
                                style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: isAfter(startOfMonth(addMonths(viewDate, 1)), maxDate) ? '#e2e8f0' : '#64748b' }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Year Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={handlePrevYear}
                                disabled={isBefore(endOfMonth(subYears(viewDate, 1)), minDate)}
                                style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: isBefore(endOfMonth(subYears(viewDate, 1)), minDate) ? '#e2e8f0' : '#64748b' }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                                {format(viewDate, 'yyyy')}
                            </span>
                            <button
                                onClick={handleNextYear}
                                disabled={isAfter(startOfMonth(addYears(viewDate, 1)), maxDate)}
                                style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: isAfter(startOfMonth(addYears(viewDate, 1)), maxDate) ? '#e2e8f0' : '#64748b' }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Week Days */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '8px' }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', padding: '4px' }}>{d}</div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                        {days.map((day, i) => {
                            const isSelected = value && isSameDay(day, value);
                            const isCurrentDay = isToday(day);
                            const isCurrentMonth = isSameMonth(day, viewDate);
                            const isPast = (isBefore(day, minDate) && !isSameDay(day, minDate));
                            const isFuture = (isAfter(day, maxDate) && !isSameDay(day, maxDate));
                            const isDisabled = isPast || isFuture;

                            return (
                                <div
                                    key={i}
                                    onClick={() => !isDisabled && handleSelectDay(day)}
                                    style={{
                                        aspectRatio: '1/1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8125rem',
                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                        color: isDisabled ? '#e2e8f0' : (isCurrentMonth ? '#1e293b' : '#cbd5e1'),
                                        position: 'relative',
                                        fontWeight: isSelected || isCurrentDay ? 700 : 400
                                    }}
                                >
                                    {isSelected && (
                                        <div style={{
                                            position: 'absolute',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            border: '1px solid #000',
                                            zIndex: 0
                                        }} />
                                    )}
                                    <span style={{ zIndex: 1 }}>{format(day, 'd')}</span>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => {
                            onChange(new Date());
                            setViewDate(new Date());
                            setIsOpen(false);
                        }}
                        style={{
                            width: '100%',
                            marginTop: '1rem',
                            padding: '0.5rem',
                            background: '#f8fafc',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--primary)',
                            cursor: 'pointer'
                        }}
                    >
                        Pilih Hari Ini
                    </button>
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

export default CustomDatePicker;

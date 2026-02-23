import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setItemsPerPage,
    setCurrentPage,
    indexOfFirstItem,
    indexOfLastItem
}) {
    if (totalItems === 0) return null;

    const getPageNumbers = () => {
        let pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="no-print" style={{ 
            marginTop: '1.5rem', 
            paddingTop: '1.5rem', 
            borderTop: '1px solid var(--border)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '1rem' 
        }}>
            <div style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                Menampilkan <span style={{ fontWeight: 600, color: 'var(--text)' }}>{indexOfFirstItem + 1}</span> sampai <span style={{ fontWeight: 600, color: 'var(--text)' }}>{Math.min(indexOfLastItem, totalItems)}</span> dari <span style={{ fontWeight: 600, color: 'var(--text)' }}>{totalItems}</span> data
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', marginBottom: 0 }}>Baris per halaman:</label>
                    <select 
                        value={itemsPerPage} 
                        onChange={(e) => setItemsPerPage(Number(e.target.value))} 
                        style={{ width: 'auto', padding: '0.25rem 0.5rem', height: 'auto', borderRadius: '4px', border: '1px solid var(--border)' }}
                    >
                        {[10, 25, 50, 100].map(val => <option key={val} value={val}>{val}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                        <ChevronsLeft size={18} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                        <ChevronLeft size={18} />
                    </button>
                    
                    {getPageNumbers().map(num => (
                        <button 
                            key={num} 
                            className={`btn ${currentPage === num ? 'btn-primary' : 'btn-outline'}`} 
                            style={{ 
                                minWidth: '36px', 
                                height: '36px', 
                                padding: 0, 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: currentPage === num ? 600 : 400
                            }} 
                            onClick={() => setCurrentPage(num)}
                        >
                            {num}
                        </button>
                    ))}
                    
                    <button className="btn btn-outline" style={{ padding: '0.4rem', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                        <ChevronRight size={18} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
                        <ChevronsRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

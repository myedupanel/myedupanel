"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api';
import styles from './StudentFeeRecords.module.scss';
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Debounce hook
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

const formatCurrency = (amount: number) => { /* ... (same as before) ... */ };

const StudentFeeRecords = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // Filters ke liye state
    const [filters, setFilters] = useState({ studentName: '', status: '' });
    const debouncedStudentName = useDebounce(filters.studentName, 500);

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            // API call mein filters ko query parameters olarak bhejein
            const params = new URLSearchParams({
                page: String(currentPage),
                limit: '10',
                studentName: debouncedStudentName,
                status: filters.status,
            });
            const res = await api.get(`/fees/student-records?${params.toString()}`);
            setRecords(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            setError('Could not fetch fee records.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedStudentName, filters.status]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Filter badalne par hamesha pehle page par jaayein
    };

    if (error) return <div className={styles.messageError}>{error}</div>;

    return (
        <div className={styles.container}>
            {/* ===== FILTER BAR ===== */}
            <div className={styles.filterBar}>
                <div className={styles.searchBar}>
                    <FiSearch />
                    <input
                        type="text"
                        name="studentName"
                        placeholder="Search by student name..."
                        value={filters.studentName}
                        onChange={handleFilterChange}
                    />
                </div>
                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className={styles.statusSelect}
                >
                    <option value="">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Late">Late</option>
                </select>
            </div>

            {loading ? <div className={styles.message}>Loading...</div> : (
                <>
                    <table className={styles.table}>
                       {/* ... table content ... */}
                    </table>
                    {/* ... pagination ... */}
                </>
            )}
        </div>
    );
};

export default StudentFeeRecords;
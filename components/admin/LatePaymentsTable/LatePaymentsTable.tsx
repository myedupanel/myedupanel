"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api';
import styles from './LatePaymentsTable.module.scss';
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiSend, FiPlusCircle, FiSearch } from 'react-icons/fi';

// Debounce hook: Yeh search ko smart banata hai
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const LatePaymentsTable = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms ke baad search trigger hoga

    const fetchLatePayments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/fees/late-payments?page=${currentPage}&limit=10&search=${debouncedSearchTerm}`);
            setRecords(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            setError('Could not fetch late payment records.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearchTerm]);

    useEffect(() => {
        fetchLatePayments();
    }, [fetchLatePayments]);

    const handleCalculateFees = async () => {
        if (!confirm('Are you sure you want to calculate late fees for all overdue payments?')) return;
        alert('Calculating... Please wait.');
        try {
            const res = await api.post('/fees/calculate-late-fees');
            alert(res.data.message);
            if (currentPage !== 1) setCurrentPage(1);
            else fetchLatePayments();
        } catch (error) {
            alert('An error occurred while calculating fees.');
        }
    };

    const handleSendReminders = async () => {
        if (!confirm('Are you sure you want to send late fee reminders?')) return;
        alert('Sending reminders...');
        try {
            const res = await api.post('/fees/send-reminders');
            alert(res.data.message);
        } catch (error) {
            alert('An error occurred while sending reminders.');
        }
    };

    if (error && !loading) return <div className={styles.messageError}>{error}</div>;

    return (
        <div className={styles.tableContainer}>
            <div className={styles.actionsHeader}>
                <div className={styles.actionButtons}>
                    <button className={styles.headerButton} onClick={handleCalculateFees}>
                        <FiPlusCircle /> Calculate Late Fee
                    </button>
                    <button className={styles.headerButton} onClick={() => fetchLatePayments()} disabled={loading}>
                        <FiRefreshCw className={loading ? styles.loadingIcon : ''} /> Refresh
                    </button>
                    <button className={styles.headerButton} onClick={handleSendReminders}>
                        <FiSend /> Send Notification
                    </button>
                </div>
                <div className={styles.searchBar}>
                    <FiSearch />
                    <input 
                        type="text" 
                        placeholder="Search by student name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className={styles.message}>Loading records...</div>
            ) : (
                <>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student Name</th>
                                <th>Class</th>
                                <th>Amount</th>
                                <th>Late Charge</th>
                                <th>Due Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length > 0 ? (
                                records.map((record, index) => (
                                    <tr key={record.id}>
                                        <td>{(currentPage - 1) * 10 + index + 1}</td>
                                        <td>{record.studentId?.name || 'N/A'}</td>
                                        <td>{record.studentId?.class || 'N/A'}</td>
                                        <td>{formatCurrency(record.amount)}</td>
                                        <td>{formatCurrency(record.lateFine)}</td>
                                        <td>{new Date(record.dueDate).toLocaleDateString('en-GB')}</td>
                                        <td>
                                            <button className={styles.actionButton}>View</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className={styles.noData}>No late payment records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1 || loading}>
                                <FiChevronLeft /> Prev
                            </button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || loading}>
                                Next <FiChevronRight />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LatePaymentsTable;
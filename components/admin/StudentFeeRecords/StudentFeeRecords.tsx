"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api';
import styles from './StudentFeeRecords.module.scss';
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link'; // Receipt link ke liye

// --- Helper Functions (Kadam 1) ---
const formatCurrency = (amount: number | null | undefined): string => {
    if (isNaN(amount as number) || amount === null || amount === undefined) return '₹ 0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};
// Debounce hook (No Change)
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}
// --- End Helper Functions ---

// --- Data Interface (Backend response ke hisaab se) ---
interface FeeRecord {
    id: number;
    amount: number;
    amountPaid: number;
    balanceDue: number;
    dueDate: string;
    status: 'Paid' | 'Partial' | 'Pending' | 'Late';
    discount: number;
    lateFine: number;
    // Populated fields
    studentId: { // Yeh object aapke feeController se aa raha hai
        name: string;
        studentId: string; // Roll number ya custom ID
        class: string;
    };
    templateId: { name: string };
}
// --- End Interface ---

const StudentFeeRecords = () => {
    const [records, setRecords] = useState<FeeRecord[]>([]);
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
                // Backend controller studentName ko support karta hai
                studentName: debouncedStudentName, 
                // Backend controller status ko support karta hai
                status: filters.status, 
            });
            // Aapke feeController mein yeh route 'getStudentFeeRecords' function ko call karta hai
            const res = await api.get(`/fees/student-records?${params.toString()}`);
            setRecords(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error("Error fetching student fee records:", err);
            setError('Could not fetch student fee records.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedStudentName, filters.status]);

    useEffect(() => {
        fetchRecords();
        // Socket.IO event listener yahan lagaya jaa sakta hai (jaise 'fee_record_updated')
    }, [fetchRecords]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Filter badalne par hamesha pehle page par jaayein
    };
    
    // Status ke liye CSS class
    const getStatusClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return styles.statusPaid;
            case 'partial':
            case 'pending': return styles.statusPending;
            case 'late': return styles.statusLate;
            default: return styles.statusDefault;
        }
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
                    <option value="Partial">Partial</option>
                    <option value="Pending">Pending</option>
                    <option value="Late">Late</option>
                </select>
            </div>

            {loading ? <div className={styles.message}>Loading Fee Records...</div> : (
                <>
                    {/* ===== TABLE CONTENT (Kadam 2) ===== */}
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Student Name (ID)</th>
                                    <th>Class</th>
                                    <th>Fee Template</th>
                                    <th>Due Date</th>
                                    <th>Total Fee</th>
                                    <th>Paid</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length > 0 ? (
                                    records.map(record => (
                                        <tr key={record.id}>
                                            <td>
                                                <Link href={`/admin/students/${record.studentId.studentId}`} className={styles.nameLink}>
                                                    {record.studentId.name} 
                                                    <span className={styles.rollNo}>({record.studentId.studentId || 'N/A'})</span>
                                                </Link>
                                            </td>
                                            <td>{record.studentId.class}</td>
                                            <td>{record.templateId.name}</td>
                                            <td>{new Date(record.dueDate).toLocaleDateString('en-GB')}</td>
                                            <td>{formatCurrency(record.amount)}</td>
                                            <td className={styles.paidAmount}>{formatCurrency(record.amountPaid)}</td>
                                            <td className={styles.balanceAmount}>{formatCurrency(record.balanceDue)}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${getStatusClass(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className={styles.actionCell}>
                                                {/* Edit/Collect Button (Fee Collection Modal kholne ke liye) */}
                                                {record.status !== 'Paid' && (
                                                    <button 
                                                        className={styles.collectButton}
                                                        onClick={() => alert(`Collecting fee for Record ID: ${record.id}`)}
                                                    >
                                                        Collect Fee
                                                    </button>
                                                )}
                                                {/* View History Button (Optional) */}
                                                <button 
                                                    className={styles.historyButton}
                                                    onClick={() => alert(`Viewing history for Record ID: ${record.id}`)}
                                                >
                                                    History
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className={styles.message}>No records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* ===== PAGINATION (Kadam 2) ===== */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                <FiChevronLeft /> Previous
                            </button>
                            <span className={styles.pageInfo}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next <FiChevronRight />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentFeeRecords;
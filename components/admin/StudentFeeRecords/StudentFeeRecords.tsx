"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api';
import styles from './StudentFeeRecords.module.scss';
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link'; 
// --- NEW IMPORT ---
import { useRouter } from 'next/navigation';
// --- END NEW IMPORT ---

// --- Helper Functions (No Change) ---
const formatCurrency = (amount: number | null | undefined): string => {
    if (isNaN(amount as number) || amount === null || amount === undefined) return '₹ 0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}
// --- End Helper Functions ---

// --- Data Interface (No Change) ---
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
    studentId: { 
        name: string;
        studentId: string; // Roll number or custom ID
        class: string;
    };
    templateId: { name: string };
}
// --- End Interface ---

const StudentFeeRecords = () => {
    const router = useRouter(); // Initialize router

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
            console.error("Error fetching student fee records:", err);
            setError('Could not fetch student fee records.');
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
        setCurrentPage(1); 
    };
    
    // Status ke liye CSS class (No Change)
    const getStatusClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return styles.statusPaid;
            case 'partial':
            case 'pending': return styles.statusPending;
            case 'late': return styles.statusLate;
            default: return styles.statusDefault;
        }
    };

    // --- NEW REDIRECT HANDLER ---
    const handleViewHistory = (studentRegId: string) => {
        // Redirect to Fee Records page and pass the student ID as a query parameter
        router.push(`/admin/fee-counter/fee-records?search=${studentRegId}`);
    };
    // --- END NEW HANDLER ---

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
                    {/* ===== TABLE CONTENT ===== */}
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
                                                {/* View History Button (UPDATED) */}
                                                <button 
                                                    className={styles.historyButton}
                                                    onClick={() => handleViewHistory(record.studentId.studentId)}
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
                    {/* ===== PAGINATION ===== */}
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
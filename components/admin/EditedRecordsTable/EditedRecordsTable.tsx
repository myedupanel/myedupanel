"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api';
import styles from './EditedRecordsTable.module.scss';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';

// --- Interface Definition (Backend getEditedRecords से मैच किया गया) ---
interface FeeRecord {
    id: number;
    amount: number; // Original total amount before discount
    discount: number; // The actual discount applied (> 0)
    amountPaid: number;
    notes: string;
    studentId: { name: string, studentId?: string }; // Populated object with name
    templateId: { name: string }; // Populated object with name
}

const formatCurrency = (amount: number | null | undefined): string => {
    if (isNaN(amount as number) || amount === null || amount === undefined) return '₹ 0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const EditedRecordsTable = () => {
    const [records, setRecords] = useState<FeeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            // Backend route 9: /fees/edited-records
            const res = await api.get(`/fees/edited-records?page=${currentPage}&limit=10`);
            
            setRecords(res.data?.data || []); 
            setTotalPages(res.data?.totalPages || 0);
        } catch (err) {
            console.error("Error fetching edited fee records:", err);
            setError('Could not fetch edited fee records.');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);
    
    // --- Pagination Handlers ---
    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };
    // --- End Pagination Handlers ---

    if (error) return <div className={styles.messageError}>{error}</div>;

    return (
        <div className={styles.container}>
             <div className={styles.tableWrapper}>
                {loading ? <div className={styles.message}>Loading edited records...</div> : (
                    <>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Student Name (ID)</th>
                                    <th>Fee Template</th>
                                    <th>Original Fee</th>
                                    <th>Discount Given</th>
                                    <th>Net Assigned</th>
                                    <th>Admin Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length > 0 ? (
                                    records.map((record, index) => {
                                        const netAssigned = record.amount - record.discount;
                                        return (
                                            <tr key={record.id}>
                                                <td>{(currentPage - 1) * 10 + index + 1}</td>
                                                <td>
                                                     {/* Assuming studentId.studentId is the unique ID/Roll No */}
                                                     <Link href={`/admin/students/${record.studentId?.studentId}`} className={styles.nameLink}>
                                                        {record.studentId?.name || 'N/A'} 
                                                    </Link>
                                                </td>
                                                <td>{record.templateId?.name || 'N/A'}</td>
                                                <td className={styles.amountCol}>{formatCurrency(record.amount)}</td>
                                                <td><span className={styles.discount}>-{formatCurrency(record.discount)}</span></td>
                                                <td className={styles.netAmount}>{formatCurrency(netAssigned)}</td>
                                                <td>{record.notes || '-'}</td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className={styles.noData}>No fee records with discounts found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* --- Pagination JSX Completed --- */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    className={styles.paginationButton}
                                >
                                    <FiChevronLeft /> Previous
                                </button>
                                <span className={styles.pageInfo}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className={styles.paginationButton}
                                >
                                    Next <FiChevronRight />
                                </button>
                            </div>
                        )}
                        {/* --- End Pagination --- */}
                    </>
                )}
            </div>
        </div>
    );
};

export default EditedRecordsTable;
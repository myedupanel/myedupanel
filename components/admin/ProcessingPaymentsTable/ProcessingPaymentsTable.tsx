"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api';
import styles from './ProcessingPaymentsTable.module.scss';
import { FiChevronLeft, FiChevronRight, FiAlertCircle } from 'react-icons/fi';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const ProcessingPaymentsTable = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/fees/processing-payments?page=${currentPage}&limit=10`);
            setRecords(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            setError('Could not fetch processing/failed payment records.');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    if (error) return <div className={styles.messageError}>{error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.infoBox}>
                <FiAlertCircle />
                <span>This section lists transactions that were unsuccessful or are still processing.</span>
            </div>

            {loading ? <div className={styles.message}>Loading...</div> : (
                <>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student Name</th>
                                <th>Template Name</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length > 0 ? (
                                records.map((record, index) => (
                                    <tr key={record.id}>
                                        <td>{(currentPage - 1) * 10 + index + 1}</td>
                                        <td>{record.studentId?.name || 'N/A'}</td>
                                        <td>{record.templateId?.name || 'N/A'}</td>
                                        <td>{formatCurrency(record.amount)}</td>
                                        <td><span className={styles.failedStatus}>{record.status}</span></td>
                                        <td>{new Date(record.createdAt).toLocaleDateString('en-GB')}</td>
                                        <td>
                                            <button className={styles.actionButton}>Check Status</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className={styles.noData}>No processing or failed payments found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            {/* Pagination buttons */}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProcessingPaymentsTable;
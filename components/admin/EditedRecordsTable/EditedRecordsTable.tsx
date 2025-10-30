"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api';
import styles from './EditedRecordsTable.module.scss';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const EditedRecordsTable = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/fees/edited-records?page=${currentPage}&limit=10`);
            setRecords(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            setError('Could not fetch edited fee records.');
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
            {loading ? <div className={styles.message}>Loading...</div> : (
                <>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student Name</th>
                                <th>Template Name</th>
                                <th>Original Amount</th>
                                <th>Discount</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length > 0 ? (
                                records.map((record, index) => (
                                    <tr key={record.id}>
                                        <td>{(currentPage - 1) * 10 + index + 1}</td>
                                        <td>{record.studentId?.name || 'N/A'}</td>
                                        <td>{record.templateId?.name || 'N/A'}</td>
                                        <td>{formatCurrency(record.amount + record.discount)}</td>
                                        <td><span className={styles.discount}>-{formatCurrency(record.discount)}</span></td>
                                        <td>{record.notes || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className={styles.noData}>No edited records with discounts found.</td>
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

export default EditedRecordsTable;
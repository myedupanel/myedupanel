"use client";
import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api';
import styles from './FailedTransactions.module.scss';

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const FailedTransactions = ({ studentId }) => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!studentId) return;
        const fetchFailedRecords = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/fees/student/${studentId}/failed`);
                setRecords(res.data);
            } catch (err) {
                setError('Could not fetch failed transactions.');
            } finally {
                setLoading(false);
            }
        };
        fetchFailedRecords();
    }, [studentId]);

    if (loading) return <p className={styles.message}>Loading failed transactions...</p>;
    if (error) return <p className={styles.messageError}>{error}</p>;

    return (
        <div className={styles.container}>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Order Id</th>
                            <th>Date</th>
                            <th>Fee Name</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length > 0 ? (
                            records.map(record => (
                                <tr key={record._id}>
                                    <td>...{record._id.slice(-6).toUpperCase()}</td>
                                    <td>{new Date(record.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td>{record.templateId?.name || 'N/A'}</td>
                                    <td>{formatCurrency(record.amount)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className={styles.noData}>No failed transactions found for this student.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FailedTransactions;
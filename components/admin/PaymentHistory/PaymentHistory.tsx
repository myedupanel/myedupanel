"use client";
import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api';
import styles from './PaymentHistory.module.scss';

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Status ke liye alag-alag color dikhane waala chota component
const StatusBadge = ({ status }) => {
    return <span className={`${styles.status} ${styles[status?.toLowerCase()]}`}>{status}</span>;
};

const PaymentHistory = ({ studentId }) => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!studentId) return;
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/fees/student/${studentId}/history`);
                setRecords(res.data);
            } catch (err) {
                setError('Could not fetch payment history.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [studentId]);

    if (loading) return <p className={styles.message}>Loading history...</p>;
    if (error) return <p className={styles.messageError}>{error}</p>;

    return (
        <div className={styles.container}>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Order Id</th>
                            <th>Txn Date</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length > 0 ? (
                            records.map(record => (
                                <tr key={record._id}>
                                    <td>{record.templateId?.name || 'N/A'}</td>
                                    <td><StatusBadge status={record.status} /></td>
                                    <td>...{record._id.slice(-6).toUpperCase()}</td>
                                    <td>{new Date(record.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td>{formatCurrency(record.amount)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className={styles.noData}>No payment history found for this student.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentHistory;
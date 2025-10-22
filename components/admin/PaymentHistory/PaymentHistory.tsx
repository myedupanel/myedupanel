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

// ✨ FIX 1: Define an interface for the StatusBadge's props
interface StatusProps {
    status: string;
}

// ✨ FIX 1 (Applied): Use the StatusProps interface here
// Status ke liye alag-alag color dikhane waala chota component
const StatusBadge = ({ status }: StatusProps) => {
    return <span className={`${styles.status} ${styles[status?.toLowerCase()]}`}>{status}</span>;
};

// ✨ FIX 2: Define an interface for a single history record
interface HistoryRecord {
    _id: string;
    templateId?: { // Optional, since you use 'N/A'
        name: string;
    };
    status: string;
    createdAt: string; // Or Date
    amount: number;
}

// ✨ FIX 3: Define an interface for the PaymentHistory component's props
interface HistoryProps {
    studentId: string; // Assuming it's a string
}

// ✨ FIX 3 (Applied): Use the HistoryProps interface here
const PaymentHistory = ({ studentId }: HistoryProps) => {
    // ✨ FIX 2 (Applied): Use the HistoryRecord interface for state
    const [records, setRecords] = useState<HistoryRecord[]>([]);
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
                            // 'record' is now correctly typed as HistoryRecord
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
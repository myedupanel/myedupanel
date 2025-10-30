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

// ✨ FIX 1: Define an interface for the component's props
interface Props {
    studentId: string; // Assuming studentId is a string. Change if it's a number.
}

// ✨ FIX 2: Define an interface for a single record object
// Based on how you use it in the <tbody>
interface FailedRecord {
    id: string;
    createdAt: string; // Or Date, if you parse it as a Date object
    templateId?: { // Using '?' makes it optional, since you check for it
        name: string;
    };
    amount: number;
}

// ✨ FIX 1 (Applied): Use the Props interface here
const FailedTransactions = ({ studentId }: Props) => {
    // ✨ FIX 2 (Applied): Use the FailedRecord interface with useState
    const [records, setRecords] = useState<FailedRecord[]>([]);
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
                            // 'record' is now correctly typed as FailedRecord
                            records.map(record => (
                                <tr key={record.id}>
                                    <td>...{record.id.slice(-6).toUpperCase()}</td>
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
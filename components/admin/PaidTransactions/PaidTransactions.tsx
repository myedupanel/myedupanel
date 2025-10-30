"use client";
import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api';
import styles from './PaidTransactions.module.scss';
import { FiDownload } from 'react-icons/fi';

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// ✨ FIX 1: Define an interface for a single transaction record
// Based on its usage in the table
interface TransactionRecord {
    id: string;
    createdAt: string; // Or Date
    paymentMode?: string; // Optional, as you use 'N/A'
    amount: number;
}

// ✨ FIX 2: Define an interface for the TransactionTable's props
interface TableProps {
    title: string;
    records: TransactionRecord[]; // Use the interface from Fix 1
}

// ✨ FIX 2 (Applied): Use the TableProps interface here
const TransactionTable = ({ title, records }: TableProps) => (
    <div className={styles.tableSection}>
        <h4 className={styles.tableTitle}>{title}</h4>
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Order Id</th>
                        <th>Payment Date</th>
                        <th>Payment Type</th>
                        <th>Receipt</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {records.length > 0 ? (
                        // 'record' is now correctly typed as TransactionRecord
                        records.map(record => (
                            <tr key={record.id}>
                                <td>...{record.id.slice(-6).toUpperCase()}</td>
                                <td>{new Date(record.createdAt).toLocaleDateString('en-GB')}</td>
                                <td>{record.paymentMode || 'N/A'}</td>
                                <td><button className={styles.receiptButton}><FiDownload /> View</button></td>
                                <td>{formatCurrency(record.amount)}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className={styles.noData}>No records found in this category.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// ✨ FIX 3: Define an interface for the PaidTransactions component's props
interface PaidTransactionsProps {
    studentId: string; // Assuming it's a string
}

// ✨ FIX 3 (Applied): Use the PaidTransactionsProps interface here
const PaidTransactions = ({ studentId }: PaidTransactionsProps) => {
    // ✨ FIX 4: Use the TransactionRecord interface in your state
    const [data, setData] = useState<{ deposits: TransactionRecord[], paidRecords: TransactionRecord[] }>({ deposits: [], paidRecords: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!studentId) return;
        const fetchPaidRecords = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/fees/student/${studentId}/paid`);
                setData(res.data);
            } catch (err) {
                setError('Could not fetch paid transactions.');
            } finally {
                setLoading(false);
            }
        };
        fetchPaidRecords();
    }, [studentId]);

    if (loading) return <p className={styles.message}>Loading transactions...</p>;
    if (error) return <p className={styles.messageError}>{error}</p>;

    return (
        <div className={styles.container}>
            <TransactionTable title="Deposits" records={data.deposits} />
            <TransactionTable title="Paid Records" records={data.paidRecords} />
        </div>
    );
};

export default PaidTransactions;
// src/components/admin/PdcRecordsTable/PdcRecordsTable.tsx

"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api';
import styles from './PdcRecordsTable.module.scss';
import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle } from 'react-icons/fi';

// --- Interface Definition (Backend /fees/pdc-records se matching) ---
interface PdcRecord {
    id: number;
    receiptId: string;
    studentId: { name: string; class: string }; // Populated Student Info
    chequeNumber: string;
    bankName: string;
    amountPaid: number;
    paymentDate: string; // Cheque Date (Date jab payment karna tha)
}
// ---

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const PdcRecordsTable = () => {
    const [records, setRecords] = useState<PdcRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/fees/pdc-records?page=${currentPage}&limit=10`);
            // Backend se aane wala data `PdcRecord[]` interface se match hona chahiye
            setRecords(res.data?.data || []); 
            setTotalPages(res.data?.totalPages || 0);
        } catch (err) {
            console.error("Error fetching PDC records:", err);
            setError('Could not fetch PDC records.');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    // Initial Fetch & Update Listener
    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    // --- PDC Action Handlers ---

    // 1. Cleared (Cheque successfully bank mein jama ho gaya)
    const handleClearCheque = async (transactionId: number) => {
        if (!window.confirm("Confirm: Cheque Cleared? This will mark the transaction as 'Success' and update the Fee Record.")) return;
        
        try {
            // TODO: Backend route implement karna hoga (e.g., PUT /fees/pdc/clear/:id)
            await api.put(`/fees/pdc/clear/${transactionId}`); 
            alert(`Transaction ${transactionId} cleared successfully!`);
            fetchRecords(); // List refresh karein
        } catch (err: any) {
            console.error("Error clearing cheque:", err);
            alert(`Failed to clear cheque: ${err.response?.data?.message || 'Server error.'}`);
        }
    };

    // 2. Bounced (Cheque bank se return ho gaya)
    const handleBounceCheque = async (transactionId: number) => {
        if (!window.confirm("Confirm: Cheque Bounced? This will mark the transaction as 'Failed' and set Fee Record status back to 'Pending'.")) return;
        
        try {
            // TODO: Backend route implement karna hoga (e.g., PUT /fees/pdc/bounce/:id)
            await api.put(`/fees/pdc/bounce/${transactionId}`);
            alert(`Transaction ${transactionId} marked as Bounced. Fee record updated.`);
            fetchRecords(); // List refresh karein
        } catch (err: any) {
            console.error("Error bouncing cheque:", err);
            alert(`Failed to bounce cheque: ${err.response?.data?.message || 'Server error.'}`);
        }
    };
    
    // --- End PDC Action Handlers ---


    if (error) return <div className={styles.messageError}>{error}</div>;

    return (
        <div className={styles.container}>
            {loading ? <div className={styles.message}>Loading PDC records...</div> : (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Student Name</th>
                                    <th>Cheque Date</th>
                                    <th>Cheque No.</th>
                                    <th>Bank Name</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length > 0 ? (
                                    records.map((record, index) => (
                                        // record.id transaction ID hai
                                        <tr key={record.id}>
                                            <td>{(currentPage - 1) * 10 + index + 1}</td>
                                            <td>{record.studentId?.name || 'N/A'}</td>
                                            <td>
                                                <span className={styles.date}>
                                                    {new Date(record.paymentDate).toLocaleDateString('en-GB')}
                                                </span>
                                            </td>
                                            <td>{record.chequeNumber || '-'}</td>
                                            <td>{record.bankName || '-'}</td>
                                            <td className={styles.amountCol}>{formatCurrency(record.amountPaid)}</td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button 
                                                        className={`${styles.actionButton} ${styles.cleared}`}
                                                        onClick={() => handleClearCheque(record.id)}
                                                    >
                                                        <FiCheckCircle /> Cleared
                                                    </button>
                                                    <button 
                                                        className={`${styles.actionButton} ${styles.bounced}`}
                                                        onClick={() => handleBounceCheque(record.id)}
                                                    >
                                                        <FiXCircle /> Bounced
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className={styles.noData}>No pending PDC records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* --- Pagination --- */}
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

export default PdcRecordsTable;
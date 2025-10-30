    "use client";
    import React, { useState, useEffect, useCallback } from 'react';
    import api from '@/backend/utils/api';
    import styles from './PdcRecordsTable.module.scss';
    import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle } from 'react-icons/fi';

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const PdcRecordsTable = () => {
        const [records, setRecords] = useState<any[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');
        const [currentPage, setCurrentPage] = useState(1);
        const [totalPages, setTotalPages] = useState(0);

        const fetchRecords = useCallback(async () => {
            try {
                setLoading(true);
                const res = await api.get(`/fees/pdc-records?page=${currentPage}&limit=10`);
                setRecords(res.data.data);
                setTotalPages(res.data.totalPages);
            } catch (err) {
                setError('Could not fetch PDC records.');
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
                {loading ? <div className={styles.message}>Loading PDC records...</div> : (
                    <>
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
                                        <tr key={record.id}>
                                            <td>{(currentPage - 1) * 10 + index + 1}</td>
                                            <td>{record.studentId?.name || 'N/A'}</td>
                                            <td>
                                                <span className={styles.date}>
                                                    {new Date(record.chequeDate).toLocaleDateString('en-GB')}
                                                </span>
                                            </td>
                                            <td>{record.chequeNumber || '-'}</td>
                                            <td>{record.bankName || '-'}</td>
                                            <td>{formatCurrency(record.amount)}</td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button className={`${styles.actionButton} ${styles.cleared}`}>
                                                        <FiCheckCircle /> Cleared
                                                    </button>
                                                    <button className={`${styles.actionButton} ${styles.bounced}`}>
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

    export default PdcRecordsTable;
    

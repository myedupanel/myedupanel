"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api';
import styles from './PaymentHistory.module.scss';
import Modal from '@/components/common/Modal/Modal';
import FeeReceipt from '@/components/admin/fees/FeeReceipt'; // Ensure path is correct
import { FiSearch, FiCalendar, FiFilter, FiPrinter, FiChevronLeft, FiChevronRight, FiXCircle } from 'react-icons/fi'; // Added FiXCircle

// --- Step 1: REMOVE LOCAL INTERFACE DEFINITIONS ---
// DELETE the old Transaction and ReceiptData interfaces that were here.

// --- Step 2: ADD IMPORT FOR CENTRALIZED TYPES ---
import { Transaction, ReceiptData } from '@/components/types/fees'; // Adjust path if needed ('@/types/fees' or maybe '../types/fees'?)

// --- Helper Functions ---
const formatCurrency = (amount: number): string => {
    if (isNaN(amount) || amount === null || amount === undefined) return '₹ 0.00'; // Show paise
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};
const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-GB', options).replace(/ /g, '-');
    } catch (e) { return 'Invalid Date'; }
};
interface StatusProps { status: string; }
const StatusBadge = ({ status }: StatusProps) => {
    // Use status directly, assuming it's 'Success', 'Pending', or 'Failed'
    const statusClass = status ? status.toLowerCase() : 'unknown';
    return <span className={`${styles.status} ${styles[statusClass]}`}>{status || 'N/A'}</span>;
};
// ---

// Props for PaymentHistory (assuming it might receive studentId if used within FeeCollection)
interface PaymentHistoryProps {
    studentId?: string | null; // Optional: Pass studentId if this component shows history for a specific student
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ studentId }) => {
    // States now use the imported Transaction and ReceiptData types
    const [records, setRecords] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedMode, setSelectedMode] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0); // Added state for total records
    const [limit, setLimit] = useState(15);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptDataForModal, setReceiptDataForModal] = useState<ReceiptData | null>(null);
    const [loadingReceipt, setLoadingReceipt] = useState(false);
    const [receiptError, setReceiptError] = useState<string | null>(null); // State for receipt fetch error

    const fetchHistory = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            // Add studentId to params if provided
            if (studentId) params.append('studentId', studentId);
            // Add other filters
            if (searchTerm) params.append('search', searchTerm);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (selectedStatus) params.append('status', selectedStatus);
            if (selectedMode) params.append('paymentMode', selectedMode);

            // Use the correct, consistent endpoint for fetching transactions
            const res = await api.get(`/api/fees/transactions?${params.toString()}`);

            setRecords(Array.isArray(res.data.data) ? res.data.data : []);
            setTotalPages(res.data.totalPages || 1);
            setCurrentPage(res.data.currentPage || 1);
            setTotalRecords(res.data.totalRecords || 0); // Store total records

        } catch (err: any) {
            console.error("Error fetching payment history:", err);
            setError(`Could not fetch payment history. ${err.response?.data?.message || err.message}`);
            setRecords([]); // Clear records on error
        } finally {
            setLoading(false);
        }
    }, [studentId, searchTerm, startDate, endDate, selectedStatus, selectedMode, limit]); // Added studentId dependency

    // Fetch on initial load or when filters/page change
    useEffect(() => {
        fetchHistory(currentPage);
    }, [fetchHistory, currentPage]);

    const handleApplyFilters = () => {
        // Applying filters should reset to page 1
        if (currentPage !== 1) {
            setCurrentPage(1); // This will trigger useEffect
        } else {
            fetchHistory(1); // Fetch directly if already on page 1
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setSelectedStatus('');
        setSelectedMode('');
        // Clearing filters should also reset to page 1
        if (currentPage !== 1) {
            setCurrentPage(1); // This will trigger useEffect
        } else {
             // Fetch directly only if there were active filters before clearing
             if (searchTerm || startDate || endDate || selectedStatus || selectedMode) {
                  fetchHistory(1);
             }
        }
    };

    const handleViewReceipt = async (transactionId: string) => {
        setLoadingReceipt(true);
        setReceiptDataForModal(null);
        setReceiptError(null); // Clear previous receipt error
        setIsReceiptModalOpen(true);
        try {
             // Endpoint to get fully populated transaction details
            const res = await api.get(`/api/fees/transaction/${transactionId}`);
            // The data received (res.data) should conform to the ReceiptData interface from types/fees
            setReceiptDataForModal(res.data);
        } catch (err: any) {
            console.error("Error fetching receipt details:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Could not load receipt.';
            setReceiptError(`Error: ${errorMessage}`); // Set error state for modal
            // Optionally show an alert too
            // alert(`Error loading receipt: ${errorMessage}`);
        } finally {
            setLoadingReceipt(false);
        }
    };

    return (
        <div className={styles.container}>

            {/* Filter Section */}
            <div className={styles.filterBar}>
                {/* Search Input */}
                <div className={styles.filterGroup}>
                    <FiSearch />
                    <input
                        type="text"
                        placeholder={studentId ? "Search Receipt ID..." : "Student Name or Receipt ID..."} // Adjust placeholder
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                    />
                </div>
                {/* Date Range */}
                <div className={`${styles.filterGroup} ${styles.dateRange}`}>
                    <FiCalendar />
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} title="Start Date" />
                    <span>to</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} title="End Date" />
                </div>
                {/* Status Select */}
                <div className={styles.filterGroup}>
                    <FiFilter />
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="">All Statuses</option>
                        <option value="Success">Success</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                    </select>
                </div>
                {/* Mode Select */}
                <div className={styles.filterGroup}>
                    <FiFilter />
                    <select value={selectedMode} onChange={(e) => setSelectedMode(e.target.value)}>
                        <option value="">All Modes</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="NetBanking">Net Banking</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Draft">Draft</option>
                        <option value="Wallet">Wallet</option>
                        <option value="Other">Other</option>
                        {/* Add more modes if needed */}
                    </select>
                </div>
                {/* Action Buttons */}
                <button onClick={handleApplyFilters} className={styles.filterButton} disabled={loading}> Apply </button>
                <button onClick={handleClearFilters} className={`${styles.filterButton} ${styles.clearButton}`} disabled={loading} title="Clear Filters"> <FiXCircle /> </button>
            </div>

             {/* Loading/Error Messages */}
            {loading && <p className={styles.message}>Loading history...</p>}
            {error && !loading && <p className={styles.messageError}>{error}</p>} {/* Show general fetch error */}

            {/* Table and Pagination */}
            {!loading && !error && (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Receipt ID</th>
                                    {!studentId && <th>Student Name</th>} {/* Show Student Name only if not filtering by student */}
                                    <th>Fee Name</th>
                                    <th>Date</th>
                                    <th>Amount Paid</th>
                                    <th>Mode</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length > 0 ? (
                                    records.map(record => (
                                        <tr key={record.id}>
                                            <td>{record.receiptId || `...${record.id.slice(-6).toUpperCase()}`}</td>
                                            {!studentId && <td>{record.studentId?.name || record.studentName || 'N/A'}</td>} {/* Use populated name */}
                                            <td>{record.templateId?.name || record.templateName || 'N/A'}</td> {/* Use populated name */}
                                            <td>{formatDate(record.paymentDate)}</td>
                                            <td className={styles.amount}>{formatCurrency(record.amountPaid)}</td>
                                            <td>{record.paymentMode}</td>
                                            <td><StatusBadge status={record.status} /></td>
                                            <td>
                                                <button onClick={() => handleViewReceipt(record.id)} className={styles.actionButton} title="View/Print Receipt" disabled={loadingReceipt}>
                                                    <FiPrinter />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={studentId ? 7 : 8} className={styles.noData}>No payment history found matching filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <span className={styles.totalRecords}>Total: {totalRecords} records</span>
                            <div className={styles.pageControls}>
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading}><FiChevronLeft /> Prev</button>
                                <span>Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading}>Next <FiChevronRight /></button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal for Receipt */}
            <Modal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                title={`Fee Receipt - ${receiptDataForModal?.receiptId || ''}`}
            >
                {loadingReceipt ? ( <p className={styles.modalMessage}>Loading receipt...</p> )
                 : receiptError ? ( <p className={styles.modalError}>{receiptError}</p> ) // Show receipt fetch error here
                 : receiptDataForModal ? (
                     <FeeReceipt
                        // This should now work as both use the same Transaction type from types/fees
                        transaction={receiptDataForModal}
                    />
                 )
                 : ( <p className={styles.modalMessage}>Could not load receipt data.</p> )
                }
            </Modal>

        </div>
    );
};

export default PaymentHistory;
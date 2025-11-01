"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './FeeRecordsPage.module.scss';
import { FiSearch, FiPrinter, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';
// --- API Import ---
import api from '@/backend/utils/api'; 
// --- Modal and Receipt Component Imports ---
import Modal from '@/components/common/Modal/Modal'; // Assuming a generic Modal component exists

// WARNING: Check this path! If FeeReceipt is directly in the parent folder, the path might be wrong.
import FeeReceipt from '@/components/admin/fees/FeeReceipt'; 
// --- End Imports ---

// --- Helper Hook: Debounce ---
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};
// --- End Helper Hook ---


// --- Interface Definitions ---
interface Transaction {
  id: number;
  receiptId: string;
  studentName: string;
  className: string;
  amountPaid: number;
  paymentMode: string;
  paymentDate: string;
  status: 'Success' | 'Pending' | 'Failed';
}

// Interface for the detailed data required by FeeReceipt component
interface DetailedTransaction extends Transaction {
    notes?: string; 
    currentBalanceDue?: number;
    feeRecordStatus?: string;
}

const FeeRecordsPage: React.FC = () => {
  // --- States for Data and Pagination ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // --- States for Filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // Debounce applied
  const [filterMode, setFilterMode] = useState<'All' | string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | Transaction['status']>('All'); 

  // --- States for Modal ---
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [detailedReceiptData, setDetailedReceiptData] = useState<DetailedTransaction | null>(null);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);
  // --- End Modal States ---


  // --- API Fetch Function ---
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    
    // Query parameters तैयार करें
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', '15'); 
    
    // Use Debounced search query
    if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
    if (filterMode !== 'All') params.append('paymentMode', filterMode);
    if (filterStatus !== 'All') params.append('status', filterStatus); 

    try {
      const res = await api.get(`/fees/transactions?${params.toString()}`);
      
      setTransactions(res.data.data); 
      setTotalPages(res.data.totalPages);
      
    } catch (err) {
      console.error("Failed to fetch transactions", err);
      setTransactions([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, filterMode, filterStatus]);
  
  // --- Run Fetch Effect ---
  useEffect(() => {
    // Fetch when pagination, filters, or DEBOUNCED search query changes
    fetchTransactions();
  }, [fetchTransactions]);
  
  
  // --- Fetch Detailed Receipt Data ---
  const fetchReceiptDetails = useCallback(async (transactionId: number) => {
      setIsReceiptLoading(true);
      setDetailedReceiptData(null);
      try {
          // This endpoint uses getTransactionById from your controller
          const res = await api.get(`/fees/transaction/${transactionId}`);
          setDetailedReceiptData(res.data);
          setIsReceiptModalOpen(true); // Open modal only on success
      } catch (error) {
          console.error("Error fetching receipt details:", error);
          alert("Failed to load receipt details.");
      } finally {
          setIsReceiptLoading(false);
      }
  }, []);

  // --- Handle View Receipt (Button Click) ---
  const handleViewReceipt = (transactionId: number) => {
    setSelectedTransactionId(transactionId);
    fetchReceiptDetails(transactionId);
  };
  
  // --- Close Modal Handler ---
  const handleCloseReceiptModal = () => {
      setIsReceiptModalOpen(false);
      setSelectedTransactionId(null);
      setDetailedReceiptData(null);
  }

  // --- Helpers and Pagination (No change) ---
  const displayedTransactions = useMemo(() => transactions, [transactions]);
  
  const getStatusDisplay = (status: Transaction['status']) => {
    switch (status) {
      case 'Success': return { label: 'Paid', className: styles.paid };
      case 'Pending': return { label: 'Partial', className: styles.partial }; 
      case 'Failed': return { label: 'Void', className: styles.void };
      default: return { label: status, className: styles.void };
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };


  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fee Records & Transaction History 💰</h1>
        <div className={styles.actions}>
          <button className={styles.exportButton} onClick={() => alert('Exporting data via backend API route 16...')}>
            <FiDownload /> Export Data
          </button>
        </div>
      </header>

      <div className={styles.controls}>
        {/* Search Bar */}
        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} />
          <input 
            type="text"
            placeholder="Search by Student Name or Receipt ID..."
            value={searchQuery}
            // Update local state immediately
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters (No Change) */}
        <div className={styles.filters}>
          <select 
            value={filterMode} 
            onChange={(e) => {setFilterMode(e.target.value); setCurrentPage(1);}}
          >
            <option value="All">All Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Online">Online</option>
            <option value="Cheque">Cheque</option>
            <option value="Card">Card</option>
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => {setFilterStatus(e.target.value as 'All' | Transaction['status']); setCurrentPage(1);}}
          >
            <option value="All">All Statuses</option>
            <option value="Success">Paid</option>
            <option value="Pending">Partial / Pending</option>
            <option value="Failed">Failed / Void</option>
          </select>
        </div>
      </div>

      {/* --- Transaction Table --- */}
      <div className={styles.tableContainer}>
        <table className={styles.transactionsTable}>
          <thead>
            <tr>
              <th>Receipt ID</th>
              <th>Student Name</th>
              <th>Class</th>
              <th>Amount Paid</th>
              <th>Payment Mode</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
                <tr><td colSpan={8} className={styles.noData}>Loading transactions...</td></tr>
            ) : displayedTransactions.length > 0 ? (
              displayedTransactions.map(t => {
                const statusDisplay = getStatusDisplay(t.status);
                return (
                  <tr key={t.id} className={styles.transactionRow}>
                    <td className={styles.receiptIdCol}>
                      {/* Link to open the modal via ID */}
                      <a href="#" onClick={(e) => {e.preventDefault(); handleViewReceipt(t.id); }}>
                          {t.receiptId}
                      </a>
                    </td>
                    <td>{t.studentName}</td>
                    <td>{t.className}</td>
                    <td className={styles.amountCol}>₹{t.amountPaid.toLocaleString('en-IN')}</td>
                    <td>{t.paymentMode}</td>
                    <td>{t.paymentDate}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusDisplay.className}`}>
                        {statusDisplay.label}
                      </span>
                    </td>
                    <td className={styles.actionCol}>
                      <button 
                        className={styles.viewButton}
                        onClick={() => handleViewReceipt(t.id)}
                        disabled={isReceiptLoading && selectedTransactionId === t.id}
                      >
                        {isReceiptLoading && selectedTransactionId === t.id ? 'Loading...' : (<><FiPrinter /> View Receipt</>)}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className={styles.noData}>No fee records found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* --- Pagination Controls --- */}
      {!isLoading && totalPages > 1 && (
        <div className={styles.paginationControls}>
          <button 
            onClick={handlePreviousPage} 
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            <FiChevronLeft /> Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
      
      {/* --- MODAL FOR RECEIPT (The main goal) --- */}
      <Modal 
        isOpen={isReceiptModalOpen} 
        onClose={handleCloseReceiptModal} 
        title={`Receipt: ${detailedReceiptData?.receiptId || 'Loading...'}`}
        // size="lg" Removed this prop
      >
        {isReceiptLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading receipt data...</div>
        ) : detailedReceiptData ? (
            // FeeReceipt component will have the Download/Print buttons inside
            <FeeReceipt transaction={detailedReceiptData} />
        ) : (
             <div style={{ padding: '2rem', textAlign: 'center' }}>Receipt data could not be loaded.</div>
        )}
      </Modal>

    </div>
  );
};

export default FeeRecordsPage;
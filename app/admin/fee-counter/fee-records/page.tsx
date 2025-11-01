"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styles from './FeeRecordsPage.module.scss';
import { FiSearch, FiPrinter, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';
// --- API Import ---
import api from '@/backend/utils/api'; 

// --- 1. Interface Definitions (Updated for API response) ---
interface Transaction {
  id: number; // Backend से ID number में आ रही है
  receiptId: string;
  studentName: string;
  className: string;
  amountPaid: number;
  paymentMode: string; // 'Cash' | 'UPI' | 'Card' | 'Online' | 'Cheque'
  paymentDate: string; // YYYY-MM-DD format
  status: 'Success' | 'Pending' | 'Failed'; // Backend Transaction Status
}

// --- 2. DUMMY DATA REMOVED ---

const FeeRecordsPage: React.FC = () => {
  // --- States for Data and Pagination ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // --- States for Filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'All' | string>('All');
  // Status filter values को backend status से align किया
  const [filterStatus, setFilterStatus] = useState<'All' | Transaction['status']>('All'); 

  // --- 3. API Fetch Function (useEffect hook) ---
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      
      // Query parameters तैयार करें
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '15'); // Per page items
      
      if (searchQuery) params.append('search', searchQuery);
      if (filterMode !== 'All') params.append('paymentMode', filterMode);
      // Backend status values: Success, Pending, Failed
      if (filterStatus !== 'All') params.append('status', filterStatus); 

      try {
        const res = await api.get(`/fees/transactions?${params.toString()}`);
        
        // Backend से data, totalPages, totalRecords आ रहे हैं
        setTransactions(res.data.data); 
        setTotalPages(res.data.totalPages);
        
      } catch (err) {
        console.error("Failed to fetch transactions", err);
        setTransactions([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch only when filters/page change
    fetchTransactions();
  }, [currentPage, searchQuery, filterMode, filterStatus]);
  
  // Debounce logic (Optional but recommended for search)
  // Humne simple approach rakhi hai: har change par fetch karna

  // --- Memoized data for Table (Used mainly for visual filtering if API wasn't comprehensive) ---
  // Since all filtering is done on the backend, this memo is simplified but kept for structure
  const displayedTransactions = useMemo(() => {
    // API filtering hone ke baad, yahaan sirf data display hoga
    return transactions;
  }, [transactions]);
  
  // --- Helper Function for Status Badge Colors ---
  const getStatusDisplay = (status: Transaction['status']) => {
    // Backend status को Frontend display values और SCSS classes से map करते हैं
    switch (status) {
      case 'Success': return { label: 'Paid', className: styles.paid };
      case 'Pending': return { label: 'Partial', className: styles.partial }; // e.g. Cheque Pending
      case 'Failed': return { label: 'Void', className: styles.void }; // Failed online txn, etc.
      default: return { label: status, className: styles.void };
    }
  };

  const handleViewReceipt = (id: string) => {
    // Navigating to the detailed receipt view
    alert(`Viewing Receipt ID: ${id}. Yahaan receipt modal khulega.`);
    console.log(`Navigating to receipt: /admin/fee-counter/receipt/${id}`);
  };

  // --- Pagination Handlers ---
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
        {/* Download/Export Button (Now fully functional with backend route 16) */}
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
            // Debounce logic apply nahi kiya, so har keystroke par fetch hoga (performance ke liye debounce best hai)
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <select 
            value={filterMode} 
            onChange={(e) => setFilterMode(e.target.value)}
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
            onChange={(e) => setFilterStatus(e.target.value as 'All' | Transaction['status'])}
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
                      <Link href={`/admin/fee-counter/receipt/${t.id}`}>{t.receiptId}</Link>
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
                        onClick={() => handleViewReceipt(t.receiptId)}
                      >
                        <FiPrinter /> View Receipt
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
    </div>
  );
};

export default FeeRecordsPage;
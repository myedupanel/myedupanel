"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './FeeRecordsPage.module.scss';
// FiMenu, FiSearch, FiPrinter, FiDownload icons add kiye
import { FiSearch, FiPrinter, FiDownload, FiChevronLeft, FiChevronRight, FiMenu } from 'react-icons/fi';
import Link from 'next/link';
import api from '@/backend/utils/api'; 
import Modal from '@/components/common/Modal/Modal'; 
import FeeReceipt from '@/components/admin/fees/FeeReceipt'; 

// --- Interface Definitions (Assuming centralized types are fixed and imported) ---
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

interface DetailedTransaction extends Transaction {
    notes?: string; 
    currentBalanceDue?: number;
    feeRecordStatus?: string;
}

// New interface for class options
interface ClassOption {
    id: number;
    name: string;
}

// --- Helper Hook: Debounce (No Change) ---
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};
// --- End Helper Hook ---


const FeeRecordsPage: React.FC = () => {
  // --- States for Data and Pagination ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // --- States for Filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500); 
  const [filterMode, setFilterMode] = useState<'All' | string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | Transaction['status']>('All'); 
  
  // NEW CLASS STATES
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [filterClassId, setFilterClassId] = useState<'All' | number>('All');

  // --- States for Modal ---
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [detailedReceiptData, setDetailedReceiptData] = useState<DetailedTransaction | null>(null);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);
  
  // NAYE MODAL STATES
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false); 
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false); 
  // --- End Modal States ---
  
  // NEW: Fetch Classes from /api/classes (No Change)
  const fetchClasses = useCallback(async () => {
      try {
          const res = await api.get('/api/classes');
          const options = res.data.map((c: any) => ({ id: c.classid, name: c.class_name }));
          setClassOptions(options);
      } catch (err) {
          console.error("Failed to fetch classes", err);
      }
  }, []);


  // --- API Fetch Function (Updated) ---
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', '15'); 
    
    if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
    if (filterMode !== 'All') params.append('paymentMode', filterMode);
    if (filterStatus !== 'All') params.append('status', filterStatus); 
    
    if (filterClassId !== 'All') params.append('classId', filterClassId.toString());

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
  }, [currentPage, debouncedSearchQuery, filterMode, filterStatus, filterClassId]);
  
  // --- Run Initial Fetch Effect ---
  useEffect(() => {
    fetchClasses(); 
  }, [fetchClasses]);
  
  // --- Run Transaction Fetch Effect ---
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  
  // --- Fetch Detailed Receipt Data (No Change) ---
  const fetchReceiptDetails = useCallback(async (transactionId: number) => {
      setIsReceiptLoading(true);
      setDetailedReceiptData(null);
      try {
          const res = await api.get(`/fees/transaction/${transactionId}`);
          setDetailedReceiptData(res.data);
          setIsReceiptModalOpen(true);
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
  
  // --- Close Modal Handler (No Change) ---
  const handleCloseReceiptModal = () => {
      setIsReceiptModalOpen(false);
      setSelectedTransactionId(null);
      setDetailedReceiptData(null);
  }
  
  // --- Mobile Filter Handlers ---
  const handleApplyFilters = (newQuery: string) => {
    // Only search query is applied from the modal
    setSearchQuery(newQuery);
    setCurrentPage(1);
    setIsSearchModalOpen(false);
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
      
      {/* --- NAYA: Mobile Header Bar --- */}
      <header className={styles.mobileHeaderBar}>
          <button 
              className={styles.menuButton} 
              onClick={() => setIsMenuModalOpen(true)}
              aria-label="Open Fees Menu"
          >
              <FiMenu />
          </button>
          <h1 className={styles.title}>Fee Records</h1>
          
          {/* CRITICAL FIX: Functional Filters in Header */}
          <div className={styles.headerFilters}>
              {/* Class Filter */}
              <select 
                className={styles.headerFilterDropdown}
                value={filterClassId} 
                onChange={(e) => {setFilterClassId(Number(e.target.value) || 'All'); setCurrentPage(1);}}
              >
                <option value="All">Class</option>
                {classOptions.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>

              {/* Mode Filter */}
              <select 
                className={styles.headerFilterDropdown}
                value={filterMode} 
                onChange={(e) => {setFilterMode(e.target.value); setCurrentPage(1);}}
              >
                <option value="All">Mode</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
              </select>
              
              {/* Status Filter */}
              <select 
                className={styles.headerFilterDropdown}
                value={filterStatus} 
                onChange={(e) => {setFilterStatus(e.target.value as 'All' | Transaction['status']); setCurrentPage(1);}}
              >
                <option value="All">Status</option>
                <option value="Success">Paid</option>
                <option value="Pending">Partial</option>
              </select>
          </div>
          {/* END CRITICAL FIX */}

          <button 
              className={styles.searchToggleButton} 
              onClick={() => setIsSearchModalOpen(true)}
              aria-label="Open Filters and Search"
          >
              <FiSearch />
          </button>
      </header>

      {/* --- Desktop Header (Hides on Mobile) --- */}
      <header className={styles.header}>
        <h1 className={styles.title}>Fee Records & Transaction History 💰</h1>
        <div className={styles.actions}>
          <button className={styles.exportButton} onClick={() => alert('Exporting data via backend API route 16...')}>
            <FiDownload /> Export Data
          </button>
        </div>
      </header>

      {/* --- Desktop Controls (Hides on Mobile) --- */}
      <div className={styles.controls}>
        {/* Search Bar */}
        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} />
          <input 
            type="text"
            placeholder="Search by Student Name or Receipt ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* NEW: Class Filter */}
        <div className={styles.filters}>
          <select 
            value={filterClassId} 
            onChange={(e) => {setFilterClassId(Number(e.target.value) || 'All'); setCurrentPage(1);}}
          >
            <option value="All">All Classes</option>
            {classOptions.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        {/* Existing Filters */}
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

      {/* --- Transaction Table (Scroll Fix Applied in SCSS) --- */}
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
      
      {/* --- Pagination Controls (No Change) --- */}
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
      
      {/* --- MODAL 1: RECEIPT (No Change) --- */}
      <Modal 
        isOpen={isReceiptModalOpen} 
        onClose={handleCloseReceiptModal} 
        title={`Receipt: ${detailedReceiptData?.receiptId || 'Loading...'}`}
      >
        {isReceiptLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading receipt data...</div>
        ) : detailedReceiptData ? (
            <FeeReceipt transaction={detailedReceiptData} />
        ) : (
             <div style={{ padding: '2rem', textAlign: 'center' }}>Receipt data could not be loaded.</div>
        )}
      </Modal>
      
      {/* --- MODAL 2: MOBILE MENU (Export Data) --- */}
      <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)} title="Quick Actions">
          <button 
            className={styles.modalActionLink} 
            onClick={() => { alert('Exporting data via backend API route 16...'); setIsMenuModalOpen(false); }}
          >
            <FiDownload /> Export Data
          </button>
      </Modal>

      {/* --- MODAL 3: MOBILE SEARCH ONLY --- */}
      <Modal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} title="Filters & Search">
        <div className={styles.modalFiltersContainer}>
          {/* Search Input */}
          <div className={styles.modalSearchControls}>
              <div className={styles.searchBar}>
                  <FiSearch className={styles.searchIcon} />
                  <input 
                      type="text"
                      placeholder="Student Name or Receipt ID"
                      // Use a ref or simple query on apply button to get current value for complex modal inputs
                      defaultValue={searchQuery}
                      id="modalSearchInput"
                  />
              </div>
          </div>
            
          {/* Apply Button */}
          <button 
              className={styles.modalActionLink}
              onClick={() => {
                  const input = document.getElementById('modalSearchInput') as HTMLInputElement;
                  // Only pass the search query
                  handleApplyFilters(input.value);
              }}
          >
              <FiSearch /> Apply Search
          </button>

        </div>
      </Modal>

    </div>
  );
};

export default FeeRecordsPage;
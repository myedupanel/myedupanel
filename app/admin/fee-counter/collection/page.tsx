"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api'; 
import styles from './FeeCollection.module.scss'; 
import Modal from '@/components/common/Modal/Modal'; 

// Import *only* the default component 'FeeReceipt'
import FeeReceipt from '@/components/admin/fees/FeeReceipt'; 

import { FiUser, FiCreditCard, FiRefreshCw, FiDollarSign, FiPrinter, FiXCircle, FiCalendar, FiSearch, FiCheckCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import StudentSearch from '@/components/admin/StudentSearch/StudentSearch'; 

// --- FIX 4 (UPAR): Interface definitions ko error ke hisaab se update kiya ---

// 'items' ko naye error ke hisaab se correct type diya
export interface TemplateInfo {
  id: string; // Component ko templateId.id string chahiye (pichle error se)
  name: string;
  items?: { name: string; amount: number; }[]; // Naye error se
  totalAmount?: number; 
}

export interface Transaction {
  id: number; // Component ko transaction.id number chahiye (naye error se)
  receiptId: string;
  amountPaid: number;
  paymentMode: string;
  paymentDate: string;
  status: 'Success' | 'Pending' | 'Failed';
  templateName?: string;
  templateId?: TemplateInfo; 
}

// Baaki types waise hi rahenge
export interface StudentInfo { [key: string]: any; }
export interface FeeRecordInfo { [key: string]: any; }
export interface CollectorInfo { [key: string]: any; }
export interface SchoolInfo { [key: string]: any; }

export interface ReceiptData extends Transaction {
  studentInfo?: StudentInfo;
  schoolInfo?: SchoolInfo;
  collectorInfo?: CollectorInfo;
  feeRecordInfo?: FeeRecordInfo;
}
// --- END FIX ---


// --- Interface Definitions (Only keeping local types that FeeReceipt does NOT use) ---
interface FeeRecordListItem {
  id: number; 
  amount: number;
  amountPaid: number;
  balanceDue: number;
  dueDate: string;
  status: 'Pending' | 'Partial' | 'Paid' | 'Late';
  templateId: { id: number; name: string }; 
  studentId: number; 
  classId: string;
  studentName?: string;
  className?: string;
}

interface StudentSearchResult {
  id: string; 
  name: string;
  class: string;
  studentId?: string; 
}
// ---

const FeeCollectionPage: React.FC = () => {
  // --- States ---
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'feeRecord' | 'paid' | 'failed' | 'history'>('feeRecord');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [feeRecords, setFeeRecords] = useState<FeeRecordListItem[]>([]);
  const [paidTransactions, setPaidTransactions] = useState<Transaction[]>([]);
  const [failedTransactions, setFailedTransactions] = useState<Transaction[]>([]);
  const [historyTransactions, setHistoryTransactions] = useState<Transaction[]>([]);

  const [recordToCollectOffline, setRecordToCollectOffline] = useState<FeeRecordListItem | null>(null);
  const [manualAmount, setManualAmount] = useState<string>('');
  const [manualPaymentMode, setManualPaymentMode] = useState<string>('Cash');
  const [manualPaymentDate, setManualPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualNotes, setManualNotes] = useState<string>('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastTransactionForReceipt, setLastTransactionForReceipt] = useState<Transaction | null>(null);

  const [historySearch, setHistorySearch] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');
  const [historyPaymentModeFilter, setHistoryPaymentModeFilter] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalRecords, setHistoryTotalRecords] = useState(0);
  const HISTORY_LIMIT = 15;

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptDataForModal, setReceiptDataForModal] = useState<ReceiptData | null>(null); 
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);


  // --- Helper: Format Currency ---
  const formatCurrency = (amount: number): string => {
    if (isNaN(amount) || amount === null || amount === undefined) return '₹ 0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

   // --- Helper: Format Date ---
   const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return 'N/A';
        try {
            const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
            return new Date(dateString).toLocaleDateString('en-GB', options).replace(/ /g, '-');
        } catch (e) { return 'Invalid Date'; }
    };

  // --- Main Data Fetching Logic ---
  const fetchData = useCallback(async (page = 1) => {
    const studentIdForBackend = selectedStudent?.id ? parseInt(selectedStudent.id, 10) : null; 
    
    if (!studentIdForBackend) {
      setFeeRecords([]); setPaidTransactions([]); setFailedTransactions([]); setHistoryTransactions([]);
      return;
    }
    setLoading(true); setError(null); setSubmitStatus(null);
    if(activeSubTab !== 'feeRecord') setLastTransactionForReceipt(null);
    let url = '';
    const params = new URLSearchParams({ studentId: studentIdForBackend.toString() }); 
    try {
      switch (activeSubTab) {
        case 'feeRecord': 
          params.append('status', 'Pending,Partial');
          url = `/api/fees/student-records?${params.toString()}`; 
          const resFR = await api.get(url);
          setFeeRecords(resFR.data.data || []);
          break;
        case 'paid': 
          params.append('status', 'Success'); params.append('limit', HISTORY_LIMIT.toString()); params.append('page', '1');
          url = `/api/fees/transactions?${params.toString()}`; 
          const resPaid = await api.get(url);
          setPaidTransactions(resPaid.data.data || []);
          break;
        case 'failed': 
          params.append('status', 'Failed,Pending'); params.append('limit', HISTORY_LIMIT.toString()); params.append('page', '1');
          url = `/api/fees/transactions?${params.toString()}`; 
          const resFailed = await api.get(url);
          setFailedTransactions(resFailed.data.data || []);
          break;
        case 'history': 
          params.append('page', page.toString()); params.append('limit', HISTORY_LIMIT.toString());
          if (historySearch) params.append('search', historySearch);
          if (historyStartDate) params.append('startDate', historyStartDate);
          if (historyEndDate) params.append('endDate', historyEndDate);
          if (historyStatusFilter) params.append('status', historyStatusFilter);
          if (historyPaymentModeFilter) params.append('paymentMode', historyPaymentModeFilter);
          url = `/api/fees/transactions?${params.toString()}`; 
          const resHist = await api.get(url);
          setHistoryTransactions(resHist.data.data || []);
          setHistoryTotalPages(resHist.data.totalPages || 1);
          setHistoryTotalRecords(resHist.data.totalRecords || 0);
          setHistoryPage(resHist.data.currentPage || 1);
          break;
      }
    } catch (err: any) {
      console.error(`Failed to fetch data for ${activeSubTab}:`, url, err);
      setError(err.response?.data?.message || `Failed to load ${activeSubTab} data.`);
      if (activeSubTab === 'feeRecord') setFeeRecords([]);
      if (activeSubTab === 'paid') setPaidTransactions([]);
      if (activeSubTab === 'failed') setFailedTransactions([]);
      if (activeSubTab === 'history') setHistoryTransactions([]);
    } finally { setLoading(false); }
  }, [selectedStudent, activeSubTab, historyPage, historySearch, historyStartDate, historyEndDate, historyStatusFilter, historyPaymentModeFilter]); // Dependencies updated

  // --- useEffect Hooks (No changes) ---
  useEffect(() => {
    setHistoryPage(1);
    fetchData(activeSubTab === 'history' ? historyPage : 1); 
    if (activeSubTab !== 'feeRecord') {
      setRecordToCollectOffline(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent, activeSubTab]); // fetchData removed from dependencies

  useEffect(() => {
    if (activeSubTab === 'history') {
      fetchData(historyPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyPage]); // fetchData removed


  // --- Handlers ---
  const handleSelectForOffline = (record: FeeRecordListItem) => { 
    if (recordToCollectOffline?.id === record.id) { setRecordToCollectOffline(null); return; }
    setRecordToCollectOffline(record);
    setManualAmount(record.balanceDue.toString()); 
    setManualPaymentMode('Cash');
    setManualPaymentDate(new Date().toISOString().split('T')[0]);
    setManualNotes('');
    setLastTransactionForReceipt(null);
    setSubmitStatus(null);
  };

  const handleCollectManually = async () => {
    if (!recordToCollectOffline || !manualAmount || isSubmittingManual || !selectedStudent?.id) return;
    const amountToPay = Number(manualAmount);
    if (isNaN(amountToPay) || amountToPay <= 0 || amountToPay > recordToCollectOffline.balanceDue + 0.01) {
      setSubmitStatus({ message: amountToPay > recordToCollectOffline.balanceDue ? 'Amount exceeds balance.' : 'Invalid amount.', type: 'error' }); return;
    }
    if (manualPaymentMode === 'Cheque' && !manualNotes.trim()) {
      setSubmitStatus({ message: 'Cheque details required in notes.', type: 'error' }); return;
    }
    setIsSubmittingManual(true); setLastTransactionForReceipt(null); setSubmitStatus(null);
    try {
      const payload = {
        feeRecordId: recordToCollectOffline.id, amountPaid: amountToPay,
        paymentMode: manualPaymentMode, paymentDate: manualPaymentDate, notes: manualNotes,
        studentId: recordToCollectOffline.studentId, 
        ...(manualPaymentMode === 'Cheque' && { chequeNumber: manualNotes, bankName: 'N/A' })
      };
      const response = await api.post('/api/fees/collect-manual', payload);
      setSubmitStatus({ message: 'Payment collected successfully!', type: 'success' });
      setLastTransactionForReceipt(response.data.transaction);
      setRecordToCollectOffline(null);
      setManualAmount('');
      fetchData(); 
    } catch (error: any) {
      console.error("Error collecting manual payment:", error);
      setSubmitStatus({ message: error.response?.data?.message || 'Failed to save payment.', type: 'error' });
    } finally { setIsSubmittingManual(false); }
  };

  const handleViewReceipt = async (transactionId: number) => { 
    setReceiptDataForModal(null); setReceiptError(null); setLoadingReceipt(true); setIsReceiptModalOpen(true);
    try {
      const res = await api.get(`/api/fees/transaction/${transactionId}`);
      setReceiptDataForModal(res.data); 
    } catch (err: any) {
      console.error("Failed to fetch receipt data:", err);
      setReceiptError(err.response?.data?.message || 'Failed to load receipt details.');
    } finally { setLoadingReceipt(false); }
  };

  const applyHistoryFilters = () => { setHistoryPage(1); fetchData(1); };
  const clearHistoryFilters = () => {
    setHistorySearch(''); setHistoryStartDate(''); setHistoryEndDate('');
    setHistoryStatusFilter(''); setHistoryPaymentModeFilter('');
    if (historyPage !== 1 || historySearch || historyStartDate || historyEndDate || historyStatusFilter || historyPaymentModeFilter) {
         setHistoryPage(1); 
    }
  };

  // --- RENDER ---
  return (
    <div className={styles.pageContainer}>
      {/* --- Left Panel --- */}
      <aside className={styles.leftPanel}>
         <div className={styles.panelHeader}><FiUser /><h3>Select Student</h3></div>
        <div className={styles.panelContent}>
          <StudentSearch onStudentSelect={(student: StudentSearchResult | null) => { setSelectedStudent(student); setActiveSubTab('feeRecord'); }} />
          {selectedStudent && (
            <div className={styles.selectedStudentInfo}>
              <p>Selected Student:</p>
              <strong>{selectedStudent.name}</strong>
              <span>Class: {selectedStudent.class}</span>
              {selectedStudent.studentId && <span>ID: {selectedStudent.studentId}</span>}
            </div>
          )}
        </div>
        <nav className={styles.verticalNav}>
          <ul>
            <li className={activeSubTab === 'feeRecord' ? styles.active : ''} onClick={() => setActiveSubTab('feeRecord')}>Fee Record</li>
            <li className={activeSubTab === 'paid' ? styles.active : ''} onClick={() => setActiveSubTab('paid')}>Paid Transaction</li>
            <li className={activeSubTab === 'failed' ? styles.active : ''} onClick={() => setActiveSubTab('failed')}>Fail Transaction</li>
            <li className={activeSubTab === 'history' ? styles.active : ''} onClick={() => setActiveSubTab('history')}>History</li>
          </ul>
        </nav>
      </aside>

      {/* --- Main Content Area --- */}
      <main className={styles.mainContent}>
        <div className={styles.panelHeader}>
          <h3>
            {activeSubTab === 'feeRecord' && 'Fee Record & Collection'}
            {activeSubTab === 'paid' && 'Paid Transactions'}
            {activeSubTab === 'failed' && 'Failed & Pending Transactions'}
            {activeSubTab === 'history' && 'Payment History'}
            {selectedStudent && ` for ${selectedStudent.name}`}
          </h3>
          {selectedStudent && (
            <button onClick={() => fetchData(activeSubTab === 'history' ? historyPage : 1)} className={styles.refreshButton} title="Refresh Data" disabled={loading}>
              <FiRefreshCw className={loading ? styles.spin : ''} />
            </button>
          )}
        </div>

        <div className={styles.panelContent}>
          {!selectedStudent ? (<p className={styles.placeholder}>Please select a student to view their records.</p>) :
            error ? (<p className={styles.errorMessage}>{error}</p>) :
            (
              <>
                {/* === Fee Record Tab === */}
                {activeSubTab === 'feeRecord' && (
                  loading && feeRecords.length === 0 ? (<p>Loading...</p>) :
                  (
                    <div className={styles.feeRecordLayout}>
                       <div className={styles.recordListSection}>
                        <h4>Pending / Partial Fees</h4>
                        {submitStatus?.type === 'success' && lastTransactionForReceipt && (
                          <div className={`${styles.statusMessage} ${styles.success}`}>
                            <FiCheckCircle /> {submitStatus.message} Receipt: {lastTransactionForReceipt.receiptId}
                            <button onClick={() => handleViewReceipt(lastTransactionForReceipt.id)} className={styles.printButtonSmall}> <FiPrinter /> View </button>
                          </div>
                        )}
                        {submitStatus?.type === 'error' && (
                          <div className={`${styles.statusMessage} ${styles.error}`}>{submitStatus.message}</div>
                        )}
                        {feeRecords.length === 0 && !recordToCollectOffline && !lastTransactionForReceipt ? (
                          <p className={styles.placeholder}>No pending or partial fee records found.</p>
                        ) : (
                          <ul className={styles.recordList}>
                            {feeRecords.map(record => (
                              <li key={record.id} className={`${styles.recordItem} ${recordToCollectOffline?.id === record.id ? styles.selectedForCollection : ''}`}>
                                <div className={styles.recordInfo}>
                                  <span>{record.templateId?.name || 'Fee Record'}</span>
                                  <span className={styles.amountDue}>Balance: {formatCurrency(record.balanceDue)}</span>
                                  <span className={styles.dueDate}>Due: {formatDate(record.dueDate)}</span>
                                </div>
                                <div className={styles.recordActions}>
                                  <button
                                    className={styles.collectOfflineButton}
                                    onClick={() => handleSelectForOffline(record)}
                                    disabled={record.balanceDue <= 0}
                                    title={recordToCollectOffline?.id === record.id ? "Cancel Collection" : "Collect Offline Payment"}>
                                    <FiDollarSign /> {recordToCollectOffline?.id === record.id ? "Cancel" : "Collect"}
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                       {recordToCollectOffline && (
                        <div className={styles.collectOfflineForm}>
                         <div className={styles.formHeader}><h3>Collect Offline Payment</h3></div>
                          <div className={styles.formContent}>
                            <div className={styles.selectedRecordInfoSmall}>
                              <p><strong>Record:</strong> {recordToCollectOffline.templateId?.name}</p>
                              <p><strong>Balance:</strong> {formatCurrency(recordToCollectOffline.balanceDue)}</p>
                            </div>
                            <hr className={styles.divider} />
                            <div className={styles.formGrid}>
                              <div className={styles.formGroup}>
                                <label htmlFor="manualAmount">Amount Paying *</label>
                                <input type="number" id="manualAmount" value={manualAmount} onChange={(e) => {setManualAmount(e.target.value); setSubmitStatus(null);}} max={recordToCollectOffline.balanceDue} min="0.01" step="0.01" required />
                              </div>
                              <div className={styles.formGroup}>
                                <label htmlFor="manualPaymentDate">Payment Date *</label>
                                <input type="date" id="manualPaymentDate" value={manualPaymentDate} onChange={(e) => {setManualPaymentDate(e.target.value); setSubmitStatus(null);}} required />
                              </div>
                            </div>
                            <div className={styles.formGroup}>
                              <label>Payment Mode *</label>
                              <div className={styles.paymentModes}>
                                {['Cash', 'Cheque', 'UPI', 'NEFT/RTGS', 'Draft', 'Other'].map(mode => (
                                  <div key={mode} className={styles.radioGroup}>
                                    <input type="radio" name="paymentMode" id={mode} value={mode} checked={manualPaymentMode === mode} onChange={(e) => {setManualPaymentMode(e.target.value); setSubmitStatus(null);}} />
                                    <label htmlFor={mode}>{mode}</label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className={styles.formGroup}>
                              <label htmlFor="manualNotes">Notes / Details</label>
                              <textarea id="manualNotes" value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} rows={2} placeholder={manualPaymentMode === 'Cheque' ? "Cheque No, Bank Name, Date" : "Optional transaction notes"} />
                            </div>
                            <hr className={styles.divider} />
                            <div className={styles.totalSection}>
                              <span>Paying Now:</span><strong>{formatCurrency(Number(manualAmount) || 0)}</strong>
                            </div>
                            <button className={styles.proceedButton} onClick={handleCollectManually} disabled={isSubmittingManual || !manualAmount || Number(manualAmount) <= 0 || Number(manualAmount) > recordToCollectOffline.balanceDue + 0.01}>
                              {isSubmittingManual ? 'Saving...' : 'Save Payment'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}

                {/* === Paid/Failed/History Tabs (Using Transaction type) === */}
                {/* Paid */}
                {activeSubTab === 'paid' && (
                  loading ? <p>Loading...</p> :
                  paidTransactions.length === 0 ? <p className={styles.placeholder}>No paid transactions found.</p> :
                  ( 
                     <div className={styles.recordsTableContainer}>
                      <table className={styles.recordsTable}>
                         <thead><tr><th>Receipt ID</th><th>Fee Name</th><th>Amount</th><th>Mode</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody>
                          {paidTransactions.map((tx) => (
                            <tr key={tx.id}>
                              <td>{tx.receiptId}</td>
                              <td>{tx.templateName || tx.templateId?.name || 'N/A'}</td>
                              <td>{formatCurrency(tx.amountPaid)}</td>
                              <td>{tx.paymentMode}</td>
                              <td>{formatDate(tx.paymentDate)}</td>
                              <td><button className={styles.actionButton} onClick={() => handleViewReceipt(tx.id)}><FiPrinter /> Receipt</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                   )
                )}
                {/* Failed */}
                 {activeSubTab === 'failed' && (
                  loading ? <p>Loading...</p> :
                  failedTransactions.length === 0 ? <p className={styles.placeholder}>No failed or pending transactions found.</p> :
                  ( 
                     <div className={styles.recordsTableContainer}>
                       <table className={styles.recordsTable}>
                          <thead><tr><th>Receipt ID</th><th>Fee Name</th><th>Amount</th><th>Mode</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                          <tbody>
                            {failedTransactions.map((tx) => (
                              <tr key={tx.id}>
                                G<td>{tx.receiptId}</td>
                                <td>{tx.templateName || tx.templateId?.name || 'N/A'}</td>
                                <td>{formatCurrency(tx.amountPaid)}</td>
                                <td>{tx.paymentMode}</td>
                                <td>{formatDate(tx.paymentDate)}</td>
                                <td><span className={`${styles.statusBadge} ${styles[tx.status.toLowerCase()]}`}>{tx.status}</span></td>
                                <td><button className={styles.actionButton} onClick={() => handleViewReceipt(tx.id)}>Details</button></td>
                              </tr>
                            ))}
                          </tbody>
                       </table>
                     </div>
                   )
                )}
                {/* History */}
                {activeSubTab === 'history' && (
                  <div className={styles.historyContainer}>
                     <div className={styles.filterBar}>
                      <div className={styles.filterGroup}>
                        <input type="text" className={styles.searchInput} placeholder="Search Receipt ID..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') applyHistoryFilters(); }}/>
                        <button className={styles.filterButton} onClick={applyHistoryFilters} disabled={loading}><FiSearch /></button>
                      </div>
                      <div className={styles.dateFilters}>
                        <label>From:</label><input type="date" value={historyStartDate} onChange={(e) => setHistoryStartDate(e.target.value)} className={styles.dateInput}/>
                        <label>To:</label><input type="date" value={historyEndDate} onChange={(e) => setHistoryEndDate(e.target.value)} className={styles.dateInput}/>
                      </div>
                      <select value={historyStatusFilter} onChange={(e) => setHistoryStatusFilter(e.target.value)} className={styles.selectInput}> <option value="">All Status</option><option value="Success">Success</option><option value="Pending">Pending</option><option value="Failed">Failed</option> </select>
                      <select value={historyPaymentModeFilter} onChange={(e) => setHistoryPaymentModeFilter(e.target.value)} className={styles.selectInput}> <option value="">All Modes</option><option value="Cash">Cash</option><option value="Cheque">Cheque</option><option value="UPI">UPI</option><option value="NEFT/RTGS">NEFT/RTGS</option><option value="Draft">Draft</option><option value="Other">Other</option> </select>
                      <button className={styles.applyFiltersButton} onClick={applyHistoryFilters} disabled={loading}>Apply</button>
                      <button className={styles.clearFiltersButton} onClick={clearHistoryFilters} disabled={loading}><FiXCircle /> Clear</button>
                    </div>
                    {loading && historyTransactions.length === 0 ? <p>Loading history...</p> :
                    historyTransactions.length === 0 ? <p className={styles.placeholder}>No history found matching filters.</p> :
                    (
                      <div className={styles.recordsTableContainer}>
                        <table className={styles.recordsTable}>
                          <thead><tr><th>Receipt ID</th><th>Fee Name</th><th>Date</th><th>Amount</th><th>Mode</th><th>Status</th><th>Actions</th></tr></thead>
                          <tbody>
                            {historyTransactions.map((tx) => (
                              <tr key={tx.id}>
                                <td>{tx.receiptId}</td>
                                <td>{tx.templateName || tx.templateId?.name || 'N/A'}</td>
                                <td>{formatDate(tx.paymentDate)}</td>
                                <td>{formatCurrency(tx.amountPaid)}</td>
                                <td>{tx.paymentMode}</td>
                                <td><span className={`${styles.statusBadge} ${styles[tx.status.toLowerCase()]}`}>{tx.status}</span></td>
                                <td><button className={styles.actionButton} onClick={() => handleViewReceipt(tx.id)}><FiPrinter /> Receipt</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {historyTotalPages > 1 && (
                          <div className={styles.pagination}>
                            <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1 || loading}><FiChevronLeft /> Prev</button>
                            <span>Page {historyPage} of {historyTotalPages}</span>
                            <button onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))} disabled={historyPage === historyTotalPages || loading}>Next <FiChevronRight /></button>
                          </div>
                        )}
                        <p className={styles.totalRecords}>Showing {historyTransactions.length} of {historyTotalRecords} records</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
        </div>
      </main>

      {/* --- Receipt Modal --- */}
      {isReceiptModalOpen && (
        <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title={`Fee Receipt - ${receiptDataForModal?.receiptId || ''}`}>
          {loadingReceipt ? <p>Loading Receipt...</p> :
            receiptError ? <p className={styles.errorMessage}>{receiptError}</p> :
            
            // --- FIX 4 (NICHE): Dono naye errors ko fix karne ke liye object ko manually banaya ---
            receiptDataForModal ? (
              <FeeReceipt 
                transaction={{
                  ...receiptDataForModal, // Baaki saari properties (status, amountPaid, etc.)
                  
                  // FIX 1: 'id' ko NUMBER hi pass kiya
                  id: receiptDataForModal.id, 
                  
                  // FIX 2: 'templateId' ko manually banaya taaki types match karein
                  templateId: {
                    // Pichla error chahta tha ki 'id' string ho
                    id: Number(receiptDataForModal.templateId?.id || '0'), 
                    name: receiptDataForModal.templateId?.name || 'N/A',
                    // Naya error chahta tha ki 'items' ek valid array ho
                    items: receiptDataForModal.templateId?.items || [], 
                    totalAmount: receiptDataForModal.templateId?.totalAmount || 0
                  }
                }} 
              />
            ) : (
              <p>Could not load receipt data.</p>
            )}
            
        </Modal>
      )}

    </div> // End pageContainer
  );
};

export default FeeCollectionPage;
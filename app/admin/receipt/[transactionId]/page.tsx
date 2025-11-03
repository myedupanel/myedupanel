"use client";
import React, { useState, useEffect } from 'react'; // React, useState, useEffect import kiye
import { useParams } from 'next/navigation';
import api from '@/backend/utils/api'; 
import styles from './Receipt.module.scss';
import { FiPrinter, FiDownload } from 'react-icons/fi'; // Download button bhi add kiya

// --- FIX 1: Robust Interfaces (Backend se aane wala complete data) ---
// Note: Yeh interfaces aapke backend models se match honi chahiye
interface StudentDetails { name: string; class: string; studentId?: string; rollNo?: string; }
interface TemplateDetails { name: string; items: { name: string; amount: number }[]; totalAmount: number; }
interface SchoolDetails { name: string; address: string; session: string; logoUrl?: string; }

interface FullTransaction {
  receiptId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  status: string;
  // --- ZAROORI FIELDS ---
  student: StudentDetails; 
  template: TemplateDetails;
  schoolInfo: SchoolDetails;
  totalFeeAmount: number; // For total demand
  discountGiven: number;
  lateFineApplied: number;
  currentBalanceDue: number; // Balance
  feeRecordStatus: string;
  collectedByName: string;
  notes?: string;
  // --- END ZAROORI FIELDS ---
}

// Helper functions (No Change)
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};
const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
// --- END FIX 1 ---


export default function ReceiptPage() {
  const params = useParams();
  // Assume transactionId is the actual receipt ID string or database ID
  const transactionId = params.transactionId as string; 

  const [transaction, setTransaction] = useState<FullTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) return;
      setLoading(true);
      try {
        // FIX: API endpoint update kiya taaki complete data mil sake
        const res = await api.get(`/fees/transaction/${transactionId}`); 
        setTransaction(res.data);
      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError('Failed to load receipt details. (Please ensure backend data is complete)');
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [transactionId]);

  // --- FIX 2: Print/Download Logic Update ---
  // Simple window.print() abhi bhi blank ho sakta hai. Hum use CSS se theek karenge.
  const handlePrint = () => {
    // CSS load hone ke liye chhota sa delay dete hain
    setTimeout(() => {
        window.print();
    }, 100); 
  };
  
  const handleDownloadPDF = () => {
      alert("PDF download feature will be implemented using jsPDF and html2canvas.");
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading Receipt...</div>; 
  if (error) return <div className={styles.error}>{error}</div>; 
  if (!transaction) return <div>Transaction not found.</div>;

  // --- Calculations ---
  const netPayable = transaction.totalFeeAmount - transaction.discountGiven + transaction.lateFineApplied;
  const balance = transaction.currentBalanceDue ?? netPayable - transaction.amountPaid;
  const isPaid = balance < 0.01 && transaction.status === 'Success';


  // --- FIX 3: Professional Receipt Layout ---
  return (
    <div className={styles.receiptPageWrapper}>
      
      {/* Action Buttons */}
      <div className={`${styles.actions} ${styles.noPrint}`}>
        <button onClick={handleDownloadPDF} className={styles.downloadButton}><FiDownload /> Download PDF</button>
        <button onClick={handlePrint} className={styles.printButton}><FiPrinter /> Print Receipt</button>
      </div>

      <div className={styles.receiptContainer}>
        {/* Header */}
        <header className={styles.receiptHeader}>
          <div className={styles.logoArea}>
            {transaction.schoolInfo.logoUrl && <img src={transaction.schoolInfo.logoUrl} alt="Logo" />}
            <h1>{transaction.schoolInfo.name || 'FEE RECEIPT'}</h1>
          </div>
          <div className={styles.meta}>
            <p><strong>Receipt No:</strong> {transaction.receiptId}</p>
            <p><strong>Date:</strong> {formatDate(transaction.paymentDate)}</p>
            <p><strong>Session:</strong> {transaction.schoolInfo.session}</p>
          </div>
        </header>

        {/* Student and Payment Details */}
        <section className={styles.detailsBlock}>
          <div className={styles.studentInfo}>
            <h4>Student Details</h4>
            <p><strong>Name:</strong> {transaction.student.name}</p>
            <p><strong>Class:</strong> {transaction.student.class}</p>
            <p><strong>Roll No:</strong> {transaction.student.rollNo || 'N/A'}</p>
          </div>
          <div className={styles.paymentInfo}>
            <h4>Payment Summary</h4>
            <p><strong>Amount Paid:</strong> <span className={styles.paidAmount}>{formatCurrency(transaction.amountPaid)}</span></p>
            <p><strong>Payment Mode:</strong> {transaction.paymentMode}</p>
            <p><strong>Status:</strong> <span className={styles.statusBadge}>{transaction.status.toUpperCase()}</span></p>
          </div>
        </section>

        {/* Fee Breakdown Table */}
        <section className={styles.feeBreakdown}>
          <h4>Fee Particulars ({transaction.template.name})</h4>
          <table className={styles.feeTable}>
            <thead>
              <tr>
                <th className={styles.headItem}>Particular</th>
                <th className={styles.headAmount}>Demand</th>
                <th className={styles.headAmount}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {/* Individual Fee Items */}
              {transaction.template.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td className={styles.amount}>{formatCurrency(item.amount)}</td>
                  <td className={styles.amount}>-</td>
                </tr>
              ))}
              
              {/* Summary Rows */}
              <tr className={styles.summaryRow}>
                <td>**Total Demand**</td>
                <td className={styles.amount}>{formatCurrency(transaction.totalFeeAmount)}</td>
                <td className={styles.amount}>-</td>
              </tr>
              {transaction.discountGiven > 0 && (
                <tr className={styles.calcRow}>
                  <td>Discount (-)</td>
                  <td className={styles.amount}>{formatCurrency(transaction.discountGiven)}</td>
                  <td className={styles.amount}>-</td>
                </tr>
              )}
              {transaction.lateFineApplied > 0 && (
                <tr className={styles.calcRow}>
                  <td>Late Fine (+)</td>
                  <td className={styles.amount}>{formatCurrency(transaction.lateFineApplied)}</td>
                  <td className={styles.amount}>-</td>
                </tr>
              )}

              <tr className={styles.finalRow}>
                <td>**NET PAYABLE**</td>
                <td className={styles.amount}>{formatCurrency(netPayable)}</td>
                <td className={styles.amount}>{formatCurrency(transaction.amountPaid)}</td>
              </tr>
            </tbody>
          </table>
        </section>
        
        {/* Footer/Balance */}
        <footer className={styles.receiptFooter}>
          <div className={styles.notes}>
            <p><strong>Notes:</strong> {transaction.notes || 'N/A'}</p>
            <p className={styles.balance}>
               Balance Due: <span className={isPaid ? styles.paidZero : styles.dueAmount}>{formatCurrency(balance)}</span>
            </p>
          </div>
          <div className={styles.signatureArea}>
             <p className={styles.collected}>Collected By: {transaction.collectedByName}</p>
             <div className={styles.signatureLine}></div>
             <p>Authorised Signatory</p>
          </div>
        </footer>
        <p className={styles.computerGenerated}>This is a computer-generated receipt.</p>
        {isPaid && <div className={styles.paidStamp}>PAID</div>}
      </div> {/* End Receipt Container */}

    </div>
  );
}
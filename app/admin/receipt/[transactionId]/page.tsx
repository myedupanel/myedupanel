"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/backend/utils/api'; 
import styles from './Receipt.module.scss'; // Hum yeh file AAGE banayenge
import { FiPrinter } from 'react-icons/fi';
// import LoadingTemplates from '@/components/LoadingTemplates'; // <-- YEH LINE HATA DI GAYI HAI

// Data types (example, aapke models ke hisaab se)
interface Transaction {
  id: string;
  amountPaid: number;
  paymentDate: string;
  mode: string;
  status: string;
  studentId: { name: string; class: string }; // Populated
  templateId: { name: string }; // Populated
  feeRecordId: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const { transactionId } = params;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) return;
      setLoading(true);
      try {
        const res = await api.get(`/fees/transaction/${transactionId}`); 
        setTransaction(res.data);
      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError('Failed to load receipt details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [transactionId]);

  const handlePrint = () => {
    window.print();
  };

  // --- YAHAN BADLAAV KIYA GAYA HAI ---
  if (loading) return <div style={{ padding: '2rem' }}>Loading Receipt...</div>; // Simple loading text
  if (error) return <div className="error">{error}</div>; 
  if (!transaction) return <div>Transaction not found.</div>;

  // --- YEH HAI AAPKA RECEIPT JSX ---
  return (
    <div className={styles.receiptContainer}>
      
      <div className={styles.noPrint}>
        <button onClick={handlePrint} className={styles.printButton}>
          <FiPrinter /> Print Receipt
        </button>
      </div>

      <div className={styles.printableArea}>
        <header className={styles.receiptHeader}>
          <h1>Payment Receipt</h1>
          <p><strong>Transaction ID:</strong> {transaction.id}</p>
        </header>

        <section className={styles.detailsGrid}>
          <div className={styles.studentDetails}>
            <h2>Student Details</h2>
            <p><strong>Name:</strong> {transaction.studentId.name}</p>
            <p><strong>Class:</strong> {transaction.studentId.class}</p>
          </div>
          
          <div className={styles.paymentDetails}>
            <h2>Payment Details</h2>
            <p><strong>Amount Paid:</strong> {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(transaction.amountPaid)}</p>
            <p><strong>Date:</strong> {new Date(transaction.paymentDate).toLocaleDateString('en-GB')}</p>
            <p><strong>Payment Mode:</strong> {transaction.mode}</p>
            <p><strong>Status:</strong> {transaction.status}</p>
          </div>
        </section>
        
        <section className={styles.feeDetails}>
          <h2>For Fee</h2>
          <p><strong>Fee Type:</strong> {transaction.templateId.name}</p>
          <p><strong>Fee Record ID:</strong> {transaction.feeRecordId}</p>
        </section>

        <footer className={styles.receiptFooter}>
          <div className={styles.signatureBox}>
            Signature & Stamp
          </div>
          <p>Thank you for your payment.</p>
        </footer>
      </div>

    </div>
  );
}
// File: app/admin/receipt/[transactionId]/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/backend/utils/api'; 
// FeeReceipt aur Transaction interface ko import kiya
import FeeReceipt, { Transaction } from '@/components/admin/fees/FeeReceipt'; 
import styles from './Receipt.module.scss'; // Use for main page wrapper styling

export default function ReceiptPage() {
  const params = useParams();
  // Ensure transactionId is treated as string, Next.js handles param arrays if needed
  const transactionId = Array.isArray(params.transactionId) ? params.transactionId[0] : params.transactionId;

  const [transaction, setTransaction] = useState<Transaction | null>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) return;
      setLoading(true);
      try {
        const res = await api.get(`/fees/transaction/${transactionId}`); 
        // Assuming your backend returns transaction details directly in res.data
        setTransaction(res.data.transaction || res.data as Transaction); 
      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError('Failed to load receipt details. Please check network connection and backend logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [transactionId]);

  // --- JSX Render Logic ---
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Fee Receipt...</div>; 
  if (error) return <div className={styles.errorContainer}>{error}</div>; 
  if (!transaction) return <div className={styles.noData}>Transaction not found.</div>;

  return (
    <div className={styles.mainWrapper}>
      {/* Transaction data FeeReceipt component ko pass kiya jayega */}
      <FeeReceipt transaction={transaction} /> 
    </div>
  );
}
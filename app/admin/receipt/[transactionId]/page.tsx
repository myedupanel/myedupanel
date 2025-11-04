// File: app/admin/receipt/[transactionId]/page.tsx (Updated to use DEMO)
"use client";
// Import the necessary files
import { useParams } from 'next/navigation';
import styles from './Receipt.module.scss'; 

// Import the dedicated TEST component
import TestFeeReceipt from '@/components/admin/fees/TestFeeReceipt'; 

export default function ReceiptPage() {
  const params = useParams();
  const { transactionId } = params;

  // WARNING: Original API fetch logic yahan nahi hai! Yeh sirf test mode ke liye hai.

  console.log(`Rendering page in Test Mode for ID: ${transactionId}`);

  // --- JSX Render Logic (Seedha Test Component) ---
  return (
    <div className={styles.mainWrapper} style={{padding: '20px'}}>
      {/* TestFeeReceipt ko render karein taki print logic test ho sake */}
      <TestFeeReceipt /> 
    </div>
  );
}
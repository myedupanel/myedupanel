// File: app/admin/receipt/[transactionId]/page.tsx (TEMP TEST MODE)
"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
// Note: API import aur useEffect ko disabled rakhte hain testing ke liye
// import api from '@/backend/utils/api'; 
// import FeeReceipt, { Transaction } from '@/components/admin/fees/FeeReceipt'; 
import styles from './Receipt.module.scss'; 

// Import the dedicated test component
import TestFeeReceipt from '@/components/admin/fees/TestPrintReceipt'; 

// Note: Original Transaction interface aur loading state ko hataya gaya hai 
// kyunki TestFeeReceipt mein hardcoded data hai.

export default function ReceiptPage() {
  const params = useParams();
  const { transactionId } = params;

  // --- COMPONENT LOGIC HATA DIYA GAYA HAI ---
  // API fetch logic removed: useEffect, useState, transaction, loading, error
  // Kyunki hum TestFeeReceipt ko render kar rahe hain.
  
  console.log(`Rendering page in Test Mode for ID: ${transactionId}`);

  // --- JSX Render Logic (Seedha Test Component) ---
  return (
    <div className={styles.mainWrapper}>
      {/* TestFeeReceipt ko render karein jo hardcoded data use karta hai */}
      <TestFeeReceipt /> 
      
      {/* View Receipt button ke upar click karne par, yeh page load hoga 
          aur seedha TestPrintReceipt component ka JSX dikhayega.
      */}
    </div>
  );
}
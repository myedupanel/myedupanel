// File: app/admin/receipt/[transactionId]/page.tsx (FINAL LIVE PRINT CODE)
"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import api from '@/backend/utils/api'; 
import styles from './Receipt.module.scss'; 
import { FiPrinter, FiDownload } from 'react-icons/fi'; // Download button ke liye FiDownload
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Data types (Updated for better handling) ---
interface StudentDetails { name: string; class: string; }
interface TemplateDetails { name: string; }

interface Transaction {
  id: string;
  amountPaid: number;
  paymentDate: string;
  mode: string;
  status: string;
  studentId: StudentDetails; // Assuming nested structure
  templateId: TemplateDetails; 
  feeRecordId: string;
}
// ---

export default function ReceiptPage() {
  const params = useParams();
  const { transactionId } = params;

  const printableRef = useRef<HTMLDivElement>(null); // Ref for the printable area

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- API Fetch Logic (Re-enabled) ---
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) return;
      setLoading(true);
      try {
        const res = await api.get(`/fees/transaction/${transactionId}`); 
        setTransaction(res.data);
      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError('Failed to load receipt details. Check backend logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [transactionId]);

  // --- FINAL WORKING PRINT HANDLER (Canvas Logic) ---
  const handlePrint = () => {
    const input = printableRef.current;
    if (!input || !transaction) {
        alert("Transaction details not loaded or element not found."); 
        return;
    }
    
    // 1. HTML2Canvas से स्क्रीनशॉट कैप्चर करें
    html2canvas(input, {
        scale: 2.5, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        width: input.offsetWidth,
        height: input.offsetHeight
    } as any).then((canvas) => {
        
        const imgData = canvas.toDataURL('image/png');
        const printWindow = window.open('', '_blank');
        
        if (printWindow) {
            // 2. Image को नए window में डालें और प्रिंट CSS लगाएं
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Fee Receipt - ${transaction.id}</title>
                        <style>
                            @page { size: A4 portrait; margin: 0; } 
                            body { margin: 0; padding: 0; } 
                            img { 
                                width: 100vw; 
                                height: auto; 
                                display: block; 
                            }
                        </style>
                    </head>
                    <body><img src="${imgData}" /></body>
                </html>
            `);
            printWindow.document.close();
            
            // 3. Print with a small delay (CRUCIAL)
            printWindow.onload = () => {
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250); 
            };
        }
    }).catch(err => {
        console.error("Print Error (HTML2Canvas):", err);
        alert("Could not generate print preview. Check console.");
    });
  };
  
  // --- Download PDF Handler (Bonafide style) ---
  const handleDownloadPDF = () => {
    // Note: You would need to implement the full jsPDF/html2canvas download logic here, 
    // similar to handlePrint but saving to PDF instead of opening a window.
    alert("Download PDF not implemented yet. Please use Print -> Save as PDF.");
  }


  // --- JSX Render Logic ---
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Receipt...</div>; 
  if (error) return <div className={styles.errorContainer}>{error}</div>; 
  if (!transaction) return <div>Transaction not found.</div>;

  return (
    <div className={styles.receiptContainer}>
      
      {/* --- Print/Download Buttons (Now functional) --- */}
      <div className={styles.actions}>
        <button onClick={handleDownloadPDF} className={styles.downloadButton}>
          <FiDownload /> Download PDF
        </button>
        <button onClick={handlePrint} className={styles.printButton}>
          <FiPrinter /> Print Receipt
        </button>
      </div>
      
      {/* --- PRINTABLE AREA (Ref added for html2canvas) --- */}
      <div className={styles.printableArea} ref={printableRef}>
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
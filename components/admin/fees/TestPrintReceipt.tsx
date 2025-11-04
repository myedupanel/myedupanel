// File: components/admin/fees/TestFeeReceipt.tsx (Real-Time Data Logic)

"use client";
import React, { useRef, useEffect, useState } from 'react';
// SCSS file ka naam update kiya
import styles from './TestPrintStyles.module.scss'; 
import { FiPrinter } from 'react-icons/fi';
import api from '@/backend/utils/api'; 
// Hum FeeReceipt.tsx se Transaction interface ko use karenge (Aapne FeeReceipt.tsx file use ki thi)
import { Transaction } from './FeeReceipt'; 


// Helper Functions (Copy paste kiye hue)
const formatCurrency = (amount: number | undefined | null): string => {
    if (isNaN(amount as number) || amount === null || amount === undefined) return '₹ 0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR',
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount);
};

const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-GB', options).replace(/ /g, '-');
    } catch (e) { return 'Invalid Date'; }
};
// --- END Helper Functions ---


// Test Component: Yeh component khud data fetch karega
export default function TestFeeReceipt() {
    const componentRef = useRef<HTMLDivElement>(null);

    // Hardcode a Transaction ID for testing the API fetch/print workflow
    const TEST_TRANSACTION_ID = 'TXN-1762267726322'; 
    
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- FETCH REAL-TIME DATA ---
    useEffect(() => {
        const fetchTransaction = async () => {
            setLoading(true);
            try {
                // API path ko original page.tsx se liya gaya
                const res = await api.get(`/fees/transaction/${TEST_TRANSACTION_ID}`); 
                // Assuming res.data.transaction ya res.data hi Transaction object hai
                setTransaction(res.data.transaction || res.data as Transaction); 
            } catch (err) {
                console.error("Error fetching transaction:", err);
                setError('Failed to load receipt details from API.');
            } finally {
                setLoading(false);
            }
        };
        fetchTransaction();
    }, [TEST_TRANSACTION_ID]);


    // --- FINAL WORKING PRINT HANDLER ---
    const handlePrint = () => {
        const printContent = componentRef.current;
        if (!printContent || !transaction) return;
        
        const printWindow = window.open('', '', 'height=800,width=800');
        if (!printWindow) return; 

        // 1. Stylesheets aur Inline <style> tags dono collect karein (CRUCIAL FIX)
        let stylesToInject = '';
        const links = document.querySelectorAll('link[rel="stylesheet"], style');
        links.forEach(link => {
            stylesToInject += link.outerHTML; 
        });

        // 2. Naye window ke liye HTML construct karein (Blank page aur 2-page fix)
        const htmlContent = `
            <html>
                <head>
                    <title>Fee Receipt - ${transaction.receiptId}</title>
                    ${stylesToInject} 
                    <style>
                        /* --- FORCE GLOBAL RESET (FOR 2-PAGE FIX) --- */
                        @page { size: A4; margin: 15mm; }
                        
                        body, html { 
                            margin: 0 !important; 
                            padding: 0 !important; 
                            width: 100vw;
                            height: 100vh;
                            overflow: hidden; 
                            background-color: white !important;
                        }
                        /* Content ko forcefully visible rakho */
                        .receiptContent {
                            visibility: visible !important;
                            min-height: auto !important;
                            max-height: 290mm; /* Extra fix for 2-page issue */
                        }
                        .receiptContent * {
                           visibility: visible !important;
                        }
                    </style>
                </head>
                <body>
                    ${printContent.outerHTML} 
                </body>
            </html>
        `;

        // 3. Content likhein aur print trigger karein delay ke saath
        printWindow.document.write(htmlContent);
        printWindow.document.close(); 
        
        // 4. 500ms delay styles ko load hone ka time dene ke liye
        setTimeout(() => {
            printWindow.focus(); 
            printWindow.print(); 
            printWindow.close(); 
        }, 500); 
    };
    // --- END PRINT HANDLER ---


    if (loading) return <div className={styles.receiptContainer}>Loading real-time data...</div>;
    if (error) return <div className={styles.receiptContainer} style={{color: 'red'}}>{error}</div>;
    if (!transaction) return <div className={styles.receiptContainer}>Transaction ID ${TEST_TRANSACTION_ID} not found.</div>;


    // --- JSX (Dynamic data ke saath) ---
    return (
        <div className={styles.receiptContainer}>
            {/* --- Action Buttons --- */}
            <div className={styles.actions}>
                {/* Download PDF button yahan nahi banaya gaya hai */}
                <button onClick={handlePrint} className={styles.printButton}>
                    <FiPrinter /> Print Receipt (Dynamic)
                </button>
            </div>
            
            {/* Is div ko hum styles.receiptContent maan kar print karenge */}
            <div className={styles.receiptContent} ref={componentRef}>
                <header className={styles.header}>
                    <h1>{transaction.schoolInfo?.name || 'My EduPanel'}</h1>
                    <p>Transaction Data Check (Real-Time)</p>
                </header>
                
                <p><strong>Receipt ID:</strong> {transaction.receiptId}</p>
                <p><strong>Student Name:</strong> {(transaction.studentId as any)?.name || transaction.studentName || 'N/A'}</p>
                <p><strong>Class:</strong> {(transaction.studentId as any)?.class || transaction.className || 'N/A'}</p>
                
                <p style={{fontSize: '2rem', margin: '30px', textAlign: 'center'}}>
                    <strong>Amount Paid:</strong> {formatCurrency(transaction.amountPaid)}
                </p>
                <p><strong>Payment Date:</strong> {formatDate(transaction.paymentDate)}</p>
            </div>
        </div>
    );
}
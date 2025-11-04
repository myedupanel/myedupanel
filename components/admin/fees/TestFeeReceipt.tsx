// File: components/admin/fees/TestFeeReceipt.tsx (FINAL CLEANED CODE - No object literal error)

"use client";
import React, { useRef } from 'react';
// New SCSS file import
import styles from './TestPrintStyles.module.scss'; 
import { FiPrinter, FiDownload } from 'react-icons/fi';

// --- Dummy Transaction Data (Directly used) ---
const dummyTransaction = {
    receiptId: 'DEMO-TXN-1762267726322',
    amountPaid: 15000,
    paymentDate: new Date().toISOString(),
    session: '2025-2026',
    
    // CONSOLIDATED Student Details (Used directly in JSX)
    studentId: { 
        name: 'Shaurya Gautam Ghadage', 
        class: '1st', 
        rollNo: 'N/A', 
        studentId: '7857' 
    },
    
    // CONSOLIDATED School Details
    schoolInfo: { 
        name: 'My EduPanel Demo', 
        address: 'Pune' 
    },
    
    // Other properties
    paymentMode: 'NetBanking',
    transactionId: 'SUCCESS',
    collectedByName: 'System',
    totalFeeAmount: 15000,
    currentBalanceDue: 0,
    feeRecordStatus: 'PAID',
};

// Helper Functions (No Change)
const formatCurrency = (amount: number): string => {
    if (isNaN(amount)) return '₹ 0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR',
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount);
};
const formatDate = (dateString: string): string => {
    try {
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-GB', options).replace(/ /g, '-');
    } catch (e) { return 'Invalid Date'; }
};
// ---

const TestFeeReceipt = () => {
    const componentRef = useRef<HTMLDivElement>(null); 
    const transaction = dummyTransaction; 

    // --- FINAL ROBUST PRINT HANDLER (Fixes Visibility/Blank Page) ---
    const handlePrint = () => {
        const printContent = componentRef.current;
        if (!printContent) return;
        
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
                        /* Print CSS rules: Aggressive Reset */
                        @page { size: A4; margin: 15mm; }
                        
                        body, html { 
                            margin: 0 !important; 
                            padding: 0 !important; 
                            width: 100vw;
                            height: 100vh;
                            overflow: hidden; 
                            background-color: white !important;
                            color: black !important;
                        }
                        
                        /* Force visibility of the main printable content area and its children */
                        .receiptContent {
                            visibility: visible !important;
                            display: block !important;
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 100% !important;
                            min-height: auto !important;
                            max-height: 290mm; 
                            box-shadow: none !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            color: black !important;
                        }
                        .receiptContent *, .receiptContent {
                           visibility: visible !important;
                           display: block !important;
                           color: inherit !important;
                           background-color: transparent !important;
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
        
        setTimeout(() => {
            printWindow.focus(); 
            printWindow.print(); 
            printWindow.close(); 
        }, 500); 
    };
    
    // Yahan hum sirf dummy download function de rahe hain
    const handleDownloadPDF = () => {
       alert("PDF Download functionality is disabled for this test receipt.");
    };

    // --- JSX RENDER ---
    return (
        <div className={styles.receiptContainer}>
            {/* --- Action Buttons (Print and Download) --- */}
            <div className={styles.actions}>
                <button onClick={handleDownloadPDF} className={styles.printButton}><FiDownload /> Download PDF</button>
                <button onClick={handlePrint} className={styles.printButton}>
                    <FiPrinter /> Print Receipt (TEST)
                </button>
            </div>
            
            {/* Printable Content Area */}
            <div className={styles.receiptContent} ref={componentRef}>
                <header className={styles.header}>
                    <h1>{transaction.schoolInfo.name}</h1>
                    <p>{transaction.schoolInfo.address}</p>
                </header>
                
                <div className={styles.studentInfo}>
                    <p><strong>Receipt No:</strong> {transaction.receiptId}</p>
                    <p><strong>Date:</strong> {formatDate(transaction.paymentDate)}</p>
                    <p><strong>Session:</strong> {transaction.session}</p>
                    <hr/>
                    <p><strong>Student Name:</strong> {transaction.studentId.name}</p>
                    <p><strong>Student ID:</strong> {transaction.studentId.studentId}</p>
                    <p><strong>Class:</strong> {transaction.studentId.class}</p>
                    <p><strong>Amount Paid:</strong> {formatCurrency(transaction.amountPaid)}</p>
                    <p style={{marginTop: '20px'}}>**THIS IS A TEST RECEIPT**</p>
                </div>
            </div>
        </div>
    );
};

export default TestFeeReceipt;
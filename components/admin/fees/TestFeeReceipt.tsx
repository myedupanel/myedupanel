// File: components/admin/fees/TestFeeReceipt.tsx (FINAL FIX FOR BLANK PREVIEW)
"use client";
import React, { useRef } from 'react';
// SCSS file import
import styles from './TestPrintStyles.module.scss'; 
import { FiPrinter, FiDownload } from 'react-icons/fi';

// Dummy data structure (Minimal for this test)
const dummyTransaction = {
    receiptId: 'DEMO-TXN-1762267726322',
    schoolName: 'My EduPanel Demo',
    studentName: 'Shaurya Gautam Ghadage',
    amountPaid: 15000,
    paymentDate: new Date().toISOString(),
    session: '2025-2026',
    studentId: '7857',
};

// Helper Functions (No Change)
const formatCurrency = (amount: number): string => {
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

    // Yahan hum sirf dummy download function de rahe hain
    const handleDownloadPDF = () => {
       alert("PDF Download functionality is disabled for this test receipt.");
    };

    // --- FINAL ROBUST PRINT HANDLER (Fixes Visibility/Blank Page) ---
    const handlePrint = () => {
        const printContent = componentRef.current;
        if (!printContent) return;
        
        const printWindow = window.open('', '', 'height=800,width=800');
        if (!printWindow) return; 

        // 1. Original document se saare stylesheets/styles collect karein (CRUCIAL FIX)
        let stylesToInject = '';
        const links = document.querySelectorAll('link[rel="stylesheet"], style');
        links.forEach(link => {
            stylesToInject += link.outerHTML; 
        });

        // 2. Naye window ke liye HTML construct karein (Blank page aur 2-page fix)
        const htmlContent = `
            <html>
                <head>
                    <title>Fee Receipt - ${dummyTransaction.receiptId}</title>
                    ${stylesToInject} 
                    <style>
                        /* --- INJECTED STYLES: AGGRESSIVE RESET --- */
                        @page { size: A4; margin: 15mm; }
                        
                        body, html { 
                            margin: 0 !important; 
                            padding: 0 !important; 
                            width: 100vw;
                            height: 100vh;
                            overflow: hidden; 
                            background-color: white !important;
                        }

                        /* Hide everything in the popup window initially */
                        body * {
                             visibility: hidden;
                             display: none;
                        }
                        
                        /* Force visibility of the main printable content area and its children */
                        .receiptContent {
                            visibility: visible !important;
                            display: block !important;
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            min-height: auto !important;
                            max-height: 290mm; /* A4 constraint */
                            box-shadow: none !important;
                            color: black !important; /* Ensure text is visible */
                        }
                        .receiptContent * {
                           visibility: visible !important;
                           display: block !important;
                           color: inherit !important;
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
                    <h1>{dummyTransaction.schoolName}</h1>
                    <p>Pune</p>
                </header>
                
                <div className={styles.studentInfo}>
                    <p><strong>Receipt No:</strong> {dummyTransaction.receiptId}</p>
                    <p><strong>Date:</strong> {formatDate(dummyTransaction.paymentDate)}</p>
                    <p><strong>Session:</strong> {dummyTransaction.session}</p>
                    <hr/>
                    <p><strong>Student Name:</strong> {dummyTransaction.studentName}</p>
                    <p><strong>Student ID:</strong> {dummyTransaction.studentId}</p>
                    <p><strong>Amount Paid:</strong> {formatCurrency(dummyTransaction.amountPaid)}</p>
                    <p style={{marginTop: '20px'}}>**THIS IS A TEST RECEIPT**</p>
                </div>
            </div>
        </div>
    );
};

export default TestFeeReceipt;
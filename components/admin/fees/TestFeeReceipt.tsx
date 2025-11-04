// File: components/admin/fees/TestFeeReceipt.tsx (FINAL CLEANED CODE)

"use client";
import React, { useRef } from 'react';
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

        // 1. Content ko clone karo aur style attribute inject karo
        const contentClone = printContent.cloneNode(true) as HTMLElement;
        // Print preview mein visibility ensure karne ke liye inline style lagao
        contentClone.style.cssText = 'width: 100%; box-sizing: border-box; visibility: visible !important;'; 

        const printWindow = window.open('', '_blank', 'height=800,width=800');
        if (!printWindow) return; 

        // 2. Original document se saare stylesheets/styles collect karein
        let stylesToInject = '';
        const links = document.querySelectorAll('link[rel="stylesheet"], style');
        links.forEach(link => {
            stylesToInject += link.outerHTML; 
        });

        // 3. Naye window ke liye HTML construct karein
        const htmlContent = `
            <html>
                <head>
                    <title>Fee Receipt - ${dummyTransaction.receiptId}</title>
                    ${stylesToInject} 
                    <style>
                        /* Print CSS rules: Aggressive Reset */
                        @page { size: A4; margin: 15mm; }
                        
                        body, html { 
                            margin: 0 !important; 
                            padding: 0 !important; 
                            width: 100vw;
                            /* 2-page fix: height ko constrain karte hain */
                            height: 100vh;
                            overflow: hidden; 
                            background-color: white !important;
                            visibility: hidden;
                        }
                        /* Content aur uske sabhi children ko visible karo */
                        .receiptContent, .receiptContent * {
                           visibility: visible !important;
                        }
                    </style>
                </head>
                <body>
                    ${contentClone.outerHTML} 
                </body>
            </html>
        `;

        // 4. Content likhein aur print trigger karein delay ke saath
        printWindow.document.write(htmlContent);
        printWindow.document.close(); 
        
        setTimeout(() => {
            printWindow.focus(); 
            printWindow.print(); 
            printWindow.close(); 
        }, 500); 
    };
    // --- END FINAL PRINT HANDLER ---


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
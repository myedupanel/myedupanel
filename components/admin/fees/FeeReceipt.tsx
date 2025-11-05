// File: FeeReceipt.tsx (NEW LAYOUT - As per your plan)

import React, { useRef } from 'react';
import styles from './FeeReceipt.module.scss';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Interface Definitions (No Change) ---
export interface SchoolInfo {
    name?: string; address?: string; logo?: string;
    session?: string; phone?: string; email?: string;
}
export interface StudentInfo {
    id: number; name: string; studentId?: string;
    class?: string; rollNo?: string;
}
export interface TemplateInfo {
    id: number; name: string;
    items: { name: string; amount: number }[];
    totalAmount: number;
}
export interface FeeRecordInfo {
    id: number; discount?: number; lateFine?: number;
}
export interface CollectorInfo {
    name: string;
}
export interface Transaction {
    id: number;
    receiptId: string;
    studentId?: StudentInfo | any; 
    templateId?: TemplateInfo | any;
    feeRecordId?: FeeRecordInfo | string;
    collectedBy?: CollectorInfo;
    schoolInfo?: SchoolInfo;
    amountPaid: number;
    paymentMode: string;
    paymentDate: string;
    notes?: string;
    status: 'Success' | 'Pending' | 'Failed';
    transactionId?: string;
    chequeNumber?: string;
    bankName?: string;
    walletName?: string;
    gatewayMethod?: string;
    studentName?: string;
    className?: string;
    studentRegId?: string;
    templateName?: string;
    collectedByName?: string;
    totalFeeAmount?: number;
    discountGiven?: number;
    lateFineApplied?: number;
    currentBalanceDue?: number; 
    feeRecordStatus?: string;
}
export type ReceiptData = Transaction;

interface FeeReceiptProps {
    transaction: Transaction | null;
}

// --- Helper Functions (No Change) ---
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
// ---

// --- MAIN COMPONENT DECLARATION (CORRECTED) ---
const FeeReceipt: React.FC<FeeReceiptProps> = ({ transaction }) => {
    const componentRef = useRef<HTMLDivElement>(null); 

    // --- Print & Download Handlers (No Change) ---
    const handlePrint = () => {
        const input = componentRef.current;
        if (!input || !transaction) { alert("Details missing."); return; }
        
        html2canvas(input, { scale: 2.5, useCORS: true, backgroundColor: '#ffffff', width: input.offsetWidth, height: input.offsetHeight } as any).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const printWindow = window.open('', '_blank');
            
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Fee Receipt - ${transaction.receiptId || 'Print'}</title>
                            <style>
                                @page { size: A4 portrait; margin: 0; } 
                                body { margin: 0; padding: 0; } 
                                img { width: 100vw; height: auto; display: block; }
                            </style>
                        </head>
                        <body><img src="${imgData}" /></body>
                    </html>
                `);
                printWindow.document.close();
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
            alert("Could not generate print preview.");
        });
    };
    
    const handleDownloadPDF = () => {
        const input = componentRef.current;
        if (!input) { alert("Could not find receipt content to download."); return; }

        input.classList.add(styles.printing);

        html2canvas(input, { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' } as any).then(canvas => {
            input.classList.remove(styles.printing);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4'); 
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = (pdf as any).getImageProperties(imgData); 
            const imgRatio = imgProps.height / imgProps.width;
            const margin = 10; 
            let imgWidth = pdfWidth - (margin * 2);
            let imgHeight = imgWidth * imgRatio;
            if (imgHeight > pdfHeight - (margin * 2)) {
                imgHeight = pdfHeight - (margin * 2);
                imgWidth = imgHeight / imgRatio;
            }
            const x = (pdfWidth - imgWidth) / 2; 
            const y = margin; 

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save(`FeeReceipt_${transaction?.receiptId || 'download'}.pdf`);
        
        }).catch(err => {
            input.classList.remove(styles.printing);
            console.error("Error downloading PDF:", err);
            alert("Could not download PDF. Please try printing.");
        });
    };
    // --- END ---
    
    if (!transaction) {
        return <div className={styles.noData}>No transaction details available.</div>;
    }

    // --- Data Extraction (No Change) ---
    const schoolInfo = transaction.schoolInfo || {};
    const studentData = transaction.studentId || {}; 
    const templateData = transaction.templateId || {}; 
    
    const receiptNoDisplay = transaction.receiptId || 'N/A';
    const paymentDateDisplay = formatDate(transaction.paymentDate); 
    
    const studentNameDisplay = (studentData as any).name || transaction.studentName || 'N/A';
    const studentRegIdDisplay = (studentData as any).studentId || transaction.studentRegId || 'N/A';
    const classDisplay = (studentData as any).class || transaction.className || 'N/A';
    const rollNoDisplay = (studentData as any).rollNo || 'N/A';
    
    const collectedByInfo = transaction.collectedBy;
    const collectedByNameDisplay = collectedByInfo?.name || transaction.collectedByName || (transaction.paymentMode === 'Online' ? 'System (Online)' : 'Admin');
    
    const feeRecordInfo = typeof transaction.feeRecordId === 'object' ? transaction.feeRecordId : undefined;
    
    const feeItems = (templateData as any)?.items || [];
    const templateNameDisplay = (templateData as any)?.name || transaction.templateName || 'Fee Payment';

    const totalDemand = (templateData as any)?.totalAmount || transaction.totalFeeAmount || 0;
    const discount = feeRecordInfo?.discount || transaction.discountGiven || 0;
    const lateFine = feeRecordInfo?.lateFine || transaction.lateFineApplied || 0;
    const netDemand = totalDemand - discount + lateFine;
    const amountPaid = transaction.amountPaid || 0;
    const balanceDue = transaction.currentBalanceDue ?? Math.max(0, netDemand - amountPaid);
    const paymentStatus = (transaction.feeRecordStatus 
        ? transaction.feeRecordStatus.toUpperCase()
        : (transaction.status !== 'Success' ? transaction.status.toUpperCase() : (balanceDue < 0.01 ? 'PAID' : 'PARTIAL'))
    );


    return (
        <div className={styles.receiptContainer}>
            {/* --- Buttons --- */}
            <div className={`${styles.actions} no-print`}>
                <button onClick={handleDownloadPDF} className={styles.downloadButton}><FiDownload /> Download PDF</button>
                <button onClick={handlePrint} className={styles.printButton}><FiPrinter /> Print Receipt</button>
            </div>
            {/* --- END --- */}


            {/* --- Receipt Content JSX (NEW LAYOUT) --- */}
            <div id="printable-receipt" className={styles.receiptContent} ref={componentRef}>
                
                {/* 1. HEADER (No Change) */}
                <div className={styles.header}>
                    <div className={styles.schoolDetails}>
                        {schoolInfo.logo && (<img src={schoolInfo.logo} alt={`${schoolInfo.name || 'School'} Logo`} className={styles.logo} />)}
                        <h1>{schoolInfo.name || 'My EduPanel'}</h1>
                    </div>
                    <div className={styles.metaHeader}>
                        <p><strong>Receipt No:</strong> {receiptNoDisplay}</p>
                        <p><strong>Date:</strong> {paymentDateDisplay}</p>
                        <p><strong>Session:</strong> {schoolInfo.session || 'N/A'}</p>
                    </div>
                </div>

                {/* 2. Central Title (No Change) */}
                <div className={styles.titleMeta}>
                    <h2>FEE RECEIPT</h2>
                </div>

                {/* 3. Student Details (CHANGED as per your plan) */}
                <section className={styles.detailsSection}>
                    <h3>Student Information</h3>
                    <div className={styles.grid}>
                        <p><strong>Name:</strong> {studentNameDisplay}</p>
                        <p><strong>Student ID:</strong> {studentRegIdDisplay}</p>
                        <p><strong>Class:</strong> {classDisplay}</p>
                        <p><strong>Roll No:</strong> {rollNoDisplay}</p>
                    </div>
                </section>

                {/* === START MAJOR LAYOUT CHANGE === */}
                
                {/* 4. NEW Main Content Wrapper (Left: Table, Right: Payment) */}
                <div className={styles.mainContentWrapper}>

                    {/* Left Column (Fee Table) */}
                    <section className={`${styles.itemsSection} ${styles.mainContentLeft}`}>
                        <h3>Fee Particulars {templateNameDisplay && `(${templateNameDisplay})`}</h3> 
                        <table className={styles.itemsTable}>
                            <thead>
                                <tr>
                                    <th style={{width: '40px'}}>#</th>
                                    <th>Description</th>
                                    <th className={styles.amountCol}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feeItems.length > 0 ? (
                                    feeItems.map((item: { name: string; amount: number }, index: number) => (
                                        <tr key={index}>
                                            <td style={{textAlign: 'center'}}>{index + 1}</td>
                                            <td>{item.name}</td>
                                            <td className={styles.amountCol}>{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td style={{textAlign: 'center'}}>1</td>
                                        <td>{templateNameDisplay}</td>
                                        <td className={styles.amountCol}>{formatCurrency(totalDemand)}</td>
                                    </tr>
                                )}
                                <tr className={`${styles.calcRow} ${styles.subtotal}`}><td></td><td>Sub Total</td><td className={styles.amountCol}>{formatCurrency(totalDemand)}</td></tr>
                                {discount > 0 && <tr className={styles.calcRow}><td></td><td>Discount (-)</td><td className={styles.amountCol}>{formatCurrency(discount)}</td></tr>}
                                {lateFine > 0 && <tr className={styles.calcRow}><td></td><td>Late Fine (+)</td><td className={styles.amountCol}>{formatCurrency(lateFine)}</td></tr>}
                                <tr className={`${styles.calcRow} ${styles.grandTotal}`}><td></td><td>Net Payable</td><td className={styles.amountCol}>{formatCurrency(netDemand)}</td></tr>
                            </tbody>
                        </table>
                    </section>

                    {/* Right Column (Payment Details) */}
                    <div className={`${styles.paymentBlock} ${styles.mainContentRight}`}>
                        <h3>Payment Details</h3>
                        <div className={styles.grid}>
                            <p><strong>Amount Paid:</strong> <strong className={styles.paidAmount}>{formatCurrency(amountPaid)}</strong></p>
                            <p><strong>Payment Mode:</strong> {transaction.paymentMode || 'N/A'}</p>
                            {transaction.notes && <p className={styles.notes}><strong>Remarks:</strong> {transaction.notes}</p>}
                        </div>
                    </div>
                </div>

                {/* 5. NEW Centered Balance Due Wrapper */}
                <div className={styles.balanceWrapper}>
                    <div className={styles.balanceBlock}>
                        <section className={styles.balanceSection}>
                            <p><strong>Balance Due:</strong> 
                                <span className={styles.balanceAmount} data-balance-zero={balanceDue < 0.01}>{formatCurrency(balanceDue)}</span>
                            </p>
                             {paymentStatus === 'PAID' ? ( <div className={styles.paidStamp}>PAID</div> ) :
                               (<div className={`${styles.statusBadge} ${styles[paymentStatus.toLowerCase()]}`}>{paymentStatus}</div>)
                             }
                        </section>
                    </div>
                </div>
                
                {/* === END MAJOR LAYOUT CHANGE === */}


                {/* 6. Footer (No Change) */}
                <footer className={styles.footer}>
                     <p className={styles.receivedBy}>Received By: {collectedByNameDisplay}</p>
                    
                    {/* Signature Area (Space for lines) */}
                    <div className={styles.signatureArea}>
                        <span className={styles.signatureBox}></span>
                        <span className={styles.signatureBox}></span>
                    </div>
                    
                    {/* Signature Labels (Aligned below lines) */}
                     <div className={styles.signatureLabels}>
                         <p className={styles.cashierLabel}>Accountant / Cashier</p>
                         <p className={styles.signatoryLabel}>Authorised Signatory</p>
                     </div>
                    <p className={styles.footerNote}>
                        This is a computer-generated receipt {transaction.paymentMode !== 'Online' ? 'and requires a signature.' : 'and does not require a signature if paid online.'}
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default FeeReceipt;
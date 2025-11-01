import React, { useRef } from 'react';
import styles from './FeeReceipt.module.scss';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print'; // Ensure this is installed
// import { Transaction as FeeTransaction } from '@/components/types/fees'; // Iski zaroorat nahi

// --- Interface Definitions for Populated Data ---
interface SchoolInfo {
    name?: string; address?: string; logo?: string;
    session?: string; phone?: string; email?: string;
}
interface StudentInfo {
    id: string; name: string; studentId?: string; // Custom ID
    class?: string; rollNo?: string;
}
interface TemplateInfo {
    id: string; name: string;
    items: { name: string; amount: number }[];
    totalAmount: number;
}
interface FeeRecordInfo {
    id: string; discount?: number; lateFine?: number;
}
interface CollectorInfo {
    name: string;
}

// --- FIX 1: Main Transaction Interface ko update kiya ---
// Ismein humne backend se aane waale naye fields add kiye hain
interface Transaction {
    id: string;
    receiptId: string;
    studentId?: StudentInfo;
    templateId?: TemplateInfo;
    feeRecordId?: FeeRecordInfo | string;
    collectedBy?: CollectorInfo;
    schoolInfo?: SchoolInfo;

    amountPaid: number;
    paymentMode: string;
    paymentDate: string; // ISO String or Date
    notes?: string;
    status: 'Success' | 'Pending' | 'Failed';

    // Conditional Payment Details
    transactionId?: string;
    chequeNumber?: string;
    bankName?: string;
    walletName?: string;
    gatewayMethod?: string;

    // Fallbacks
    studentName?: string;
    className?: string;
    studentRegId?: string;
    templateName?: string;
    collectedByName?: string;
    totalFeeAmount?: number;
    discountGiven?: number;
    lateFineApplied?: number;

    // --- YEH DO FIELDS BUG FIX KE LIYE ZAROORI HAIN ---
    // Yeh backend (feeController) ke getTransactionById se aa rahe hain
    currentBalanceDue?: number; 
    feeRecordStatus?: string;
}
// --- END FIX 1 ---

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

const FeeReceipt: React.FC<FeeReceiptProps> = ({ transaction }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    // --- FIX 2: Print/Download Logic ko robust banaya ---
    
    // Yeh function print se pehle modal backdrop ko dhoondh kar hide karega
    const handleBeforePrint = () => {
        // Alag-alag modal libraries ke common selectors
        const selectors = [
            '[data-modal-backdrop="true"]', // Aapka original selector
            '[data-radix-overlay="true"]',   // shadcn/ui ya Radix
            '.modal-backdrop'                // Bootstrap
        ];
        
        let backdrop: HTMLElement | null = null;
        for (const selector of selectors) {
            backdrop = document.querySelector(selector);
            if (backdrop) break; // Jaise hi mil jaaye, loop rok do
        }

        if (backdrop) {
            backdrop.style.zIndex = 'auto'; // z-index ko temporarily hata do
            console.log("Backdrop found and hidden for printing.");
        } else {
            console.warn("Could not find modal backdrop to hide for printing.");
        }
    };

    // Yeh function print ke baad modal backdrop ko waapas laayega
    const handleAfterPrint = () => {
        const selectors = ['[data-modal-backdrop="true"]', '[data-radix-overlay="true"]', '.modal-backdrop'];
        let backdrop: HTMLElement | null = null;
        for (const selector of selectors) {
            backdrop = document.querySelector(selector);
            if (backdrop) break;
        }
        if (backdrop) {
            backdrop.style.zIndex = '1000'; // Default z-index (ya jo bhi aapka modal use karta hai)
        }
    };

    const handlePrint = useReactToPrint({
        content: () => componentRef.current, // 'body' ko 'content' se update kiya (latest standard)
        documentTitle: `FeeReceipt_${transaction?.receiptId || transaction?.id || 'details'}`,
        pageStyle: `@page { size: A4; margin: 15mm; } @media print { body { -webkit-print-color-adjust: exact; color-adjust: exact; } .no-print { display: none !important; } }`,
        onBeforePrint: handleBeforePrint,
        onAfterPrint: handleAfterPrint,
    });
    // --- END FIX 2 ---
    
    // handleDownload abhi bhi handlePrint ko hi call karega, jo "Print to PDF" dialog kholegal
    const handleDownload = handlePrint; 

    if (!transaction) {
        return <div className={styles.noData}>No transaction details available.</div>;
    }

    // --- Extract Data Safely (No Change) ---
    const schoolInfo = transaction.schoolInfo || {};
    const studentInfo = transaction.studentId;
    const templateInfo = transaction.templateId;
    const feeRecordInfo = typeof transaction.feeRecordId === 'object' ? transaction.feeRecordId : undefined;
    const collectedByInfo = transaction.collectedBy;

    const receiptNoDisplay = transaction.receiptId || 'N/A';
    const paymentDateDisplay = formatDate(transaction.paymentDate); 
    const studentNameDisplay = studentInfo?.name || transaction.studentName || 'N/A';
    const studentRegIdDisplay = studentInfo?.studentId || transaction.studentRegId || 'N/A';
    const classDisplay = studentInfo?.class || transaction.className || 'N/A';
    const rollNoDisplay = studentInfo?.rollNo || 'N/A';
    const collectedByNameDisplay = collectedByInfo?.name || transaction.collectedByName || (transaction.paymentMode === 'Online' ? 'System (Online)' : 'Admin');
    const feeItems = templateInfo?.items || [];
    const templateNameDisplay = templateInfo?.name || transaction.templateName || 'Fee Payment';

    // --- FIX 1: Calculate Amounts (Bug Fix) ---
    const totalDemand = templateInfo?.totalAmount || transaction.totalFeeAmount || 0;
    const discount = feeRecordInfo?.discount || transaction.discountGiven || 0;
    const lateFine = feeRecordInfo?.lateFine || transaction.lateFineApplied || 0;
    const netDemand = totalDemand - discount + lateFine;
    const amountPaid = transaction.amountPaid || 0;

    // YEH DO LINES BUG FIX KARTI HAIN
    // Yeh backend se aa raha hai (e.g., ₹0.00)
    const balanceDue = transaction.currentBalanceDue ?? Math.max(0, netDemand - amountPaid);
    // Yeh backend se aa raha hai (e.g., "Paid")
    const paymentStatus = (transaction.feeRecordStatus 
        ? transaction.feeRecordStatus.toUpperCase()
        : (transaction.status !== 'Success' ? transaction.status.toUpperCase() : (balanceDue < 0.01 ? 'PAID' : 'PARTIAL'))
    );
    // --- END FIX 1 ---

    return (
        <div className={styles.receiptContainer}>
            {/* Action Buttons */}
            <div className={`${styles.actions} no-print`}>
                <button onClick={handleDownload} className={styles.downloadButton}><FiDownload /> Download PDF</button>
                <button onClick={handlePrint} className={styles.printButton}><FiPrinter /> Print Receipt</button>
            </div>

            {/* --- Receipt Content --- */}
            {/* Baaki ka JSX structure waisa hi rakha hai jaisa aapne diya tha */}
            <div id="printable-receipt" className={styles.receiptContent} ref={componentRef}>
                {/* Header */}
                <header className={styles.header}>
                    {schoolInfo.logo && (<img src={schoolInfo.logo} alt={`${schoolInfo.name || 'School'} Logo`} className={styles.logo} />)}
                    <div className={styles.schoolDetails}>
                        <h1>{schoolInfo.name || 'Your School Name'}</h1>
                        <p>{schoolInfo.address || '123 School Street, City, State, Pin'}</p>
                        <p>
                            {schoolInfo.phone && `Ph: ${schoolInfo.phone} | `}
                            {schoolInfo.email && `Email: ${schoolInfo.email}`}
                        </p>
                    </div>
                </header>

                {/* Title and Meta */}
                <div className={styles.titleMeta}>
                    <h2>FEE RECEIPT</h2>
                    <div className={styles.metaInfo}>
                        <p><strong>Receipt No:</strong> {receiptNoDisplay}</p>
                        <p><strong>Date:</strong> {paymentDateDisplay}</p>
                        <p><strong>Session:</strong> {schoolInfo.session || 'N/A'}</p>
                    </div>
                </div>

                {/* Student Details */}
                <section className={styles.detailsSection}>
                    <h3>Student Information</h3>
                    <div className={styles.grid}>
                        <p><strong>Name:</strong> {studentNameDisplay}</p>
                        <p><strong>Student ID:</strong> {studentRegIdDisplay}</p>
                        <p><strong>Class:</strong> {classDisplay}</p>
                        <p><strong>Roll No:</strong> {rollNoDisplay}</p>
                    </div>
                </section>

                {/* Fee Breakdown Table */}
                <section className={styles.itemsSection}>
                    <h3>Fee Particulars {templateInfo?.name && `(${templateInfo.name})`}</h3>
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
                                feeItems.map((item, index) => (
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

                {/* Payment Details */}
                <section className={styles.detailsSection}>
                    <h3>Payment Details</h3>
                    <div className={styles.grid}>
                        <p><strong>Amount Paid:</strong> <strong className={styles.paidAmount}>{formatCurrency(amountPaid)}</strong></p>
                        <p><strong>Payment Mode:</strong> {transaction.paymentMode || 'N/A'}</p>
                        {transaction.paymentMode === 'UPI' && transaction.transactionId && <p><strong>UPI Transaction ID:</strong> {transaction.transactionId}</p>}
                        {/* ... baaki conditional details ... */}
                        {(transaction.paymentMode === 'Cheque' || transaction.paymentMode === 'Draft') && transaction.chequeNumber && <p><strong>{transaction.paymentMode} No:</strong> {transaction.chequeNumber}</p>}
                        {(transaction.paymentMode === 'Cheque' || transaction.paymentMode === 'Draft') && transaction.bankName && <p><strong>Bank Name:</strong> {transaction.bankName}</p>}
                    </div>
                    {transaction.notes && <p className={styles.notes}><strong>Remarks:</strong> {transaction.notes}</p>}
                </section>

                 {/* Balance Summary (Ab yeh sahi data dikhayega) */}
                 <section className={styles.balanceSection}>
                     <p><strong>Balance Due:</strong> <span className={styles.balanceAmount}>{formatCurrency(balanceDue)}</span></p>
                     {/* Ab yeh 'PAID' dikhayega jab balance 0 hoga */}
                     {paymentStatus === 'PAID' ? ( <div className={styles.paidStamp}>PAID</div> ) :
                       (<div className={`${styles.statusBadge} ${styles[paymentStatus.toLowerCase()]}`}>{paymentStatus}</div>)
                     }
                 </section>

                {/* Footer (No Change) */}
                <footer className={styles.footer}>
                     <p className={styles.collectedBy}>Received By: {collectedByNameDisplay}</p>
                    <div className={styles.signatureArea}>
                        <div className={styles.signatureBox}></div>
                        <div className={styles.signatureBox}></div>
                    </div>
                     <div className={styles.signatureLabels}>
                         <p>Accountant / Cashier</p>
                         <p>Authorised Signatory</p>
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
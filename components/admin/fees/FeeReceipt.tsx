// src/components/admin/fees/FeeReceipt.tsx
import React, { useRef } from 'react';
import styles from './FeeReceipt.module.scss';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print'; // Ensure this is installed
import { Transaction as FeeTransaction } from '@/components/types/fees';

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

// --- Main Transaction Interface (Expecting Populated Fields) ---
interface Transaction {
    id: string;
    receiptId: string;
    // Use the specific interfaces for populated fields
    studentId?: StudentInfo; // Expect populated object
    templateId?: TemplateInfo; // Expect populated object
    feeRecordId?: FeeRecordInfo | string; // Optional populated Fee Record or string ID
    collectedBy?: CollectorInfo; // Expect populated object
    schoolInfo?: SchoolInfo; // Expect populated object

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

    // Keep fallbacks ONLY if backend might NOT populate everything
    studentName?: string; // Fallback name
    className?: string; // Fallback class
    studentRegId?: string; // Fallback custom ID
    templateName?: string; // Fallback template name
    collectedByName?: string; // Fallback collector name
    totalFeeAmount?: number; // Fallback total
    discountGiven?: number; // Fallback discount
    lateFineApplied?: number; // Fallback late fine
}

interface FeeReceiptProps {
    transaction: Transaction | null;
}

// --- Helper Functions ---
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

    // ✅ --- FIX YAHAN HAI ---
    
    // Yeh function print se pehle modal ko peeche kar dega
    const handleBeforePrint = () => {
        // Aapke CSS ke hisaab se, backdrop ka class '.backdrop' hai
        const backdrop = document.querySelector('[data-modal-backdrop="true"]') as HTMLElement | null; // <-- SELECTOR UPDATE KIYA
        if (backdrop) {
            backdrop.style.zIndex = 'auto'; // z-index ko temporarily hata do
        }
    };

    // Yeh function print ke baad modal ko waapas upar le aayega
    const handleAfterPrint = () => {
        const backdrop = document.querySelector('[data-modal-backdrop="true"]') as HTMLElement | null; // <-- SELECTOR UPDATE KIYA
        if (backdrop) {
            backdrop.style.zIndex = '1000'; // z-index ko waapas set kar do
        }
    };

    const handlePrint = useReactToPrint({
        body: () => componentRef.current,
        documentTitle: `FeeReceipt_${transaction?.receiptId || transaction?.id || 'details'}`,
        pageStyle: `@page { size: A4; margin: 20mm; } @media print { body { -webkit-print-color-adjust: exact; color-adjust: exact; } .no-print { display: none !important; } }`,
        
        // ✅ HOOKS UPDATE KIYE HAIN
        onBeforePrint: () => handleBeforePrint(), // 'onBeforePrint' istemaal karein
        onAfterPrint: () => handleAfterPrint(),

    } as any); // TypeScript error ke liye 'as any'
    // --- FIX KHATAM ---
    
    const handleDownload = handlePrint;

    if (!transaction) {
        return <div className={styles.noData}>No transaction details available.</div>;
    }

    // --- Extract Data Safely (Type assertion helps TS) ---
    const schoolInfo = transaction.schoolInfo || {};
    const studentInfo = transaction.studentId; // Will be StudentInfo | undefined
    const templateInfo = transaction.templateId; // Will b
    const feeRecordInfo = typeof transaction.feeRecordId === 'object' ? transaction.feeRecordId : undefined;
    const collectedByInfo = transaction.collectedBy; // Will be CollectorInfo | undefined

    const receiptNoDisplay = transaction.receiptId || 'N/A';
    const paymentDateDisplay = formatDate(transaction.paymentDate); 
    const studentNameDisplay = studentInfo?.name || transaction.studentName || 'N/A';
    const studentRegIdDisplay = studentInfo?.studentId || transaction.studentRegId || 'N/A';
    const classDisplay = studentInfo?.class || transaction.className || 'N/A';
    const rollNoDisplay = studentInfo?.rollNo || 'N/A';
    const collectedByNameDisplay = collectedByInfo?.name || transaction.collectedByName || (transaction.paymentMode === 'Online' ? 'System (Online)' : 'Admin');
    const feeItems = templateInfo?.items || [];
    const templateNameDisplay = templateInfo?.name || transaction.templateName || 'Fee Payment';

    // --- Calculate Amounts ---
    const totalDemand = templateInfo?.totalAmount || transaction.totalFeeAmount || 0;
    const discount = feeRecordInfo?.discount || transaction.discountGiven || 0;
    const lateFine = feeRecordInfo?.lateFine || transaction.lateFineApplied || 0;
    const netDemand = totalDemand - discount + lateFine;
    const amountPaid = transaction.amountPaid || 0;
    const balanceDue = Math.max(0, netDemand - amountPaid);
    const paymentStatus = transaction.status !== 'Success'
        ? transaction.status.toUpperCase()
        : (balanceDue < 0.01 ? 'PAID' : 'PARTIAL');

    return (
        <div className={styles.receiptContainer}>
            {/* Action Buttons */}
            <div className={`${styles.actions} no-print`}>
                <button onClick={handleDownload} className={styles.downloadButton}><FiDownload /> Download PDF</button>
                <button onClick={handlePrint} className={styles.printButton}><FiPrinter /> Print Receipt</button>
            </div>

            {/* --- Receipt Content --- */}
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
                    <h3>Fee Particulars {templateInfo?.name && `(${templateInfo.name})`}</h3> {/* Use optional chaining */}
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
                        {/* Conditional details */}
                        {transaction.paymentMode === 'UPI' && transaction.transactionId && <p><strong>UPI Transaction ID:</strong> {transaction.transactionId}</p>}
                        {transaction.paymentMode === 'Card' && transaction.transactionId && <p><strong>Card Transaction Ref:</strong> {transaction.transactionId}</p>}
                        {transaction.paymentMode === 'NetBanking' && transaction.transactionId && <p><strong>NetBanking Ref No:</strong> {transaction.transactionId}</p>}
                        {(transaction.paymentMode === 'Cheque' || transaction.paymentMode === 'Draft') && transaction.chequeNumber && <p><strong>{transaction.paymentMode} No:</strong> {transaction.chequeNumber}</p>}
                        {(transaction.paymentMode === 'Cheque' || transaction.paymentMode === 'Draft') && transaction.bankName && <p><strong>Bank Name:</strong> {transaction.bankName}</p>}
                        {transaction.paymentMode === 'Wallet' && transaction.walletName && <p><strong>Wallet Name:</strong> {transaction.walletName}</p>}
                        {transaction.paymentMode === 'Wallet' && transaction.transactionId && <p><strong>Wallet Transaction ID:</strong> {transaction.transactionId}</p>}
                        {transaction.gatewayMethod && <p><strong>Gateway Method:</strong> {transaction.gatewayMethod}</p>}
                    </div>
                    {transaction.notes && <p className={styles.notes}><strong>Remarks:</strong> {transaction.notes}</p>}
                </section>

                 {/* Balance Summary */}
                 <section className={styles.balanceSection}>
                     <p><strong>Balance Due:</strong> <span className={styles.balanceAmount}>{formatCurrency(balanceDue)}</span></p>
                     {paymentStatus === 'PAID' ? ( <div className={styles.paidStamp}>PAID</div> ) :
                       (<div className={`${styles.statusBadge} ${styles[paymentStatus.toLowerCase()]}`}>{paymentStatus}</div>)
                     }
                 </section>

                {/* Footer (Ab yeh .scss file se style lega) */}
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
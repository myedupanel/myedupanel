import React, { useRef } from 'react';
import styles from './FeeReceipt.module.scss';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';

// --- Interface Definitions (No Change - Keeping your exported types) ---
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

// --- Transaction Interface (No Change - Keeping your exported types) ---
export interface Transaction {
    id: number;
    receiptId: string;
    studentId?: StudentInfo;
    templateId?: TemplateInfo;
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

// Export the ReceiptData type alias
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

const FeeReceipt: React.FC<FeeReceiptProps> = ({ transaction }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    // --- FIX: Print Hiding Logic ---

    const getBackdropElement = (): HTMLElement | null => {
        // Most common selectors for modal backdrops (overlay)
        const selectors = [
            '[role="dialog"][aria-modal="true"]', // Generic modal wrapper (often contains backdrop)
            '.modal-backdrop', // Bootstrap/Generic CSS class
            '.MuiBackdrop-root', // Material UI
            '[data-modal-backdrop="true"]', // Custom attribute
            '.ant-modal-mask', // Ant Design
            'body > div:last-child[style*="z-index"]', // Fallback for overlays
        ];
        
        let backdrop: HTMLElement | null = null;
        for (const selector of selectors) {
            backdrop = document.querySelector(selector);
            if (backdrop) {
                // If the element is found, check if it's visible (optional safety check)
                if (window.getComputedStyle(backdrop).display !== 'none') {
                    return backdrop;
                }
            }
        }
        return null;
    };

    const handleBeforePrint = () => {
        const backdrop = getBackdropElement();
        if (backdrop) {
            // Temporarily hide the backdrop before the native print dialog opens
            backdrop.style.display = 'none';
        }
        // Small delay to ensure DOM update takes effect (if needed)
        return Promise.resolve();
    };

    const handleAfterPrint = () => {
        // Restore the backdrop after the print dialog is closed
        const backdrop = getBackdropElement();
        if (backdrop) {
            backdrop.style.display = ''; // Revert to default display style
        }
    };
    
    const getPrintPageStyle = () => {
         return `
            @page { 
                size: A4; 
                margin: 15mm; 
            } 
            
            @media print { 
                body { 
                    -webkit-print-color-adjust: exact; 
                    color-adjust: exact; 
                }
                
                /* CRITICAL: Hides everything except the receipt content */
                body > * {
                    visibility: hidden;
                    display: none !important;
                }
                
                /* ...SIRF receipt content ko chhodkar */
                #printable-receipt {
                    visibility: visible !important;
                    display: block !important;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                }
                
                /* Receipt ke andar ke .no-print elements ko hide karo */
                .no-print { 
                    display: none !important; 
                }
            }
        `;
    };


    const handlePrint = useReactToPrint({
        content: () => componentRef.current, 
        documentTitle: `FeeReceipt_${transaction?.receiptId || transaction?.id || 'details'}`,
        pageStyle: getPrintPageStyle(),
        onBeforePrint: handleBeforePrint, // <-- Backdrop hiding function
        onAfterPrint: handleAfterPrint,   // <-- Backdrop restoring function
    } as any);
    // --- END FIX ---
    
    const handleDownload = handlePrint; 

    if (!transaction) {
        return <div className={styles.noData}>No transaction details available.</div>;
    }

    // --- Data Extraction (No Change) ---
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

    // --- Amount Calculation (No Change) ---
    const totalDemand = templateInfo?.totalAmount || transaction.totalFeeAmount || 0;
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
            {/* Action Buttons (No Change) */}
            <div className={`${styles.actions} no-print`}>
                <button onClick={handleDownload} className={styles.downloadButton}><FiDownload /> Download PDF</button>
                <button onClick={handlePrint} className={styles.printButton}><FiPrinter /> Print Receipt</button>
            </div>

            {/* --- Receipt Content (No Change in JSX) --- */}
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
                        {(transaction.paymentMode === 'Cheque' || transaction.paymentMode === 'Draft') && transaction.chequeNumber && <p><strong>{transaction.paymentMode} No:</strong> {transaction.chequeNumber}</p>}
                        {(transaction.paymentMode === 'Cheque' || transaction.paymentMode === 'Draft') && transaction.bankName && <p><strong>Bank Name:</strong> {transaction.bankName}</p>}
                    </div>
                    {transaction.notes && <p className={styles.notes}><strong>Remarks:</strong> {transaction.notes}</p>}
                </section>

                 {/* Balance Summary (Bug-fixed) */}
                 <section className={styles.balanceSection}>
                     <p><strong>Balance Due:</strong> 
                        <span 
                            className={styles.balanceAmount} 
                            data-balance-zero={balanceDue < 0.01}
                        >
                            {formatCurrency(balanceDue)}
                        </span>
                    </p>
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
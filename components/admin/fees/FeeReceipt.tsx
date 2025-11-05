// --- YAHAN FIX KIYA (1/4): useEffect aur useState ko import kiya ---
import React, { useRef, useState, useEffect } from 'react';
import styles from './FeeReceipt.module.scss';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// --- YAHAN FIX KIYA (2/4): api ko import kiya ---
import api from '@/backend/utils/api'; 

// --- Interface Definitions (No Change) ---
export interface SchoolInfo {
    name?: string;
    name2?: string; // <-- Yeh pehle se tha (sahi hai)
    address?: string; 
    logo?: string;
    session?: string; 
    phone?: string; 
    email?: string;
    // --- YEH BHI ADD KAR RAHA HOON (Consistency ke liye) ---
    udiseNo?: string;
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
    schoolInfo?: SchoolInfo; // <-- Yeh SchoolInfo upar waale interface ko use karta hai
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
    
    // --- YAHAN FIX KIYA (3/4): School details ko fetch karne ke liye state banaya ---
    const [schoolDetails, setSchoolDetails] = useState<SchoolInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSchoolProfile = async () => {
            setIsLoading(true);
            try {
                const res = await api.get('/api/school/profile');
                setSchoolDetails(res.data);
            } catch (err) {
                console.error("Failed to fetch school profile for receipt", err);
                // Agar fetch fail ho, toh prop se fallback karein
                setSchoolDetails(transaction?.schoolInfo || {});
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchSchoolProfile();
    }, [transaction?.schoolInfo]); // 'transaction' par depend karein
    // --- FIX ENDS HERE ---


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
            
            // A4 page ke dimensions (210x297mm) par fit karne ka logic
            let imgWidth = pdfWidth;
            let imgHeight = imgWidth * imgRatio;
            
            if (imgHeight > pdfHeight) {
                imgHeight = pdfHeight;
                imgWidth = imgHeight / imgRatio;
            }

            const x = (pdfWidth - imgWidth) / 2; 
            const y = 0; // Top se start

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save(`FeeReceipt_${transaction?.receiptId || 'download'}.pdf`);
        
        }).catch(err => {
            input.classList.remove(styles.printing);
            console.error("Error downloading PDF:", err);
            alert("Could not download PDF. Please try printing.");
        });
    };
    // --- END ---
    
    // --- Loading states updated ---
    if (!transaction || isLoading) {
        return <div className={styles.noData}>Loading Receipt Data...</div>;
    }

    // --- Data Extraction (No Change) ---
    // const schoolInfo = transaction.schoolInfo || {}; // 'schoolDetails' state use hoga
    const studentData = transaction.studentId || {}; 
    const templateData = transaction.templateId || {}; 
    
    const receiptNoDisplay = transaction.receiptId || 'N/A';
    const paymentDateDisplay = formatDate(transaction.paymentDate); 
    
    const studentNameDisplay = (studentData as any).name || transaction.studentName || 'N/A';
    // const studentRegIdDisplay = (studentData as any).studentId || transaction.studentRegId || 'N/A'; // Removed
    // const classDisplay = (studentData as any).class || transaction.className || 'N/A'; // Removed
    
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


    // =================================================================
    // === YAHAN BADA BADLAAV KIYA GAYA HAI ===
    // Ek internal component banaya taaki JSX ko repeat na karna pade
    // Is component ko saare upar ke variables automatically mil jayenge
    // =================================================================
    const InternalReceipt = ({ copyType }: { copyType: string }) => {
        return (
            <div className={styles.receiptCopy}>
                {/* 1. Header (School Details) */}
                <div className={styles.header}>
                    <div className={styles.schoolDetails}>
                        {schoolDetails?.logo && (<img src={schoolDetails.logo} alt={`${schoolDetails.name || 'School'} Logo`} className={styles.logo} />)}
                        <div>
                            {/* Ab yeh 'name2' (Certificate Name) ko state se dikhayega */}
                            <h1>{schoolDetails?.name2 || schoolDetails?.name || 'My EduPanel'}</h1>
                            <p>{schoolDetails?.address || 'School Address'}</p>
                        </div>
                    </div>
                    <div className={styles.metaHeader}>
                        <p><strong>Receipt No:</strong> {receiptNoDisplay}</p>
                        <p><strong>Date:</strong> {paymentDateDisplay}</p>
                        <p><strong>Session:</strong> {schoolDetails?.session || 'N/A'}</p>
                    </div>
                </div>

                {/* 2. Central Title (Blueprint ke jaisa) */}
                <div className={styles.titleMeta}>
                    <span className={styles.copyType}>{copyType}</span>
                    <h2>FEE RECEIPT</h2>
                    <span className={styles.scissorLine}>&#x2702;</span>
                </div>

                {/* 5. Items Table (NEW LAYOUT) */}
                <section className={`${styles.itemsSection}`}>
                    <table className={styles.itemsTable}>
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>#</th>
                                {/* Blueprint ke hisaab se columns badle gaye */}
                                <th>STUDENT INFORMATION</th>
                                <th>FEE PARTICULARS</th>
                                <th className={styles.amountCol}>AMOUNT</th>
                                <th className={styles.amountCol}>AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Student ka naam ab table ke andar hai */}
                            <tr className={styles.studentNameRow}>
                                <td style={{ textAlign: 'center' }}>1</td>
                                <td>{studentNameDisplay}</td>
                                <td>{templateNameDisplay}</td>
                                <td className={styles.amountCol}></td>
                                <td className={styles.amountCol}></td>
                            </tr>
                            
                            {/* Baaki fee items */}
                            {feeItems.length > 0 ? (
                                feeItems.map((item: { name: string; amount: number }, index: number) => (
                                    <tr key={index}>
                                        <td style={{ textAlign: 'center' }}>{index + 2}</td>
                                        <td>{item.name}</td>
                                        <td></td>
                                        <td className={styles.amountCol}>{formatCurrency(item.amount)}</td>
                                        <td className={styles.amountCol}></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td style={{ textAlign: 'center' }}>2</td>
                                    <td>{templateNameDisplay}</td>
                                    <td></td>
                                    <td className={styles.amountCol}>{formatCurrency(totalDemand)}</td>
                                    <td className={styles.amountCol}></td>
                                </tr>
                            )}
                            
                            {/* Calculations (Ab table ke andar) */}
                            <tr className={`${styles.calcRow} ${styles.subtotal}`}>
                                <td></td><td></td>
                                <td>Sub Total</td>
                                <td></td>
                                <td className={styles.amountCol}>{formatCurrency(totalDemand)}</td>
                            </tr>
                            {discount > 0 && (
                                <tr className={styles.calcRow}>
                                    <td></td><td></td>
                                    <td>Discount (-)</td>
                                    <td></td>
                                    <td className={styles.amountCol}>{formatCurrency(discount)}</td>
                                </tr>
                            )}
                            {lateFine > 0 && (
                                <tr className={styles.calcRow}>
                                    <td></td><td></td>
                                    <td>Late Fine (+)</td>
                                    <td></td>
                                    <td className={styles.amountCol}>{formatCurrency(lateFine)}</td>
                                </tr>
                            )}
                            <tr className={`${styles.calcRow} ${styles.grandTotal}`}>
                                <td></td><td></td>
                                <td>Net Payable</td>
                                <td></td>
                                <td className={styles.amountCol}>{formatCurrency(netDemand)}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                {/* 6. Payment Details & Balance (MERGED) */}
                <div className={`${styles.paymentBlock}`}>
                    <div className={styles.grid}>
                        {/* Item 1 */}
                        <p><strong>Amount Paid:</strong> <strong className={styles.paidAmount}>{formatCurrency(amountPaid)}</strong></p>
                        
                        {/* Item 2 */}
                        <p><strong>Payment Mode:</strong> {transaction.paymentMode || 'N/A'}</p>
                        
                        {/* Item 3 (MOVED HERE) */}
                        <div className={styles.balanceWrapper}> {/* Wrapper for alignment */}
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

                        {/* Item 4 (Conditional, ab full width lega) */}
                        {transaction.notes && (
                            <p className={`${styles.notes} ${styles.fullWidth}`}>
                                <strong>Remarks:</strong> {transaction.notes}
                            </p>
                        )}
                    </div>
                </div>

                {/* 7. Balance Due Wrapper (YAHAN SE HATA DIYA GAYA) */}
                
                {/* // ========================================================
                // === YAHAN BADLAAV KIYA GAYA HAI (Footer) ===
                // Footer ko blueprint ('image_61051c.jpg') jaisa banaya hai
                // ========================================================
                */}
                <footer className={styles.footer}>
                    {/* Yeh naya div 'Received By' aur 'Signature' ko ek line mein rakhega */}
                    <div className={styles.footerMain}>
                        <p className={styles.receivedBy}>Received By: {collectedByNameDisplay}</p>
                        
                        {/* Yeh right-side ka block hai */}
                        <div className={styles.signatureBlock}>
                            <div className={styles.signatureBox}>
                                {/* Blueprint wala signature stamp/image yahan aa sakta hai */}
                            </div>
                            <p className={styles.signatoryLabel}>Authorised Signatory</p>
                        </div>
                    </div>

                    {/* Yeh neeche wali computer-generated line hai */}
                    <p className={styles.footerNote}>
                        This is a computer-generated receipt {transaction.paymentMode !== 'Online' ? 'and requires a signature.' : 'and does not require a signature if paid online.'}
                    </p>
                </footer>
                {/* === FOOTER FIX ENDS === */}

            </div>
        );
    };
    // === INTERNAL COMPONENT ENDS ===


    return (
        <div className={styles.receiptContainer}>
            {/* --- Buttons (No Change) --- */}
            <div className={`${styles.actions} no-print`}>
                <button onClick={handleDownloadPDF} className={styles.downloadButton}><FiDownload /> Download PDF</button>
                <button onClick={handlePrint} className={styles.printButton}><FiPrinter /> Print Receipt</button>
            </div>
            {/* --- END --- */}


            {/* --- Receipt Content JSX (NEW LAYOUT) --- */}
            {/* Yeh 'receiptSheetA4' A4 size ka container hai */}
            {/* componentRef ab ispar laga hai */}
            <div id="printable-receipt" className={styles.receiptSheetA4} ref={componentRef}>
                
                {/* Pehli Copy */}
                <InternalReceipt copyType="SCHOOL COPY" />
                
                {/* Dono ke beech ka separator */}
                <hr className={styles.separator} />
                
                {/* Doosri Copy */}
                <InternalReceipt copyType="STUDENT COPY" />

            </div>
        </div>
    );
};

export default FeeReceipt;
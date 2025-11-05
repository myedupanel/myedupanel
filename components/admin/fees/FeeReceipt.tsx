// --- Imports (Aapke original code se 4 imports add kiye gaye) ---
import React, { useRef, useState, useEffect } from 'react';
import styles from './FeeReceipt.module.scss';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '@/backend/utils/api'; 

// --- Interfaces (Koi badlaav nahi) ---
export interface SchoolInfo {
    name?: string; name2?: string; address?: string; 
    logo?: string; session?: string;  phone?: string; 
    email?: string; udiseNo?: string;
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
    id: number; receiptId: string;
    studentId?: StudentInfo | any; 
    templateId?: TemplateInfo | any;
    feeRecordId?: FeeRecordInfo | string;
    collectedBy?: CollectorInfo;
    schoolInfo?: SchoolInfo;
    amountPaid: number; paymentMode: string; paymentDate: string;
    notes?: string; status: 'Success' | 'Pending' | 'Failed';
    transactionId?: string; chequeNumber?: string; bankName?: string;
    walletName?: string; gatewayMethod?: string; studentName?: string;
    className?: string; studentRegId?: string; templateName?: string;
    collectedByName?: string; totalFeeAmount?: number;
    discountGiven?: number; lateFineApplied?: number;
    currentBalanceDue?: number; feeRecordStatus?: string;
}
export type ReceiptData = Transaction;

interface FeeReceiptProps {
    transaction: Transaction | null;
}

// --- Helper Functions (Koi badlaav nahi) ---
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

// --- MAIN COMPONENT ---
const FeeReceipt: React.FC<FeeReceiptProps> = ({ transaction }) => {
    const componentRef = useRef<HTMLDivElement>(null); 
    
    // --- School Details Fetching (Aapke code se, koi badlaav nahi) ---
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
                setSchoolDetails(transaction?.schoolInfo || {});
            } finally {
                setIsLoading(false);
            }
        };
        fetchSchoolProfile();
    }, [transaction?.schoolInfo]);
    // --- End ---


    // --- Print & Download Handlers (Aapke code se, koi badlaav nahi) ---
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
            const margin = 0; // A4 page pe full fit karne ke liye margin 0
            
            let imgWidth = pdfWidth - (margin * 2);
            let imgHeight = imgWidth * imgRatio;

            // Fit to page
            imgWidth = pdfWidth;
            imgHeight = pdfHeight;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`FeeReceipt_${transaction?.receiptId || 'download'}.pdf`);
        
        }).catch(err => {
            input.classList.remove(styles.printing);
            console.error("Error downloading PDF:", err);
            alert("Could not download PDF. Please try printing.");
        });
    };
    // --- END ---
    
    // --- Loading states (Aapke code se) ---
    if (!transaction || isLoading) {
        return <div className={styles.noData}>Loading Receipt Data...</div>;
    }

    // --- Data Extraction (Aapke code se, koi badlaav nahi) ---
    const studentData = transaction.studentId || {}; 
    const templateData = transaction.templateId || {}; 
    
    const receiptNoDisplay = transaction.receiptId || 'N/A';
    const paymentDateDisplay = formatDate(transaction.paymentDate); 
    
    const studentNameDisplay = (studentData as any).name || transaction.studentName || 'N/A';
    const studentRegIdDisplay = (studentData as any).studentId || transaction.studentRegId || 'N/A';
    const classDisplay = (studentData as any).class || transaction.className || 'N/A';
    
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


    // === YAHAN BADA BADLAAV HAI (1/2) ===
    // Ek alag component banaya taaki JSX ko do baar copy-paste na karna pade
    const ReceiptBody = ({ copyType }: { copyType: string }) => (
        <>
            {/* 1. HEADER (Image ke jaisa) */}
            <div className={styles.header}>
                <div className={styles.schoolDetails}>
                    {schoolDetails?.logo && (<img src={schoolDetails.logo} alt={`${schoolDetails.name || 'School'} Logo`} className={styles.logo} />)}
                    <h1>{schoolDetails?.name2 || schoolDetails?.name || 'My EduPanel'}</h1>
                </div>
                {/* Copy ka title (School Copy / Student Copy) */}
                <div className={styles.copyType}>{copyType}</div> 
                <div className={styles.metaHeader}>
                    <p><strong>Receipt No:</strong> {receiptNoDisplay}</p>
                    <p><strong>Date:</strong> {paymentDateDisplay}</p>
                    <p><strong>Session:</strong> {schoolDetails?.session || 'N/A'}</p>
                </div>
            </div>

            {/* 2. Central Title (Image ke jaisa) */}
            <div className={styles.titleMeta}>
                <h2>FEE RECEIPT</h2>
            </div>

            {/* 3. Main Content Wrapper (Left/Right Split) */}
            <div className={styles.mainContentWrapper}>

                {/* Left Column (Student Info + Fee Table) */}
                <section className={styles.mainContentLeft}>
                    
                    {/* Student Info (Aapke purane code se yahan move kiya gaya) */}
                    <h3 className={styles.sectionHeading}>Student Information</h3>
                    <div className={`${styles.grid} ${styles.studentGrid}`}>
                        <p><strong>Name:</strong> {studentNameDisplay}</p>
                        <p><strong>Student ID:</strong> {studentRegIdDisplay}</p>
                        <p><strong>Class:</strong> {classDisplay}</p>
                    </div>
                    
                    {/* Fee Table (Aapke purane code se) */}
                    <h3 className={styles.sectionHeading}>Fee Particulars {templateNameDisplay && `(${templateNameDisplay})`}</h3>
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
                <section className={styles.mainContentRight}>
                    <h3 className={styles.sectionHeading}>Payment Details</h3>
                    <div className={styles.grid}>
                        <p><strong>Amount Paid:</strong> <strong className={styles.paidAmount}>{formatCurrency(amountPaid)}</strong></p>
                        <p><strong>Payment Mode:</strong> {transaction.paymentMode || 'N/A'}</p>
                        {transaction.notes && <p className={styles.notes}><strong>Remarks:</strong> {transaction.notes}</p>}
                    </div>
                </section>
            </div> 
            {/* === END MAIN WRAPPER === */}


            {/* 4. Footer (Naya 3-Column Layout, Image ke jaisa) */}
            <footer className={styles.footer}>
                <div className={styles.footerReceivedBy}>
                    <p>Received By: {collectedByNameDisplay}</p>
                </div>

                {/* Balance Due (Aapke purane code se yahan move kiya gaya) */}
                <div className={styles.footerBalance}>
                    <p><strong>Balance Due:</strong>
                        <span className={styles.balanceAmount} data-balance-zero={balanceDue < 0.01}>{formatCurrency(balanceDue)}</span>
                    </p>
                    {paymentStatus === 'PAID' ? ( <div className={styles.paidStamp}>PAID</div> ) :
                        (<div className={`${styles.statusBadge} ${styles[paymentStatus.toLowerCase()]}`}>{paymentStatus}</div>)
                    }
                </div>

                {/* Signature (Image ke jaisa) */}
                <div className={styles.footerSignature}>
                    <span className={styles.signatureLine}></span>
                    <p>Authorised Signatory</p>
                </div>
            </footer>
            
            <p className={styles.footerNote}>
                This is a computer-generated receipt {transaction.paymentMode !== 'Online' ? 'and requires a signature.' : 'and does not require a signature if paid online.'}
            </p>
        </>
    );


    // === YAHAN BADA BADLAAV HAI (2/2) ===
    // Puraane return ko replace karke yeh naya return use karein
    return (
        <div className={styles.receiptContainer}>
            {/* --- Buttons (Koi badlaav nahi) --- */}
            <div className={`${styles.actions} no-print`}>
                <button onClick={handleDownloadPDF} className={styles.downloadButton}><FiDownload /> Download PDF</button>
                <button onClick={handlePrint} className={styles.printButton}><FiPrinter /> Print Receipt</button>
            </div>
            {/* --- END --- */}


            {/* --- Receipt Content (Ab yeh A4 Page hai jisme 2 hisse hain) --- */}
            <div id="printable-receipt" className={styles.a4Page} ref={componentRef}>
                
                {/* === FIRST HALF (School Copy) === */}
                <div className={styles.receiptHalf}>
                    <ReceiptBody copyType="School Copy" />
                </div>

                {/* === SEPARATOR === */}
                <div className={styles.separator}></div>

                {/* === SECOND HALF (Student Copy) === */}
                <div className={styles.receiptHalf}>
                    <ReceiptBody copyType="Student Copy" />
                </div>
            </div>
        </div>
    );
};

export default FeeReceipt;
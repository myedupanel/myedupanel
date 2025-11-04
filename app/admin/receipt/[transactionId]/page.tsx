"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/backend/utils/api'; 
import styles from './Receipt.module.scss';
import { FiPrinter } from 'react-icons/fi';

// Data types (example, aapke models ke hisaab se)
interface Transaction {
  id: string;
  amountPaid: number;
  paymentDate: string;
  mode: string;
  status: string;
  studentId: { name: string; class: string }; // Populated
  templateId: { name: string }; // Populated
  feeRecordId: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const { transactionId } = params;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) return;
      setLoading(true);
      try {
        const res = await api.get(`/fees/transaction/${transactionId}`); 
        // Assuming your backend returns data in a structure where transaction details are directly accessible
        // Use res.data directly if it contains the Transaction interface structure
        setTransaction(res.data); 
      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError('Failed to load receipt details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [transactionId]);

  // --- UPDATED PRINT HANDLER FUNCTION ---
  const handlePrint = () => {
    // 1. Get the content that needs to be printed
    const printableElement = document.querySelector(`.${styles.printableArea}`);
    
    if (!printableElement) {
        console.error("Printable area element not found.");
        return;
    }

    const receiptContent = printableElement.outerHTML;

    // 2. Open a new window
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return; // Prevent if pop-up is blocked

    // 3. Collect all CSS <link> tags from the current document
    let cssLinks = '';
    const links = document.querySelectorAll('link[rel="stylesheet"], style');
    links.forEach(link => {
        // Only copy external stylesheets and inline styles if present
        cssLinks += link.outerHTML;
    });

    // 4. Construct the HTML for the new window
    const htmlContent = `
      <html>
        <head>
          <title>Fee Receipt - ${transactionId}</title>
          ${cssLinks}
          <style>
            /* Custom print style for the new window to ensure proper layout */
            @page { size: A4; margin: 15mm; }
            body { font-family: Arial, sans-serif; }
            /* Hide the non-printable container if any external styles carry over */
            .receiptContainer { display: block; }
            .printableArea {
                /* Ensure it takes full width for printing */
                width: 100%;
                box-shadow: none;
                border: none;
            }
          </style>
        </head>
        <body>
          ${receiptContent}
        </body>
      </html>
    `;

    // 5. Write content and execute print after a short delay (Crucial for image/style loading)
    printWindow.document.write(htmlContent);
    printWindow.document.close(); // Important for loading external resources

    // Add a small delay for content to render and images/styles to load before printing
    setTimeout(() => {
      try {
        printWindow.print();
        printWindow.close();
      } catch (e) {
        console.error("Print failed:", e);
      }
    }, 300); // 300ms delay: usually safe and fast enough.
  };
  // --- END UPDATED PRINT HANDLER FUNCTION ---

  if (loading) return <div style={{ padding: '2rem' }}>Loading Receipt...</div>; 
  if (error) return <div className="error">{error}</div>; 
  if (!transaction) return <div>Transaction not found.</div>;

  // Yahan apka JSX same rahega
  return (
    <div className={styles.receiptContainer}>
      
      <div className={styles.noPrint}>
        <button onClick={handlePrint} className={styles.printButton}>
          <FiPrinter /> Print Receipt
        </button>
      </div>

      <div className={styles.printableArea}>
        {/* ... Rest of your receipt content JSX ... */}
        <header className={styles.receiptHeader}>
          <h1>Payment Receipt</h1>
          <p><strong>Transaction ID:</strong> {transaction.id}</p>
        </header>

        <section className={styles.detailsGrid}>
          <div className={styles.studentDetails}>
            <h2>Student Details</h2>
            <p><strong>Name:</strong> {transaction.studentId.name}</p>
            <p><strong>Class:</strong> {transaction.studentId.class}</p>
          </div>
          
          <div className={styles.paymentDetails}>
            <h2>Payment Details</h2>
            <p><strong>Amount Paid:</strong> {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(transaction.amountPaid)}</p>
            <p><strong>Date:</strong> {new Date(transaction.paymentDate).toLocaleDateString('en-GB')}</p>
            <p><strong>Payment Mode:</strong> {transaction.mode}</p>
            <p><strong>Status:</strong> {transaction.status}</p>
          </div>
        </section>
        
        <section className={styles.feeDetails}>
          <h2>For Fee</h2>
          <p><strong>Fee Type:</strong> {transaction.templateId.name}</p>
          <p><strong>Fee Record ID:</strong> {transaction.feeRecordId}</p>
        </section>

        <footer className={styles.receiptFooter}>
          <div className={styles.signatureBox}>
            Signature & Stamp
          </div>
          <p>Thank you for your payment.</p>
        </footer>
      </div>

    </div>
  );
}
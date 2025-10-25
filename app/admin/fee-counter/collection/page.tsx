"use client";
import React, { useState, useEffect, useCallback } from 'react'; // useEffect aur useCallback add karein
import styles from './FeeCollection.module.scss';
import { FiUser, FiCreditCard, FiRefreshCw, FiDollarSign } from 'react-icons/fi'; // FiDollarSign add karein
import StudentSearch from '@/components/admin/StudentSearch/StudentSearch';
import PaidTransactions from '@/components/admin/PaidTransactions/PaidTransactions';
import FailedTransactions from '@/components/admin/FailedTransactions/FailedTransactions';
import PaymentHistory from '@/components/admin/PaymentHistory/PaymentHistory';
import api from '@/backend/utils/api'; // api utility import karein

// --- NAYI TYPE DEFINITION ---
interface FeeRecord {
    _id: string;
    amount: number; // Yeh total amount hai
    amountPaid: number;
    balanceDue: number;
    dueDate: string;
    status: string;
    templateId: { name: string }; // Template ka naam
    studentId: string; // Student ID
    classId: string; // Class ID
    // Add other relevant fields if needed
}
// ---

const FeeCollectionPage: React.FC = () => {
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [activeSubTab, setActiveSubTab] = useState('feeRecord');

    // --- NAYE STATES ---
    const [unpaidRecords, setUnpaidRecords] = useState<FeeRecord[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    // ---

    // --- FORMAT CURRENCY FUNCTION (Aapke dashboard se copy kiya) ---
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };
    // ---

    // --- UNPAID RECORDS FETCH KARNE KA FUNCTION ---
    const fetchUnpaidRecords = useCallback(async (studentId: string) => {
        if (!studentId) return;
        setLoadingRecords(true);
        setUnpaidRecords([]); // Purane records clear karein
        try {
            // API call karein student ke 'Pending' ya 'Partial' records laane ke liye
            // NOTE: Aapko backend mein '/fees/student-records' route ko modify karna pad sakta hai
            // taaki woh status ('Pending', 'Partial') ke hisaab se filter kar sake
            const response = await api.get(`/fees/student-records?studentId=${studentId}&status=Pending,Partial`); // Example endpoint
            setUnpaidRecords(response.data.data || []); // Maan rahe hain data 'data' key mein hai
        } catch (error) {
            console.error("Error fetching unpaid fee records:", error);
            // Error handling (e.g., show toast message)
        } finally {
            setLoadingRecords(false);
        }
    }, []);
    // ---

    // --- useEffect JAB STUDENT SELECT HO ---
    useEffect(() => {
        if (selectedStudent && activeSubTab === 'feeRecord') {
            fetchUnpaidRecords(selectedStudent._id);
        }
        // Agar student deselect hota hai ya tab badalta hai toh list clear karein
        if (!selectedStudent || activeSubTab !== 'feeRecord') {
            setUnpaidRecords([]);
        }
    }, [selectedStudent, activeSubTab, fetchUnpaidRecords]);
    // ---

    // ===============================================
    // ===== RAZORPAY PAYMENT LOGIC YAHAN AAYEGA =====
    // ===============================================

    // --- Step 4: Razorpay Script Load karna ---
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                resolve(true); // Script load ho gayi
            };
            script.onerror = () => {
                resolve(false); // Script load nahi hui
            };
            document.body.appendChild(script);
        });
    };

    // --- Step 5: "Pay Online" Button ka Handler ---
    const handlePayOnline = async (record: FeeRecord) => {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            alert('Could not load payment gateway. Please check your internet connection and try again.');
            return;
        }

        try {
            // Backend ko order banane ke liye call karein
            const orderResponse = await api.post('/fees/payment/create-order', {
                amount: record.balanceDue, // Jitna balance hai utna pay karein
                feeRecordId: record._id,
                studentId: record.studentId,
                classId: record.classId,
                // Add any other necessary details
            });

            const order = orderResponse.data; // Backend se mila order object

            // Razorpay options configure karein
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Key ko .env.local se lein
                amount: order.amount, // Amount (paise mein) backend se aa raha hai
                currency: order.currency,
                name: "Your School Name", // School ka naam
                description: `Fee Payment for ${record.templateId.name}`,
                // image: "/your_school_logo.png", // Optional: School ka logo
                order_id: order.id, // Backend se mila order ID
                handler: function (response: any) {
                    // Payment successful hone par yeh function call hoga
                    // Hum yahan sirf success message dikhayenge
                    // Asli verification backend webhook se karega
                    alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
                    // Optionally refresh the unpaid records list
                    fetchUnpaidRecords(selectedStudent._id);
                },
                prefill: {
                    // Optional: Parent ki details prefill karein (agar available ho)
                    // name: selectedStudent?.parentName || "",
                    // email: selectedStudent?.parentEmail || "",
                    // contact: selectedStudent?.parentContact || ""
                },
                notes: order.notes, // Yeh notes backend se aa rahe hain
                theme: {
                    color: "#3399cc" // Popup ka theme color
                },
                modal: {
                    ondismiss: function() {
                        // Jab user popup band kar dega (bina pay kiye)
                        console.log('Payment popup closed.');
                        alert('Payment cancelled or popup closed.');
                    }
                }
            };

            // Razorpay popup kholna
            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

            // Error handling agar payment fail ho (jaise card decline)
            paymentObject.on('payment.failed', function (response: any) {
                alert(`Payment Failed: ${response.error.description}`);
                console.error('Payment Failed:', response.error);
            });

        } catch (error) {
            console.error("Error initiating online payment:", error);
            alert('Failed to start online payment. Please try again.');
        }
    };
    // ===============================================
    // ===== RAZORPAY PAYMENT LOGIC END =====
    // ===============================================


    // ===== AAPKA EXISTING JSX (THODA UPDATE KIYA HAI) =====
    return (
        <div className={styles.pageContainer}>
             {/* ... (Left Panel - Student Search and Nav - No Change) ... */}
              <aside className={styles.leftPanel}>
                    <div className={styles.panelHeader}>
                        <FiUser />
                        <h3>Select Student</h3>
                    </div>
                    <div className={styles.panelContent}>
                        <StudentSearch onStudentSelect={setSelectedStudent} />

                        {selectedStudent && (
                            <div className={styles.selectedStudentInfo}>
                                <p>Selected Student:</p>
                                <strong>{selectedStudent.name}</strong>
                                <span>Class: {selectedStudent.class}</span>
                            </div>
                        )}
                    </div>
                    <nav className={styles.verticalNav}>
                        <ul>
                           <li className={activeSubTab === 'feeRecord' ? styles.active : ''} onClick={() => setActiveSubTab('feeRecord')}>Fee Record</li>
                           <li className={activeSubTab === 'paid' ? styles.active : ''} onClick={() => setActiveSubTab('paid')}>Paid Transaction</li>
                           <li className={activeSubTab === 'failed' ? styles.active : ''} onClick={() => setActiveSubTab('failed')}>Fail Transaction</li>
                           <li className={activeSubTab === 'history' ? styles.active : ''} onClick={() => setActiveSubTab('history')}>History</li>
                        </ul>
                    </nav>
                </aside>

             {/* ===== MAIN CONTENT: FEE RECORDS (UPDATED) ===== */}
              <main className={styles.mainContent}>
                     <div className={styles.panelHeader}>
                        <h3>
                            {activeSubTab === 'feeRecord' && 'Fee Records'}
                            {activeSubTab === 'paid' && 'Paid Transactions'}
                            {activeSubTab === 'failed' && 'Failed Transactions'}
                            {activeSubTab === 'history' && 'Payment History'}
                        </h3>
                        {/* Refresh button add kar sakte hain */}
                        {selectedStudent && activeSubTab === 'feeRecord' && (
                            <button onClick={() => fetchUnpaidRecords(selectedStudent._id)} className={styles.refreshButton}>
                                <FiRefreshCw />
                            </button>
                        )}
                    </div>
                     <div className={styles.panelContent}>
                        {!selectedStudent ? (
                            <p className={styles.placeholder}>Please select a student to view their records.</p>
                        ) : (
                            <>
                                {activeSubTab === 'feeRecord' && (
                                    loadingRecords ? (
                                        <p>Loading unpaid records...</p>
                                    ) : unpaidRecords.length === 0 ? (
                                        <p className={styles.placeholder}>No pending or partial fee records found for this student.</p>
                                    ) : (
                                        <ul className={styles.recordList}>
                                            {unpaidRecords.map(record => (
                                                <li key={record._id} className={styles.recordItem}>
                                                    <div className={styles.recordInfo}>
                                                        <span>{record.templateId.name}</span>
                                                        <span className={styles.amountDue}>
                                                            Balance: {formatCurrency(record.balanceDue)}
                                                        </span>
                                                        <span className={styles.dueDate}>
                                                            Due: {new Date(record.dueDate).toLocaleDateString('en-GB')}
                                                        </span>
                                                    </div>
                                                    <div className={styles.recordActions}>
                                                       {/* Manual payment options (future) */}
                                                        {/* "Pay Online" Button */}
                                                        <button
                                                            className={styles.payOnlineButton}
                                                            onClick={() => handlePayOnline(record)}
                                                            disabled={record.balanceDue <= 0} // Agar balance 0 hai toh disable
                                                        >
                                                            <FiCreditCard /> Pay Online
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )
                                )}
                                {activeSubTab === 'paid' && <PaidTransactions studentId={selectedStudent._id} />}
                                {activeSubTab === 'failed' && <FailedTransactions studentId={selectedStudent._id} />}
                                {activeSubTab === 'history' && <PaymentHistory studentId={selectedStudent._id} />}
                            </>
                        )}
                    </div>
                </main>

             {/* ===== RIGHT PANEL: PAYMENT SUMMARY (Conditional) ===== */}
             {/* Is panel ko hum future mein use kar sakte hain manual entry ke liye */}
              {activeSubTab === 'feeRecord' && (
                    <aside className={styles.rightPanel}>
                        <div className={styles.panelHeader}>
                            <h3>Manual Payment</h3> {/* Title change kiya */}
                        </div>
                        <div className={styles.panelContent}>
                           <p className={styles.placeholder}>Select a record and amount for manual entry.</p>
                           {/* Yahan manual payment form aayega */}
                            {/* ... (existing summary rows and radio buttons) ... */}
                            <div className={styles.summaryRow}>
                                <span>Subtotal</span>
                                <span>₹ 0.00</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Late Charge</span>
                                <span>₹ 0</span>
                            </div>
                            <hr className={styles.divider} />
                            <div className={styles.paymentModes}>
                                {['Cash', 'Cheque', 'Draft', 'NEFT', 'RTGS', 'UPI'].map(mode => (
                                    <div key={mode} className={styles.radioGroup}>
                                        <input type="radio" name="paymentMode" id={mode} />
                                        <label htmlFor={mode}>{mode}</label>
                                    </div>
                                ))}
                            </div>
                            <hr className={styles.divider} />
                            <div className={styles.totalSection}>
                                <span>Total:</span>
                                <strong>₹ 0.00</strong>
                            </div>
                            <button className={styles.proceedButton}>Collect Manually</button> {/* Button text change kiya */}
                        </div>
                    </aside>
                )}
        </div>
    );
};

export default FeeCollectionPage;
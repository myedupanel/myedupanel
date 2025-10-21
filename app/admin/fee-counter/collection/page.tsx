"use client";
import React, { useState } from 'react';
import styles from './FeeCollection.module.scss';
import { FiUser, FiCreditCard, FiRefreshCw } from 'react-icons/fi';
import StudentSearch from '@/components/admin/StudentSearch/StudentSearch';
import PaidTransactions from '@/components/admin/PaidTransactions/PaidTransactions';
import FailedTransactions from '@/components/admin/FailedTransactions/FailedTransactions';
import PaymentHistory from '@/components/admin/PaymentHistory/PaymentHistory';

const FeeCollectionPage: React.FC = () => {
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [activeSubTab, setActiveSubTab] = useState('feeRecord');

    return (
        <div className={styles.pageContainer}>
            <div className={`${styles.gridContainer} ${activeSubTab !== 'feeRecord' ? styles.twoColumnLayout : ''}`}>
                
                {/* ===== LEFT CONTROLS PANEL ===== */}
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
                    </div>
                     <div className={styles.panelContent}>
                        {!selectedStudent ? (
                            <p className={styles.placeholder}>Please select a student to view their records.</p>
                        ) : (
                            <>
                                {activeSubTab === 'feeRecord' && <p className={styles.placeholder}>Unpaid records will be shown here.</p>}
                                {activeSubTab === 'paid' && <PaidTransactions studentId={selectedStudent._id} />}
                                {activeSubTab === 'failed' && <FailedTransactions studentId={selectedStudent._id} />}
                                {activeSubTab === 'history' && <PaymentHistory studentId={selectedStudent._id} />}
                            </>
                        )}
                    </div>
                </main>

                {/* ===== RIGHT PANEL: PAYMENT SUMMARY (Conditional) ===== */}
                {activeSubTab === 'feeRecord' && (
                    <aside className={styles.rightPanel}>
                        <div className={styles.panelHeader}>
                            <h3>Payment Summary</h3>
                        </div>
                        <div className={styles.panelContent}>
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
                            <button className={styles.proceedButton}>Proceed to Next</button>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default FeeCollectionPage;
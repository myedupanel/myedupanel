"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/backend/utils/api';
import styles from './AssignFee.module.scss'; 
import { FiSave, FiDollarSign, FiCreditCard, FiSmartphone, FiHome, FiEdit } from 'react-icons/fi';
import { FaRupeeSign, FaUniversity, FaWallet } from 'react-icons/fa'; 
import StudentSearch from '@/components/admin/StudentSearch/StudentSearch';
import Link from 'next/link'; // --- FIX: 'Link' component import करें (Onboarding message के लिए)

// Helper function (if not globally available)
const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '₹ --';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// --- Define Payment Modes (No change) ---
const paymentModesList = [
    { value: 'Cash', label: 'Cash', icon: <FaRupeeSign /> },
    { value: 'UPI', label: 'UPI', icon: <FiSmartphone /> },
    { value: 'Card', label: 'Card (Credit/Debit)', icon: <FiCreditCard /> },
    { value: 'NetBanking', label: 'Net Banking', icon: <FaUniversity /> },
    { value: 'Cheque', label: 'Cheque', icon: <FiEdit /> },
    { value: 'Draft', label: 'Demand Draft (DD)', icon: <FiEdit /> },
    { value: 'Wallet', label: 'Mobile Wallet', icon: <FaWallet /> },
    { value: 'Other', label: 'Other', icon: <FiHome /> },
];
// ---

const AssignFeePage = () => {
    // --- FIX: States को update किया गया ---
    const [templates, setTemplates] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]); // Added classes state
    const [isLoading, setIsLoading] = useState(true); // Single loading state
    
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [dueDate, setDueDate] = useState('');

    // --- Quick Collect States (No change) ---
    const [amountPaid, setAmountPaid] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<string>('Cash');
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- NEW: Conditional Input States (No change) ---
    const [transactionId, setTransactionId] = useState('');
    const [chequeNumber, setChequeNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [walletName, setWalletName] = useState('');

    // --- FIX: useEffect को Classes और Templates, दोनों को fetch करने के लिए update किया गया ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Dono ko ek saath fetch karein
                // Yeh 'Promise.all' classes aur templates ko ek hi baar mein fetch karega
                const [classRes, templateRes] = await Promise.all([
                    api.get('/api/classes'), // YEH AAPKE BACKEND FIX (Step 3) PAR NIRBHAR KARTA HAI
                    api.get('/api/fees/templates')
                ]);
                
                // Dono states ko update karein
                setClasses(classRes.data || []);
                setTemplates(templateRes.data || []);

            } catch (error) {
                console.error("Failed to fetch initial data", error);
                setClasses([]);
                setTemplates([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []); // Yeh effect ek baar chalega

    const isPayingNow = useMemo(() => Number(amountPaid) > 0, [amountPaid]);

    // --- handleAssignAndCollect (No change in logic) ---
    const handleAssignAndCollect = async () => {
        // Basic validation
        if (!selectedStudent || !selectedTemplateId || !dueDate) {
            alert("Please select a student, a fee template, and a due date."); return;
        }

        const numericAmountPaid = Number(amountPaid) || 0;

        // Payment specific validation
        if (numericAmountPaid > 0 && !paymentMode) { alert("Please select a payment mode."); return; }
        if (numericAmountPaid > 0 && !paymentDate) { alert("Please select a payment date."); return; }

        // Conditional Validation
        if (numericAmountPaid > 0) {
             if ((paymentMode === 'UPI' || paymentMode === 'NetBanking' || paymentMode === 'Card') && !transactionId.trim()) {
                 alert(`Please enter the Transaction ID for ${paymentMode}.`); return;
             }
             if ((paymentMode === 'Cheque' || paymentMode === 'Draft') && !chequeNumber.trim()) {
                 alert(`Please enter the ${paymentMode} Number.`); return;
             }
              if ((paymentMode === 'Cheque' || paymentMode === 'Draft') && !bankName.trim()) {
                 alert(`Please enter the Bank Name for the ${paymentMode}.`); return;
             }
             if (paymentMode === 'Wallet' && !walletName.trim()) {
                 alert(`Please specify the Wallet Name (e.g., Paytm, PhonePe).`); return;
             }
              if (paymentMode === 'Wallet' && !transactionId.trim()) {
                 alert(`Please enter the Transaction ID for the Wallet payment.`); return;
             }
        }

        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        if (selectedTemplate && numericAmountPaid > selectedTemplate.totalAmount + 0.01) { // Tolerance
            alert(`Amount paid (${formatCurrency(numericAmountPaid)}) cannot exceed template total (${formatCurrency(selectedTemplate.totalAmount)}).`); return;
        }

        setIsSubmitting(true);

        try {
            // Prepare payload - include conditional details
            const paymentDetails: any = {};
            if (numericAmountPaid > 0) {
                paymentDetails.amountPaid = numericAmountPaid;
                paymentDetails.paymentMode = paymentMode;
                paymentDetails.paymentDate = paymentDate;
                paymentDetails.notes = notes; // General notes

                // Add specific details based on mode
                switch (paymentMode) {
                    case 'UPI':
                    case 'NetBanking':
                    case 'Card':
                        paymentDetails.transactionId = transactionId; 
                        break;
                    case 'Cheque':
                    case 'Draft':
                        paymentDetails.chequeNumber = chequeNumber; 
                        paymentDetails.bankName = bankName;
                        break;
                     case 'Wallet':
                        paymentDetails.transactionId = transactionId; 
                        paymentDetails.walletName = walletName; 
                        break;
                }
            }

            const payload = {
                studentId: selectedStudent.id,
                templateId: selectedTemplateId,
                dueDate,
                ...paymentDetails // Spread the payment details here
            };

            const res = await api.post('/api/fees/assign-and-collect', payload);
            alert(res.data.message || 'Operation successful!');

            // Reset form on success
            setSelectedStudent(null);
            setSelectedTemplateId('');
            setDueDate('');
            setAmountPaid('');
            setPaymentMode('Cash');
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setNotes('');
            // Reset conditional fields
            setTransactionId('');
            setChequeNumber('');
            setBankName('');
            setWalletName('');

        } catch (error: any) {
            console.error("Error assigning/collecting fee:", error);
            alert(error.response?.data?.message || 'Failed to process request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Helper function (No change) ---
    useEffect(() => {
        setTransactionId('');
        setChequeNumber('');
        setBankName('');
        setWalletName('');
        setNotes(''); 
    }, [paymentMode]);

    // --- FIX: Return logic ko poori tarah update kiya gaya ---
    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Assign Fee / Quick Collect</h1>
            </header>

            {/* --- YAHAN SE HAMAARA ONBOARDING FLOW SHURU HOTA HAI --- */}
            
            {isLoading ? (
                // 1. Loading state
                <div className={styles.loadingMessage}>Loading school setup...</div>
            
            ) : classes.length === 0 ? (
                // 2. Agar Classes nahi hain
                <div className={styles.onboardingMessage}> {/* Isse .scss file mein style karein */}
                    <h2>Step 1: Add Your Classes</h2>
                    <p>Before you can assign fees, you need to add at least one class to your school.</p>
                    {/* Yeh link aapke "Add Class" page par jaana chahiye */}
                    {/* NOTE: Link ko update karein agar aapka path alag hai */}
                    <Link href="/admin/fee-counter/classes">
                        <button className={styles.assignButton}>+ Add Classes Now</button>
                    </Link>
                </div>
            
            ) : templates.length === 0 ? (
                // 3. Agar Classes hain, lekin Templates nahi hain
                <div className={styles.onboardingMessage}>
                    <h2>Step 2: Create Fee Templates</h2>
                    <p>Great! You've added classes. Now create a fee template (e.g., "Annual Fee") before you can assign them.</p>
                    {/* Yeh link aapke "Fee Templates" page par jaana chahiye */}
                    <Link href="/admin/fee-counter/templates"> 
                        <button className={styles.assignButton}>+ Create a Template</button>
                    </Link>
                </div>

            ) : (
                
                // 4. Agar Classes aur Templates dono hain, tabhi form dikhayein
                <div className={styles.formContainer}>
                    {/* --- Sections 1, 2, 3 --- */}
                     <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>1</span>
                        <h2 className={styles.sectionTitle}>Select Student</h2>
                      </div>
                      <div className={styles.sectionContent}>
                        {/* StudentSearch component ab classes fetch hone ke baad hi render hoga */}
                        <StudentSearch onStudentSelect={setSelectedStudent} />
                        {selectedStudent && (
                          <div className={styles.selectedStudent}>
                            Selected: <strong>{selectedStudent.name}</strong> (Class: {selectedStudent.class})
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>2</span>
                        <h2 className={styles.sectionTitle}>Select Template</h2>
                      </div>
                      <div className={styles.sectionContent}>
                        <select
                          className={styles.selectInput}
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          disabled={isLoading} // --- FIX: 'loadingTemplates' ki jagah 'isLoading'
                        >
                          <option value="">{isLoading ? 'Loading...' : 'Select a Fee Template'}</option>
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name} ({formatCurrency(template.totalAmount)}) 
                            </option>
                          ))}
                        </select>
                        {/* --- FIX: Yeh error message ab zaroori nahi hai, kyunki humne ise upar handle kar liya hai --- */}
                      </div>
                    </div>
                    
                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>3</span>
                        <h2 className={styles.sectionTitle}>Set Due Date</h2>
                      </div>
                      <div className={styles.sectionContent}>
                        <input 
                            type="date"
                            className={styles.selectInput}
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            required 
                        />
                      </div>
                    </div>

                    {/* --- UPDATED Section 4: Collect Payment (Optional) --- */}
                    <div className={`${styles.section} ${styles.quickCollectSection}`}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionNumber}>4</span>
                            <h2 className={styles.sectionTitle}>Collect Payment Now (Optional)</h2>
                        </div>
                        <div className={styles.sectionContent}>
                            {/* Amount Paid Input */}
                            <div className={styles.formGroup}>
                                <label htmlFor="amountPaid">Amount Paying Now</label>
                                <input
                                    type="number" id="amountPaid" className={styles.selectInput}
                                    placeholder="Leave blank to only assign demand"
                                    value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                                    min="0"
                                />
                            </div>

                            {/* Conditional Payment Details */}
                            {isPayingNow && (
                                <>
                                    {/* Payment Date Input */}
                                    <div className={styles.formGroup}>
                                        <label htmlFor="paymentDate">Payment Date *</label>
                                        <input type="date" id="paymentDate" className={styles.selectInput}
                                               value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
                                    </div>

                                    {/* Payment Mode Selection (Using Radio Buttons) */}
                                    <div className={styles.formGroup}>
                                        <label>Payment Mode *</label>
                                        <div className={styles.paymentModesGrid}> 
                                            {paymentModesList.map(mode => (
                                                <div key={mode.value} className={styles.radioGroupStyled}> 
                                                    <input type="radio" name="paymentMode" id={mode.value} value={mode.value}
                                                           checked={paymentMode === mode.value} onChange={(e) => setPaymentMode(e.target.value)} />
                                                    <label htmlFor={mode.value} className={styles.radioLabel}>
                                                        <span className={styles.radioIcon}>{mode.icon}</span>
                                                        {mode.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* --- Conditional Inputs based on Payment Mode --- */}

                                    {(paymentMode === 'UPI' || paymentMode === 'Card' || paymentMode === 'NetBanking' || paymentMode === 'Wallet') && (
                                        <div className={styles.formGroup}>
                                            <label htmlFor="transactionId">Transaction ID *</label>
                                            <input type="text" id="transactionId" className={styles.selectInput}
                                                   placeholder={`Enter ${paymentMode} Transaction ID`} value={transactionId}
                                                   onChange={(e) => setTransactionId(e.target.value)} required />
                                        </div>
                                    )}
                                    {paymentMode === 'Wallet' && (
                                         <div className={styles.formGroup}>
                                             <label htmlFor="walletName">Wallet Name *</label>
                                             <input type="text" id="walletName" className={styles.selectInput}
                                                    placeholder="e.g., Paytm, PhonePe, GPay" value={walletName}
                                                    onChange={(e) => setWalletName(e.target.value)} required />
                                         </div>
                                    )}
                                    {(paymentMode === 'Cheque' || paymentMode === 'Draft') && (
                                        <div className={styles.formGroup}>
                                            <label htmlFor="chequeNumber">{paymentMode} Number *</label>
                                            <input type="text" id="chequeNumber" className={styles.selectInput}
                                                   placeholder={`Enter ${paymentMode} Number`} value={chequeNumber}
                                                   onChange={(e) => setChequeNumber(e.target.value)} required />
                                        </div>
                                    )}
                                     {(paymentMode === 'Cheque' || paymentMode === 'Draft') && (
                                        <div className={styles.formGroup}>
                                            <label htmlFor="bankName">Bank Name *</label>
                                            <input type="text" id="bankName" className={styles.selectInput}
                                                   placeholder="Enter Bank Name" value={bankName}
                                                   onChange={(e) => setBankName(e.target.value)} required />
                                        </div>
                                    )}
                                    <div className={styles.formGroup}>
                                        <label htmlFor="notes">Notes / Remarks</label>
                                        <textarea id="notes" className={styles.textAreaInput} value={notes}
                                                  onChange={(e) => setNotes(e.target.value)} rows={2}
                                                  placeholder="Optional - e.g., Part payment, specific instructions" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {/* --- END UPDATED Section --- */}

                    {/* --- Actions Button --- */}
                    <div className={styles.actions}>
                        <button className={styles.assignButton} onClick={handleAssignAndCollect}
                                disabled={isSubmitting || !selectedStudent || !selectedTemplateId || !dueDate}>
                            {isPayingNow ? <FiDollarSign /> : <FiSave />}
                            {isSubmitting ? 'Processing...' : (isPayingNow ? 'Assign & Collect Payment' : 'Assign Fee Demand')}
                        </button>
                    </div>
                </div>
            )} 
            {/* --- ONBOARDING FLOW YAHAN KHATAM HOTA HAI --- */}
            
        </div>
    );
};

export default AssignFeePage;
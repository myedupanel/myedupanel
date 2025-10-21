"use client";
import React, { useState } from 'react';
import styles from './AddPaymentForm.module.scss';

interface AddPaymentFormProps {
  onClose: () => void;
  onSave: (paymentData: any) => void;
}

const AddPaymentForm = ({ onClose, onSave }: AddPaymentFormProps) => {
  // --- NAYA CODE SHURU ---
  // Aaj ki date nikalte hain YYYY-MM-DD format mein
  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];
  
  // 100 saal pehle ki date nikalte hain
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);
  const minDateString = minDate.toISOString().split('T')[0];
  // --- NAYA CODE KHATAM ---

  const [formData, setFormData] = useState({
    studentName: '',
    amount: '',
    paymentMethod: 'Cash',
    status: 'Paid',
    paymentDate: maxDate, // Default date aaj ki rakhein
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // --- NAYA VALIDATION CHECK ---
    const selectedDate = new Date(formData.paymentDate);
    const currentDate = new Date(maxDate);
    const hundredYearsAgo = new Date(minDateString);

    if (selectedDate > currentDate) {
        alert("Aap future ki date select nahi kar sakte.");
        return; // Function ko yahin rok do
    }
    if (selectedDate < hundredYearsAgo) {
        alert("Aap 100 saal se zyada purani date select nahi kar sakte.");
        return; // Function ko yahin rok do
    }
    // --- VALIDATION KHATAM ---

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="studentName">Student Name</label>
          <input type="text" id="studentName" name="studentName" value={formData.studentName} onChange={handleInputChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="amount">Amount (₹)</label>
          <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleInputChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="paymentDate">Payment Date</label>
          <input 
            type="date" 
            id="paymentDate" 
            name="paymentDate" 
            value={formData.paymentDate} 
            onChange={handleInputChange}
            max={maxDate} // <-- Maximum date (aaj)
            min={minDateString} // <-- Minimum date (100 saal pehle)
            required 
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="paymentMethod">Payment Method</label>
          <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleInputChange}>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>
      <div className={styles.buttonGroup}>
        <button type="button" className={styles.cancelButton} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={styles.saveButton}>
          Save Payment
        </button>
      </div>
    </form>
  );
};

export default AddPaymentForm;
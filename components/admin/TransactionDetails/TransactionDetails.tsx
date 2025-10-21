"use client";
import React, { useState, useEffect } from 'react';
import styles from './TransactionDetails.module.scss';

// Helper function: "DD Mon YYYY" ko "YYYY-MM-DD" mein badalta hai
const formatDateToInput = (dateStr: string) => {
  try {
    const date = new Date(dateStr.replace(/,/g, ''));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

// Sample class list
const classOptions = ["N/A", "Nursery", "LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];

interface Transaction {
  id: string; name: string; class: string; amount: string; status: 'Paid' | 'Pending'; date: string; paymentMethod?: string;
}

interface DetailsProps {
  transaction: Transaction;
  onSave: (updatedTransaction: Transaction) => void;
  onClose: () => void;
}

const TransactionDetails = ({ transaction, onSave, onClose }: DetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({
    ...transaction,
    date: formatDateToInput(transaction.date)
  });

  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);
  const minDateString = minDate.toISOString().split('T')[0];

  useEffect(() => {
    setEditableData({
      ...transaction,
      date: formatDateToInput(transaction.date)
    });
  }, [transaction]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const selectedDate = new Date(editableData.date);
    if (selectedDate > today) {
        alert("Aap future ki date select nahi kar sakte.");
        return;
    }
    if (selectedDate < minDate) {
        alert("Aap 100 saal se zyada purani date select nahi kar sakte.");
        return;
    }
    
    const formattedDate = new Date(editableData.date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    onSave({ ...editableData, date: formattedDate });
    setIsEditing(false);
  };

  return (
    <div className={styles.detailsContainer}>
      <div className={styles.header}>
        <h3>Receipt Details</h3>
        {isEditing ? (
          <select className={styles.statusSelect} name="status" value={editableData.status} onChange={handleInputChange}>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        ) : (
          <span className={`${styles.status} ${styles[transaction.status.toLowerCase()]}`}>
            {transaction.status}
          </span>
        )}
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.label}>Receipt ID</span>
          <span className={styles.value}>{transaction.id}</span>
        </div>
        
        {/* YEH SECTION UPDATE HUA HAI */}
        <div className={styles.detailItem}>
          <span className={styles.label}>Class</span>
          {isEditing ? (
            <select name="class" value={editableData.class} onChange={handleInputChange}>
              {classOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <span className={styles.value}>{transaction.class}</span>
          )}
        </div>

        <div className={styles.detailItem}>
          <span className={styles.label}>Student Name</span>
          {isEditing ? ( <input type="text" name="name" value={editableData.name} onChange={handleInputChange} /> ) : ( <span className={styles.value}>{transaction.name}</span> )}
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Amount</span>
          {isEditing ? ( <input type="text" name="amount" value={editableData.amount} onChange={handleInputChange} /> ) : ( <span className={styles.value}>{transaction.amount}</span> )}
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Payment Method</span>
          {isEditing ? (
            <select name="paymentMethod" value={editableData.paymentMethod} onChange={handleInputChange}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
            </select>
          ) : (
            <span className={styles.value}>{transaction.paymentMethod || 'N/A'}</span>
          )}
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Payment Date</span>
          {isEditing ? (
            <input type="date" name="date" value={editableData.date} onChange={handleInputChange} max={maxDate} min={minDateString} />
          ) : (
            <span className={styles.value}>{transaction.date}</span>
          )}
        </div>
      </div>
      
      <div className={styles.footer}>
        {isEditing ? (
          <div className={styles.editActions}>
            <button className={styles.cancelButton} onClick={() => setIsEditing(false)}>Cancel</button>
            <button className={styles.saveButton} onClick={handleSave}>Save Changes</button>
          </div>
        ) : (
          <button className={styles.editButton} onClick={() => setIsEditing(true)}>Edit Details</button>
        )}
      </div>
    </div>
  );
};

export default TransactionDetails;
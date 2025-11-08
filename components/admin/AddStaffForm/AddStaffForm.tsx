// components/admin/AddStaffForm/AddStaffForm.tsx
"use client";
import React, { useState, FormEvent } from 'react';
import styles from './AddStaffForm.module.scss';
import api from '@/backend/utils/api'; // Ensure correct path

interface StaffFormData {
  staffId: string;
  name: string;
  role: string;
  contactNumber: string;
  // FIX 1: Email को optional बनाएं, क्योंकि हम इसे नहीं भेजेंगे
  email?: string; 
  joiningDate: string;
  leavingDate?: string;
}

interface AddStaffFormProps {
  onClose: () => void;
  onSave: (staffData: StaffFormData) => Promise<void>;
}

// === FIX 2: Email Lock Constant ===
const IS_EMAIL_LOCKED = true; // Temporary lock while staff/teacher dashboards are not ready
// ==================================

const AddStaffForm = ({ onClose, onSave }: AddStaffFormProps) => {
  const [formData, setFormData] = useState<StaffFormData>({
    staffId: '',
    name: '',
    role: 'Accountant', // Default role
    contactNumber: '',
    email: '',
    joiningDate: new Date().toISOString().split('T')[0],
    leavingDate: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // FIX 3: अगर ईमेल लॉक्ड है, तो इनपुट चेंज को इग्नोर करें
    if (IS_EMAIL_LOCKED && name === 'email') {
        return; 
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // FIX 4: Backend में भेजने से पहले Email को हटा दें
    const dataToSubmit: Partial<StaffFormData> = { ...formData };
    if (IS_EMAIL_LOCKED) {
        // Email फ़ील्ड को हटा दें ताकि वह backend logic को ट्रिगर न करे
        delete dataToSubmit.email; 
    } else {
        // अगर Email Lock नहीं है, तो वैलिडेशन चेक करें
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }
    }

    setIsLoading(true);

    try {
        // dataToSubmit को भेजें
        await onSave(dataToSubmit as StaffFormData);
    } catch (err) {
        console.error("Error passed back to AddStaffForm:", err);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        {/* Staff ID */}
        <div className={styles.formGroup}>
          <label htmlFor="staffId">Staff ID</label>
          <input type="text" id="staffId" name="staffId" value={formData.staffId} onChange={handleInputChange} required disabled={isLoading} />
        </div>
        {/* Full Name */}
        <div className={styles.formGroup}>
          <label htmlFor="name">Full Name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required disabled={isLoading} />
        </div>
        {/* Role */}
        <div className={styles.formGroup}>
          <label htmlFor="role">Role</label>
          <select id="role" name="role" value={formData.role} onChange={handleInputChange} required disabled={isLoading}>
            <option value="Accountant">Accountant</option>
            <option value="Office Admin">Office Admin</option>
            <option value="Librarian">Librarian</option>
            <option value="Security">Security</option>
            <option value="Transport Staff">Transport Staff</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {/* Contact Number */}
        <div className={styles.formGroup}>
          <label htmlFor="contactNumber">Contact Number</label>
          <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required disabled={isLoading}/>
        </div>
        
        {/* FIX 5: Email Address Field (DISABLED UI) */}
        <div className={styles.formGroup}>
          <label htmlFor="email">Email Address (Login Disabled)</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            // Value को force खाली रखें जब तक लॉक्ड है
            value={IS_EMAIL_LOCKED ? '' : formData.email || ''} 
            // required हटा दिया गया क्योंकि यह अब conditional है
            onChange={handleInputChange} 
            placeholder={IS_EMAIL_LOCKED ? 'Staff login feature upcoming...' : 'staff@example.com'} 
            disabled={IS_EMAIL_LOCKED || isLoading} // फील्ड को disable करें
          />
          {IS_EMAIL_LOCKED && (
            <small style={{ color: '#fa8c16', fontWeight: 500 }}>
                Temporary Disabled: Staff/Teacher Login is currently under development.
            </small>
          )}
        </div>
        {/* Joining Date */}
        <div className={styles.formGroup}>
          <label htmlFor="joiningDate">Joining Date</label>
          <input type="date" id="joiningDate" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required disabled={isLoading}/>
        </div>
        {/* Leaving Date */}
        <div className={styles.formGroup}>
          <label htmlFor="leavingDate">Leaving Date (Optional)</label>
          <input type="date" id="leavingDate" name="leavingDate" value={formData.leavingDate || ''} onChange={handleInputChange} disabled={isLoading}/>
        </div>
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.buttonGroup}>
        <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isLoading}>Cancel</button>
        <button type="submit" className={styles.saveButton} disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Staff"}
        </button>
      </div>
    </form>
  );
};

export default AddStaffForm;
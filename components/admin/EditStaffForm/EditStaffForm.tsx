// components/admin/EditStaffForm/EditStaffForm.tsx

"use client";
import React, { useState, useEffect, FormEvent } from 'react';
import styles from './EditStaffForm.module.scss';

// Prop type (Matches InternalStaffMember from StaffPage)
interface StaffDataProp {
  id: number; // FIX: Changed to number
  staffId?: string; 
  name: string; 
  role: string;
  contactNumber?: string; 
  email: string; 
  joiningDate: string; // Formatted
  leavingDate?: string; // Formatted
  rawJoiningDate?: string; // Original ISO/string
  rawLeavingDate?: string; // Original ISO/string
}

// Form state type
interface FormDataState {
  staffId: string; 
  name: string; 
  role: string; 
  contactNumber: string;
  email: string; 
  joiningDate: string; // YYYY-MM-DD
  leavingDate: string; // YYYY-MM-DD
}

// Data sent back via onSave (Matches StaffPage expectation)
interface StaffFormData {
  staffId?: string; 
  name: string; 
  role: string; 
  contactNumber?: string; 
  email: string;
  joiningDate: string; // YYYY-MM-DD
  leavingDate?: string; // YYYY-MM-DD or undefined
}

// FIX: Props interface ko define kiya taaki 'onClose' error chala jaaye
interface EditStaffFormProps {
  onClose: () => void;
  onSave: (staffData: StaffFormData) => Promise<void>; 
  staffData: StaffDataProp; // Ab yeh number ID expect karega
}

// Helper to convert display/raw date to YYYY-MM-DD
const formatDateToInput = (dateStr?: string): string => {
  if (!dateStr || dateStr === 'N/A') return '';
  try {
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.toISOString().split('T')[0];
    }
    const displayDate = new Date(dateStr.replace(/(\d{2}) (\w{3}) (\d{4})/, '$2 $1 $3'));
    if (!isNaN(displayDate.getTime())) {
      return displayDate.toISOString().split('T')[0];
    }
    return ''; 
  } catch (e) {
    console.error("Error parsing date for input:", dateStr, e);
    return '';
  }
};

// FIX: Component ko props accept karne ke liye update kiya
const EditStaffForm = ({ onClose, onSave, staffData }: EditStaffFormProps) => {
  const [formData, setFormData] = useState<FormDataState>({
    staffId: staffData?.staffId || String(staffData?.id) || '', // FIX: staffId ab string(staffData.id) se generate hoga
    name: staffData?.name || '',
    role: staffData?.role || 'Accountant',
    contactNumber: staffData?.contactNumber || '', 
    email: staffData?.email || '',
    joiningDate: formatDateToInput(staffData?.rawJoiningDate || staffData?.joiningDate),
    leavingDate: formatDateToInput(staffData?.rawLeavingDate || staffData?.leavingDate),
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Update form if staffData prop changes
  useEffect(() => {
    if (staffData) {
      setFormData({
        staffId: staffData.staffId || String(staffData.id) || '', // FIX: Use String(staffData.id)
        name: staffData.name || '',
        role: staffData.role || 'Accountant',
        contactNumber: staffData.contactNumber || '',
        email: staffData.email || '',
        joiningDate: formatDateToInput(staffData?.rawJoiningDate || staffData?.joiningDate),
        leavingDate: formatDateToInput(staffData?.rawLeavingDate || staffData?.leavingDate),
      });
      setError('');
    }
  }, [staffData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => { 
    e.preventDefault();
    setError('');

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    const dataToSave: StaffFormData = {
      staffId: formData.staffId,
      name: formData.name,
      role: formData.role,
      contactNumber: formData.contactNumber,
      email: formData.email,
      joiningDate: formData.joiningDate, 
      leavingDate: formData.leavingDate || undefined, 
    };

    try {
      await onSave(dataToSave);
      // onClose(); // Parent component (StaffPage) ab modal ko close karega
    } catch (err) {
      console.error("Error passed back to EditStaffForm:", err);
      setError("Failed to update staff. Please try again."); // Error dikhaya
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        {/* Staff ID (Read-only) */}
        <div className={styles.formGroup}>
          <label htmlFor="staffId">Staff ID</label>
          <input type="text" id="staffId" name="staffId" value={formData.staffId} onChange={handleInputChange} required readOnly disabled />
        </div>
        {/* Full Name */}
        <div className={styles.formGroup}>
          <label htmlFor="name">Full Name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required disabled={isLoading}/>
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
        {/* Email Address */}
        <div className={styles.formGroup}>
          <label htmlFor="email">Email Address</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="staff@example.com" disabled={isLoading}/>
           <small>Used for login. Changing might affect user login.</small>
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
            {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};
export default EditStaffForm;
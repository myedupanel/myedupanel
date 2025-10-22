"use client";
import React, { useState, useEffect } from 'react';
import styles from './EditStaffForm.module.scss';

// Helper function
const formatDateToInput = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    // Attempt to handle different potential date formats gracefully
    const date = new Date(dateStr.replace(/,/g, '').replace(/(\d{2}) (\w{3}) (\d{4})/, '$2 $1 $3'));
    if (isNaN(date.getTime())) return ''; // Return empty if date is invalid
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.error("Error parsing date:", dateStr, e);
    return '';
  }
};

// FIX 1: Define an interface for the form data state
interface FormDataState {
  name: string;
  role: string; // Consider using a specific type like StaffRole if defined elsewhere
  contact: string;
  joiningDate: string;
  leavingDate?: string | null; // Make leavingDate optional or allow null
  // Add any other properties from staffData that might be included
  [key: string]: any; // Allows for other properties from staffData
}

interface EditStaffFormProps {
  onClose: () => void;
  onSave: (staffData: any) => void;
  staffData: any; // Keep 'any' for flexibility if staffData structure varies
}

const EditStaffForm = ({ onClose, onSave, staffData }: EditStaffFormProps) => {
  // FIX 2: Use the FormDataState interface for the state
  const [formData, setFormData] = useState<FormDataState>({
    name: staffData?.name || '',
    role: staffData?.role || 'Teacher', // Default role
    contact: staffData?.contact || '',
    joiningDate: formatDateToInput(staffData?.joiningDate),
    leavingDate: formatDateToInput(staffData?.leavingDate),
    ...staffData // Spread remaining properties
  });

  // Update form if staffData prop changes
  useEffect(() => {
    if (staffData) {
        setFormData({
            name: staffData.name || '',
            role: staffData.role || 'Teacher',
            contact: staffData.contact || '',
            joiningDate: formatDateToInput(staffData.joiningDate),
            leavingDate: formatDateToInput(staffData.leavingDate),
            ...staffData
        });
    }
  }, [staffData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // FIX 3: Add the FormDataState type to the 'prev' parameter
    setFormData((prev: FormDataState) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert dates back to the desired display format before saving
    const dataToSave = {
      ...formData,
      // Ensure date conversion handles potentially empty strings
      joiningDate: formData.joiningDate ? new Date(formData.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      leavingDate: formData.leavingDate ? new Date(formData.leavingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined,
    };
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Full Name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="role">Role</label>
          <select id="role" name="role" value={formData.role} onChange={handleInputChange}>
            <option value="Teacher">Teacher</option>
            <option value="Accountant">Accountant</option>
            <option value="Office Admin">Office Admin</option>
            <option value="Librarian">Librarian</option>
            <option value="Security">Security</option>
            <option value="Transport Staff">Transport Staff</option>
            <option value="Other">Other</option> 
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="contact">Contact Number</label>
          <input type="tel" id="contact" name="contact" value={formData.contact} onChange={handleInputChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="joiningDate">Joining Date</label>
          <input type="date" id="joiningDate" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="leavingDate">Leaving Date (Optional)</label>
          {/* Use || '' to ensure value is never null/undefined for the input */}
          <input type="date" id="leavingDate" name="leavingDate" value={formData.leavingDate || ''} onChange={handleInputChange} />
        </div>
      </div>
      <div className={styles.buttonGroup}>
        <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
        <button type="submit" className={styles.saveButton}>Save Changes</button>
      </div>
    </form>
  );
};

export default EditStaffForm;
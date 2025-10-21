"use client";
import React, { useState, useEffect } from 'react';
import styles from './EditStaffForm.module.scss';

// Helper function: "DD Mon YYYY" ko "YYYY-MM-DD" mein badalta hai
const formatDateToInput = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr.replace(/,/g, ''));
    return date.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

interface EditStaffFormProps {
  onClose: () => void;
  onSave: (staffData: any) => void;
  staffData: any;
}

const EditStaffForm = ({ onClose, onSave, staffData }: EditStaffFormProps) => {
  const [formData, setFormData] = useState({
    ...staffData,
    joiningDate: formatDateToInput(staffData.joiningDate),
    leavingDate: formatDateToInput(staffData.leavingDate),
  });

  useEffect(() => {
    setFormData({
      ...staffData,
      joiningDate: formatDateToInput(staffData.joiningDate),
      leavingDate: formatDateToInput(staffData.leavingDate),
    });
  }, [staffData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      joiningDate: new Date(formData.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
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
            {/* --- YEH BADLAV HUA HAI --- */}
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
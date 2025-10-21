"use client";
import React, { useState } from 'react';
import styles from './AddStaffForm.module.scss';

interface AddStaffFormProps {
  onClose: () => void;
  onSave: (staffData: any) => void;
}

const AddStaffForm = ({ onClose, onSave }: AddStaffFormProps) => {
  const [formData, setFormData] = useState({
    staffId: '',
    name: '',
    role: 'Teacher', // Default role ko Teacher kar diya hai
    contact: '',
    joiningDate: new Date().toISOString().split('T')[0],
    leavingDate: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="staffId">Staff ID</label>
          <input type="text" id="staffId" name="staffId" value={formData.staffId} onChange={handleInputChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="name">Full Name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="role">Role</label>
          <select id="role" name="role" value={formData.role} onChange={handleInputChange}>
            <option value="Teacher">Teacher</option> {/* <-- YEH NAYA OPTION ADD HUA HAI */}
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
          <input type="date" id="leavingDate" name="leavingDate" value={formData.leavingDate} onChange={handleInputChange} />
        </div>
      </div>
      <div className={styles.buttonGroup}>
        <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
        <button type="submit" className={styles.saveButton}>Add Staff</button>
      </div>
    </form>
  );
};

export default AddStaffForm;
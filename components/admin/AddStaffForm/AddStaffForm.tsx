"use client";
import React, { useState, FormEvent } from 'react'; // Added FormEvent
import styles from './AddStaffForm.module.scss';

interface StaffFormData {
  staffId: string;
  name: string;
  role: string;
  contactNumber: string;
  email: string;
  joiningDate: string;
  leavingDate?: string;
}

interface AddStaffFormProps {
  onClose: () => void;
  onSave: (staffData: StaffFormData) => Promise<void>; // Make onSave return a Promise
}

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
  // --- ADD isLoading state ---
  const [isLoading, setIsLoading] = useState(false);
  // --- END ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => { // Make async
    e.preventDefault();
    setError('');

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
        setError('Please enter a valid email address.');
        return;
    }

    // --- Disable button ---
    setIsLoading(true);
    // --- END ---

    try {
        // --- Wait for onSave to complete ---
        await onSave(formData);
        // onClose(); // Let parent handle closing on success maybe via socket?
        // If onSave throws error, it will be caught below
    } catch (err) {
        // Error is already handled in StaffPage's onSave, maybe just log here
        console.error("Error passed back to AddStaffForm:", err);
        // setError("Failed to add staff. Please try again."); // Or show specific error?
    } finally {
        // --- Re-enable button ---
        setIsLoading(false);
        // --- END ---
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
        {/* Email Address */}
        <div className={styles.formGroup}>
          <label htmlFor="email">Email Address</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="staff@example.com" disabled={true}/>
          <small>Login details will be sent here.</small>
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
        {/* --- Disable buttons when loading --- */}
        <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isLoading}>Cancel</button>
        <button type="submit" className={styles.saveButton} disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Staff"}
        </button>
        {/* --- END --- */}
      </div>
    </form>
  );
};

export default AddStaffForm;
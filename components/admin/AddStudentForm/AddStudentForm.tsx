"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddStudentForm.module.scss';
import api from '@/backend/utils/api'; // Ensure correct path

// --- BADLAV 1: Add optional 'email' to FormData ---
interface FormData {
  studentId: string;
  name: string;
  class: string;
  rollNo: string;
  parentName: string;
  parentContact: string;
  email?: string; // Email is now optional
}
// --- END BADLAV 1 ---

interface AddStudentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onUpdate?: (data: Partial<FormData>) => void; // Update might include email
  existingStudent?: {
    _id: string;
  } & Partial<FormData> | null; // existingStudent might have email
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose, onSuccess, onUpdate, existingStudent }) => {
  // --- BADLAV 2: Add 'email' to initial state ---
  const [formData, setFormData] = useState<FormData>({
    studentId: '', name: '', class: '', rollNo: '', parentName: '', parentContact: '', email: '',
  });
  // --- END BADLAV 2 ---

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingStudent) {
      // --- BADLAV 3: Populate 'email' when editing ---
      setFormData({
        studentId: existingStudent.studentId || '',
        name: existingStudent.name || '',
        class: existingStudent.class || '',
        rollNo: existingStudent.rollNo || '',
        parentName: existingStudent.parentName || '',
        parentContact: existingStudent.parentContact || '',
        email: existingStudent.email || '', // Populate email if it exists
      });
      // --- END BADLAV 3 ---
    } else {
      // Reset form including email
      setFormData({
        studentId: '', name: '', class: '', rollNo: '', parentName: '', parentContact: '', email: '',
      });
    }
  }, [existingStudent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // --- Prepare data to send (includes optional email) ---
    const dataToSend: Partial<FormData> = { ...formData };
    // Remove email if it's empty, so backend treats it as undefined
    if (!dataToSend.email?.trim()) {
        delete dataToSend.email;
    }
    // --- End Prepare data ---

    try {
      if (existingStudent && onUpdate) {
        // Send updated data (including email if present) for update
        await onUpdate(dataToSend); // Assuming onUpdate handles partial updates
        onClose();
      } else {
        // Send data (including email if present) for creation
        await api.post('/students', dataToSend);
        onSuccess(); // Refresh the student list
        onClose();   // Close the modal
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || err.response?.data?.message || 'An error occurred. Please check all fields.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitButtonText = existingStudent ? 'Update Student' : 'Add Student';

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Existing Fields (Student ID, Name, Class, Roll No, Parent Name, Parent Contact) */}
      <div className={styles.inputGroup}>
        <label htmlFor="studentId">Student ID</label>
        <input type="text" id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} required disabled={!!existingStudent || isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="name">Student Name</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="class">Class</label>
        <input type="text" id="class" name="class" value={formData.class} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="rollNo">Roll No.</label>
        <input type="text" id="rollNo" name="rollNo" value={formData.rollNo} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="parentName">Parent's Name</label>
        <input type="text" id="parentName" name="parentName" value={formData.parentName} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="parentContact">Parent's Contact</label>
        <input type="tel" id="parentContact" name="parentContact" value={formData.parentContact} onChange={handleChange} required disabled={isLoading} />
      </div>

      {/* --- BADLAV 4: Add Email Input Field --- */}
      <div className={styles.inputGroup}>
        <label htmlFor="email">Student Email (Optional)</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email || ''} // Use empty string if undefined
          onChange={handleChange}
          disabled={isLoading}
          // Email is not required
        />
        <small>If provided, login details will be sent here.</small>
      </div>
      {/* --- END BADLAV 4 --- */}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={`${styles.btn} ${styles.cancelBtn}`} onClick={onClose} disabled={isLoading}>Cancel</button>
        <button type="submit" className={`${styles.btn} ${styles.submitBtn}`} disabled={isLoading}>
            {isLoading ? (existingStudent ? 'Updating...' : 'Adding...') : submitButtonText}
        </button>
      </div>
    </form>
  );
};

export default AddStudentForm;
// src/components/admin/students/AddStudentForm.tsx (or wherever it is)
"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddStudentForm.module.scss';
import api from '@/backend/utils/api'; // Ensure correct path

// --- Interface FormData (UPDATED) ---
interface FormData {
  studentId: string;
  name: string;
  class: string;
  rollNo: string;
  // ✅ ADDED dob and address (optional)
  dob?: string; // Date of Birth as string (YYYY-MM-DD)
  address?: string; // Address
  parentName: string;
  parentContact: string;
  email?: string;
}

interface AddStudentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onUpdate?: (data: Partial<FormData>) => void;
  existingStudent?: {
    id: string;
  } & Partial<FormData> | null;
}

const classOptions = [
  "Nursery", "LKG", "UKG",
  "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"
];

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose, onSuccess, onUpdate, existingStudent }) => {
  // ✅ UPDATED initial state
  const [formData, setFormData] = useState<FormData>({
    studentId: '', name: '', class: classOptions[0],
    rollNo: '', dob: '', address: '', // Initialize dob and address
    parentName: '', parentContact: '', email: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingStudent) {
      setFormData({
        studentId: existingStudent.studentId || '',
        name: existingStudent.name || '',
        class: classOptions.includes(existingStudent.class || '') ? existingStudent.class || classOptions[0] : classOptions[0],
        rollNo: existingStudent.rollNo || '',
        // ✅ Load dob and address if they exist
        dob: existingStudent.dob ? existingStudent.dob.split('T')[0] : '', // Format date for input
        address: existingStudent.address || '',
        parentName: existingStudent.parentName || '',
        parentContact: existingStudent.parentContact || '',
        email: existingStudent.email || '',
      });
    } else {
      // ✅ Reset dob and address too
      setFormData({
        studentId: '', name: '', class: classOptions[0], rollNo: '', dob: '', address: '',
        parentName: '', parentContact: '', email: '',
      });
    }
  }, [existingStudent]);

  // ✅ UPDATED handleChange to include textarea
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Prepare data, remove empty optional fields
    const dataToSend: Partial<FormData> = { ...formData };
    if (!dataToSend.email?.trim()) {
        delete dataToSend.email;
    }
    // ✅ Remove dob and address if empty
    if (!dataToSend.dob?.trim()) {
        delete dataToSend.dob;
    }
    if (!dataToSend.address?.trim()) {
        delete dataToSend.address;
    }

    try {
      if (existingStudent && onUpdate) {
        // Assuming onUpdate sends the data correctly
        await onUpdate(dataToSend);
        onClose();
      } else {
        // Ensure backend '/students' endpoint accepts dob and address
        await api.post('/students', dataToSend);
        onSuccess();
        onClose();
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
      {/* Student ID, Name, Class (No change) */}
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
        <select
          id="class"
          name="class"
          value={formData.class}
          onChange={handleChange}
          required
          disabled={isLoading}
          className={styles.selectInput}
        >
          {classOptions.map(option => (
            <option key={option} value={option}>
              {option === "Nursery" || option === "LKG" || option === "UKG" ? option : `Class ${option}`}
            </option>
          ))}
        </select>
      </div>

      {/* Roll No (No change) */}
       <div className={styles.inputGroup}>
        <label htmlFor="rollNo">Roll No.</label>
        <input type="text" id="rollNo" name="rollNo" value={formData.rollNo} onChange={handleChange} required disabled={isLoading} />
      </div>

      {/* === ADDED DOB and ADDRESS Fields === */}
      <div className={styles.inputGroup}>
        <label htmlFor="dob">Date of Birth (Optional)</label>
        <input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob || ''}
            onChange={handleChange}
            disabled={isLoading}
            className={styles.dateInput} // Optional class for styling
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="address">Address (Optional)</label>
        <textarea
            id="address"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            rows={3} // Adjust rows as needed
            disabled={isLoading}
            className={styles.textAreaInput} // Optional class for styling
        />
      </div>
      {/* === END ADDED Fields === */}


      {/* Parent Name, Parent Contact, Email (No change) */}
      <div className={styles.inputGroup}>
        <label htmlFor="parentName">Parent's Name</label>
        <input type="text" id="parentName" name="parentName" value={formData.parentName} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="parentContact">Parent's Contact</label>
        <input type="tel" id="parentContact" name="parentContact" value={formData.parentContact} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="email">Student Email (Optional)</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email || ''}
          onChange={handleChange}
          disabled={isLoading}
        />
        <small>If provided, login details will be sent here.</small>
      </div>

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
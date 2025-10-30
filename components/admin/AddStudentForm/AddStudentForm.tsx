// src/components/admin/students/AddStudentForm.tsx

"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddStudentForm.module.scss';
import api from '@/backend/utils/api'; // Ensure correct path

// --- Interface FormData (UPDATED) ---
interface FormData {
  studentId: string;
  // FIX: 'name' ko 'first_name' aur 'last_name' se badla
  first_name: string;
  last_name: string;
  // FIX: 'class' ko 'class_name' se badla
  class_name: string;
  // FIX: 'rollNo' ko 'roll_number' se badla
  roll_number: string;
  dob?: string; 
  address?: string; 
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
    studentId: '', 
    first_name: '', // FIX
    last_name: '', // FIX
    class_name: classOptions[0], // FIX
    roll_number: '', // FIX
    dob: '', 
    address: '', 
    parentName: '', 
    parentContact: '', 
    email: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingStudent) {
      setFormData({
        studentId: existingStudent.studentId || '',
        first_name: existingStudent.first_name || '', // FIX
        last_name: existingStudent.last_name || '', // FIX
        class_name: classOptions.includes(existingStudent.class_name || '') ? existingStudent.class_name || classOptions[0] : classOptions[0], // FIX
        roll_number: existingStudent.roll_number || '', // FIX
        dob: existingStudent.dob ? existingStudent.dob.split('T')[0] : '', 
        address: existingStudent.address || '',
        parentName: existingStudent.parentName || '',
        parentContact: existingStudent.parentContact || '',
        email: existingStudent.email || '',
      });
    } else {
      // Reset
      setFormData({
        studentId: '', 
        first_name: '', // FIX
        last_name: '', // FIX
        class_name: classOptions[0], // FIX
        roll_number: '', // FIX
        dob: '', 
        address: '',
        parentName: '', 
        parentContact: '', 
        email: '',
      });
    }
  }, [existingStudent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Prepare data, remove empty optional fields
    // Kyonki humne state keys badal di hain, dataToSend ab automatically sahi keys bhejega
    const dataToSend: Partial<FormData> = { ...formData };
    
    if (!dataToSend.email?.trim()) {
        delete dataToSend.email;
    }
    if (!dataToSend.dob?.trim()) {
        delete dataToSend.dob;
    }
    if (!dataToSend.address?.trim()) {
        delete dataToSend.address;
    }

    try {
      if (existingStudent && onUpdate) {
        await onUpdate(dataToSend);
        onClose();
      } else {
        // Ab yeh '/students' endpoint ko sahi keys bhejega
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
      <div className={styles.inputGroup}>
        <label htmlFor="studentId">Student ID</label>
        <input type="text" id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} required disabled={!!existingStudent || isLoading} />
      </div>
      
      {/* --- FIX: "Student Name" ko "First Name" aur "Last Name" mein toda --- */}
      <div className={styles.inputGroup}>
        <label htmlFor="first_name">First Name</label>
        <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="last_name">Last Name</label>
        <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required disabled={isLoading} />
      </div>
      {/* --- END FIX --- */}

       <div className={styles.inputGroup}>
        <label htmlFor="class_name">Class</label> {/* FIX: name attribute badla */}
        <select
          id="class_name"
          name="class_name" // FIX
          value={formData.class_name} // FIX
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

       <div className={styles.inputGroup}>
        <label htmlFor="roll_number">Roll No.</label> {/* FIX: name attribute badla */}
        <input type="text" id="roll_number" name="roll_number" value={formData.roll_number} onChange={handleChange} required disabled={isLoading} />
      </div>

      {/* Baaki ke fields (DOB, Address, etc.) same rahenge */}
      <div className={styles.inputGroup}>
        <label htmlFor="dob">Date of Birth (Optional)</label>
        <input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob || ''}
            onChange={handleChange}
            disabled={isLoading}
            className={styles.dateInput} 
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="address">Address (Optional)</label>
        <textarea
            id="address"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            rows={3} 
            disabled={isLoading}
            className={styles.textAreaInput} 
        />
      </div>
      
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
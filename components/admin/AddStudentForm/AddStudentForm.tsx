// src/components/admin/students/AddStudentForm.tsx

"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddStudentForm.module.scss';
import api from '@/backend/utils/api'; // Ensure correct path

// --- Interface FormData (UPDATED TO MATCH PRISMA SCHEMA) ---
interface FormData {
  // FIX: 'studentId' ko 'roll_number' se badla (yeh form ka "Student ID" field hai)
  roll_number: string; 
  first_name: string;
  last_name: string;
  class_name: string;
  
  // FIX: 'parentName' ko 'father_name' se badla
  father_name: string; 
  // FIX: 'parentContact' ko 'guardian_contact' se badla
  guardian_contact: string; 
  
  // Optional fields from schema
  dob?: string; 
  address?: string; 
  email?: string;
  
  // --- NEW: Added all missing optional fields ---
  mother_name?: string;
  uid_number?: string; // Aadhar
  nationality?: string;
  caste?: string;
  birth_place?: string;
  previous_school?: string;
  admission_date?: string; // YYYY-MM-DD
}

interface AddStudentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onUpdate?: (data: Partial<FormData>) => void;
  // FIX: 'id' ko 'studentid' (number) kiya, jaisa parent page se aayega
  existingStudent?: {
    studentid: number; 
  } & Partial<FormData> | null;
}

const classOptions = [
  "Nursery", "LKG", "UKG",
  "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"
];

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose, onSuccess, onUpdate, existingStudent }) => {
  
  // ✅ UPDATED initial state with all new fields
  const [formData, setFormData] = useState<FormData>({
    first_name: '', 
    last_name: '', 
    class_name: classOptions[0], 
    roll_number: '', // Yeh "Student ID" field hai
    dob: '', 
    address: '', 
    father_name: '', 
    guardian_contact: '', 
    email: '',
    mother_name: '',
    uid_number: '',
    nationality: '',
    caste: '',
    birth_place: '',
    previous_school: '',
    admission_date: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Function to format date strings for input[type="date"]
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    if (existingStudent) {
      setFormData({
        roll_number: existingStudent.roll_number || '',
        first_name: existingStudent.first_name || '',
        last_name: existingStudent.last_name || '',
        class_name: classOptions.includes(existingStudent.class_name || '') ? existingStudent.class_name || classOptions[0] : classOptions[0],
        dob: formatDate(existingStudent.dob),
        address: existingStudent.address || '',
        father_name: existingStudent.father_name || '',
        guardian_contact: existingStudent.guardian_contact || '',
        email: existingStudent.email || '',
        mother_name: existingStudent.mother_name || '',
        uid_number: existingStudent.uid_number || '',
        nationality: existingStudent.nationality || '',
        caste: existingStudent.caste || '',
        birth_place: existingStudent.birth_place || '',
        previous_school: existingStudent.previous_school || '',
        admission_date: formatDate(existingStudent.admission_date),
      });
    } else {
      // Reset all fields
      setFormData({
        first_name: '', last_name: '', class_name: classOptions[0], roll_number: '',
        dob: '', address: '', father_name: '', guardian_contact: '', email: '',
        mother_name: '', uid_number: '', nationality: '', caste: '',
        birth_place: '', previous_school: '', admission_date: '',
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
    const dataToSend: Partial<FormData> = { ...formData };
    
    // Delete all optional keys if they are empty strings
    (Object.keys(dataToSend) as Array<keyof FormData>).forEach(key => {
        // Required fields ko chhodkar
        if (key !== 'first_name' && key !== 'last_name' && key !== 'class_name' && key !== 'roll_number' && key !== 'father_name' && key !== 'guardian_contact') {
            if (!dataToSend[key] || dataToSend[key] === '') {
                delete dataToSend[key];
            }
        }
    });

    try {
      if (existingStudent && onUpdate) {
        // Update logic (agar zaroorat pade)
        await onUpdate(dataToSend);
        onClose();
      } else {
        // Create logic - Ab yeh backend ko sahi data bhejega
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
      
      {/* --- Required Fields --- */}
      <div className={styles.inputGroup}>
        {/* FIX: Yeh field ab 'roll_number' hai */}
        <label htmlFor="roll_number">Student ID / Roll No.</label>
        <input type="text" id="roll_number" name="roll_number" value={formData.roll_number} onChange={handleChange} required disabled={isLoading} />
      </div>
      
      <div className={styles.inputGroup}>
        <label htmlFor="first_name">First Name</label>
        <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required disabled={isLoading} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="last_name">Last Name</label>
        <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required disabled={isLoading} />
      </div>

       <div className={styles.inputGroup}>
        <label htmlFor="class_name">Class</label>
        <select
          id="class_name"
          name="class_name"
          value={formData.class_name}
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
        {/* FIX: Renamed to 'father_name' */}
        <label htmlFor="father_name">Parent's / Father's Name</label>
        <input type="text" id="father_name" name="father_name" value={formData.father_name} onChange={handleChange} required disabled={isLoading} />
      </div>

      <div className={styles.inputGroup}>
        {/* FIX: Renamed to 'guardian_contact' */}
        <label htmlFor="guardian_contact">Parent's Contact</label>
        <input type="tel" id="guardian_contact" name="guardian_contact" value={formData.guardian_contact} onChange={handleChange} required disabled={isLoading} />
      </div>

      {/* --- Optional Fields --- */}

      <div className={styles.inputGroup}>
        <label htmlFor="mother_name">Mother's Name (Optional)</label>
        <input type="text" id="mother_name" name="mother_name" value={formData.mother_name || ''} onChange={handleChange} disabled={isLoading} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="dob">Date of Birth (Optional)</label>
        <input type="date" id="dob" name="dob" value={formData.dob || ''} onChange={handleChange} disabled={isLoading} className={styles.dateInput} />
      </div>
      
      <div className={styles.inputGroup}>
        <label htmlFor="admission_date">Admission Date (Optional)</label>
        <input type="date" id="admission_date" name="admission_date" value={formData.admission_date || ''} onChange={handleChange} disabled={isLoading} className={styles.dateInput} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="email">Student Email (Optional)</label>
        <input type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} disabled={isLoading} />
        <small>If provided, login details will be sent here.</small>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="uid_number">Aadhar / UID Number (Optional)</label>
        <input type="text" id="uid_number" name="uid_number" value={formData.uid_number || ''} onChange={handleChange} disabled={isLoading} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="nationality">Nationality (Optional)</label>
        <input type="text" id="nationality" name="nationality" value={formData.nationality || ''} onChange={handleChange} disabled={isLoading} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="caste">Caste (Optional)</label>
        <input type="text" id="caste" name="caste" value={formData.caste || ''} onChange={handleChange} disabled={isLoading} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="birth_place">Birth Place (Optional)</label>
        <input type="text" id="birth_place" name="birth_place" value={formData.birth_place || ''} onChange={handleChange} disabled={isLoading} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="previous_school">Previous School (Optional)</label>
        <input type="text" id="previous_school" name="previous_school" value={formData.previous_school || ''} onChange={handleChange} disabled={isLoading} />
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
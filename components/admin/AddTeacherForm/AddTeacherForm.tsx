"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddTeacherForm.module.scss';
import api from '@/backend/utils/api'; // Ensure correct path

// Yeh interface form ke fields ko define karta hai
interface TeacherData {
  teacherId: string;
  name: string;
  subject: string;
  contactNumber: string;
  // === FIX 1: Email ko optional banaya (delete error fix) ===
  email?: string;
}

// --- Email Lock Constant ---
const IS_EMAIL_LOCKED = true; // Temporary lock while staff/teacher dashboards are not ready
// ---

// Yeh interface 'page.tsx' se aa rahe data ko define karta hai
interface TeacherDataFromParent {
  teacher_dbid: number;
  teacherId: string;
  name: string;
  subject: string;
  contactNumber: string;
  email: string;
  schoolId?: string;
  schoolName?: string;
}

interface AddTeacherFormProps {
  onClose: () => void;
  onSubmit: (data: TeacherData) => void;
  existingTeacher?: TeacherDataFromParent | null;
}

const AddTeacherForm: React.FC<AddTeacherFormProps> = ({ onClose, onSubmit, existingTeacher }) => {
  const [formData, setFormData] = useState<TeacherData>({
    teacherId: '',
    name: '',
    subject: '',
    contactNumber: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


  useEffect(() => {
    if (existingTeacher) {
      setFormData({
        teacherId: existingTeacher.teacherId,
        name: existingTeacher.name,
        subject: existingTeacher.subject,
        contactNumber: existingTeacher.contactNumber,
        email: existingTeacher.email,
      });
    } else {
        setFormData({ teacherId: '', name: '', subject: '', contactNumber: '', email: '' });
    }
  }, [existingTeacher]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Original data copy
    const dataToSend = { ...formData };

    // === FIX 2: Submission Logic (Email को omit करना) ===
    let dataToSubmit: Partial<TeacherData> = dataToSend;

    if (IS_EMAIL_LOCKED) {
        // Email property को safely अलग करके बाकी data submit करें (delete error fix)
        // यह सुनिश्चित करता है कि backend को email field मिले ही नहीं।
        const { email, ...restOfData } = dataToSend; 
        dataToSubmit = restOfData;
    }
    // === END FIX 2 ===
    
    try {
        // dataToSubmit अब या तो पूरा data है, या email के बिना का data है।
        await onSubmit(dataToSubmit as TeacherData); 
    } catch (err: any) {
        setError(err.response?.data?.message || 'An error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="teacherId">Teacher ID</label>
        <input 
          type="text" 
          id="teacherId" 
          name="teacherId" 
          value={formData.teacherId} 
          onChange={handleChange} 
          required 
          disabled={isLoading || !!existingTeacher} 
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="name">Teacher Name</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="subject">Subject</label>
        <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="contactNumber">Contact Number</label>
        <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required disabled={isLoading} />
      </div>
      
      {/* === FIX 3: Email Address Field (Locked UI) === */}
      <div className={styles.formGroup}>
        <label htmlFor="email">Email Address (Login Disabled)</label>
        <input 
            type="email" 
            id="email" 
            name="email" 
            // Value को खाली रखें, ताकि गलती से भी data submit न हो
            value={IS_EMAIL_LOCKED ? '' : formData.email || ''} 
            onChange={handleChange} 
            // Lock active hone par, aur loading ke dauraan field disabled rahega
            disabled={IS_EMAIL_LOCKED || isLoading} 
            placeholder={IS_EMAIL_LOCKED ? 'Login feature upcoming...' : 'Enter email'}
        />
        {IS_EMAIL_LOCKED && (
            <small style={{ color: '#fa8c16' }}>
                Temporary Disabled: Staff/Teacher Login is currently under development.
            </small>
        )}
      </div>
      {/* === END FIX 3 === */}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.buttonGroup}>
        <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={isLoading}>Cancel</button>
        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? (existingTeacher ? 'Updating...' : 'Adding...') : (existingTeacher ? 'Update Teacher' : 'Add Teacher')}
        </button>
      </div>
    </form>
  );
};

export default AddTeacherForm;
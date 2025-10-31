// components/admin/AddTeacherForm/AddTeacherForm.tsx
"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddTeacherForm.module.scss';

// Yeh interface form ke fields ko define karta hai
interface TeacherData {
  teacherId: string;
  name: string;
  subject: string;
  contactNumber: string;
  email: string;
}

// --- YEH HAI AAPKA FIX ---
// Yeh interface 'page.tsx' se aa rahe data ko define karta hai
interface TeacherDataFromParent {
  teacher_dbid: number; // FIX: 'id: string' ko 'teacher_dbid: number' se badla
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
  // FIX: 'existingTeacher' ab naya 'TeacherDataFromParent' type expect karega
  existingTeacher?: TeacherDataFromParent | null;
}
// --- FIX ENDS HERE ---

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
      // Yeh 'existingTeacher' (naye type) se form ko set karega
      setFormData({
        teacherId: existingTeacher.teacherId,
        name: existingTeacher.name,
        subject: existingTeacher.subject,
        contactNumber: existingTeacher.contactNumber,
        email: existingTeacher.email,
      });
    } else {
        // Form ko reset karein
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
    try {
        // Yeh 'onSubmit' ko call karega, jo 'page.tsx' mein 'handleFormSubmit' hai
        await onSubmit(formData);
    } catch (err: any) {
        // Agar 'handleFormSubmit' (API call) fail hota hai, toh error yahaan dikhega
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
          // Edit karte waqt ID ko change nahi kar sakte
          disabled={isLoading || !!existingTeacher} 
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="name">Teacher Name</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="subject">Subject</label> {/* "Subject 2" ko "Subject" kar diya */}
        <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="contactNumber">Contact Number</label>
        <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email">Email Address</label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading} />
      </div>

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
"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddAssignmentForm.module.scss';

// Form data ka type
export type AssignmentFormData = {
  title: string;
  // FIX 1: studentName yahaan se hata diya
  classInfo: string; // FIX 2: 'class' ko 'classInfo' se badal diya
  subject: string;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Graded';
};

// Component ke props ka type
interface AddAssignmentFormProps {
  onSave: (data: AssignmentFormData) => void;
  onClose: () => void;
  initialData: Partial<AssignmentFormData> | null; // Partial<T> use kiya taaki sab fields optional ho edit ke time
}

// Default state define kiya taaki form reset kar sakein
const DEFAULT_FORM_DATA: AssignmentFormData = {
  title: '',
  // FIX 3: studentName yahaan se hata diya
  classInfo: '', // FIX 4: 'class' ko 'classInfo' se badal diya
  subject: '',
  dueDate: '',
  status: 'Pending',
};

const AddAssignmentForm = ({ onSave, onClose, initialData }: AddAssignmentFormProps) => {
  const [formData, setFormData] = useState<AssignmentFormData>(
    { ...DEFAULT_FORM_DATA, ...initialData } // Default ko initialData se merge kiya
  );

  const getTodayString = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  };
  
  useEffect(() => {
    // Jab bhi initialData badle, form state update ho
    // Agar add new hai (initialData null), toh default data set ho
    if (initialData) {
      // initialData mein optional fields ho sakte hain, isliye default se merge karein
       setFormData(prev => ({
           ...DEFAULT_FORM_DATA,
           ...initialData,
           // Date ko YYYY-MM-DD format mein convert karein agar woh full ISO string hai
           dueDate: initialData.dueDate ? initialData.dueDate.split('T')[0] : ''
       }));
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Title</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        
        {/* FIX 5: Student Name ka poora field hata diya */}
        
        <div className={styles.formGroup}>
          {/* FIX 6: Label aur input ko 'classInfo' ke liye update kiya */}
          <label htmlFor="classInfo">Class Info (e.g., Grade 10)</label>
          <input type="text" id="classInfo" name="classInfo" value={formData.classInfo} onChange={handleChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="subject">Subject</label>
          <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="dueDate">Due Date</label>
          <input type="date" id="dueDate" name="dueDate" value={formData.dueDate ? formData.dueDate.split('T')[0] : ''} onChange={handleChange} min={getTodayString()} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange} required>
            <option value="Pending">Pending</option>
            <option value="Submitted">Submitted</option>
            <option value="Graded">Graded</option>
          </select>
        </div>
      </div>
      
      <div className={styles.buttonContainer}> 
        <button type="submit" className={styles.submitButton}>
          {initialData ? 'Update Assignment' : 'Save Assignment'}
        </button>
        <button type="button" className={styles.cancelButton} onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddAssignmentForm;
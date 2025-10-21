"use client";
import React, { useState, useEffect } from 'react'; // <-- FIX 1: useEffect ko import kiya
import styles from './AddAssignmentForm.module.scss';

// Form data ka type
export type AssignmentFormData = {
  title: string;
  studentName: string;
  class: string;
  subject: string;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Graded';
};

// Component ke props ka type
interface AddAssignmentFormProps {
  onSave: (data: AssignmentFormData) => void;
  onClose: () => void; // <-- FIX 2: Modal band karne ke liye prop
  initialData: AssignmentFormData | null; // <-- FIX 2: Edit data receive karne ke liye prop
}

// Default state define kiya taaki form reset kar sakein
const DEFAULT_FORM_DATA: AssignmentFormData = {
  title: '',
  studentName: '',
  class: '',
  subject: '',
  dueDate: '',
  status: 'Pending',
};

const AddAssignmentForm = ({ onSave, onClose, initialData }: AddAssignmentFormProps) => {
  const [formData, setFormData] = useState<AssignmentFormData>(
    initialData || DEFAULT_FORM_DATA
  );

  const getTodayString = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  };
  
  // <-- FIX 1: useEffect Hook Add kiya ===
  // Yeh 'initialData' prop ko "sunega" (listen karega).
  // Jab bhi 'initialData' badlega (jaise user edit button pe click karega),
  // yeh form ke state ko naye data se update kar dega.
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Agar 'initialData' null hai (yaani "Add New" pe click hua), toh form ko reset karein
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [initialData]); // Yeh effect tabhi chalega jab 'initialData' badlega

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
        <div className={styles.formGroup}>
          <label htmlFor="studentName">Student Name</label>
          <input type="text" id="studentName" name="studentName" value={formData.studentName} onChange={handleChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="class">Class</label>
          <input type="text" id="class" name="class" value={formData.class} onChange={handleChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="subject">Subject</label>
          <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="dueDate">Due Date</label>
          <input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} min={getTodayString()} required />
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
      
      {/* <-- FIX 3: Buttons ko wrapper mein daala aur Cancel button add kiya */}
      <div className={styles.buttonContainer}> 
        <button type="submit" className={styles.submitButton}>
          {/* Bonus: Button ka text change karein agar edit kar rahe hain */}
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
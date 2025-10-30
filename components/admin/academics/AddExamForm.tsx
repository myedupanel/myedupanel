"use client";
import React, { useState, useEffect } from 'react'; // <-- FIX 1: useEffect ko import kiya
import styles from './AddExamForm.module.scss';

export type ExamFormData = { 
  examName: string; 
  class: string; 
  subject: string; 
  date: string; 
  time: string; 
  duration: string; 
};

interface AddExamFormProps {
  onSave: (data: ExamFormData) => void;
  onClose: () => void;
  initialData: ExamFormData | null; // <-- FIX 2: Edit data receive karne ke liye prop add kiya
}

// <-- FIX 3: Form ko reset karne ke liye default state banaya
const DEFAULT_FORM_DATA: ExamFormData = {
  examName: '', 
  class: '', 
  subject: '', 
  date: '', 
  time: '', 
  duration: '', 
};

const AddExamForm = ({ onSave, onClose, initialData }: AddExamFormProps) => {
  // <-- FIX 4: useState ko update kiya taaki woh initialData se start ho
  const [formData, setFormData] = useState<ExamFormData>(
    initialData || DEFAULT_FORM_DATA
  );

  // 1. Aaj ki taarikh ko YYYY-MM-DD format mein lein
  const getTodayString = () => {
    const today = new Date();
    // Month aur Day ke aage '0' lagayein agar woh 10 se chote hain
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  };

  // <-- FIX 5: useEffect Hook Add kiya ===
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
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="examName">Exam Name</label>
          <input type="text" id="examName" name="examName" value={formData.examName} onChange={handleChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="class">Class</label>
          <select id="class" name="class" value={formData.class} onChange={handleChange} required >
            <option value="">Select Class</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="subject">Subject</label>
          <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="date">Date</label>
          {/* Minimum date set kar di taaki purani date select na ho */}
          <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} min={getTodayString()} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="time">Time</label>
          <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="duration">Duration</label>
          <input type="text" id="duration" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g., 3 Hours" required />
        </div>
      </div>
      
      {/* <-- FIX 6: Cancel button add kiya aur submit button ko dynamic banaya */}
      <div className={styles.buttonContainer}>
        <button type="submit" className={styles.submitButton}>
          {initialData ? 'Update Exam' : 'Save Exam'}
        </button>
        <button type="button" className={styles.cancelButton} onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddExamForm;
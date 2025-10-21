"use client";
import React, { useState } from 'react';
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
}

const AddExamForm = ({ onSave, onClose }: AddExamFormProps) => {
  const [formData, setFormData] = useState<ExamFormData>({ 
    examName: '', 
    class: '', 
    subject: '', 
    date: '', 
    time: '', 
    duration: '', 
  });
  // 1. Aaj ki taarikh ko YYYY-MM-DD format mein lein
  const getTodayString = () => {
    const today = new Date();
    // Month aur Day ke aage '0' lagayein agar woh 10 se chote hain
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  };

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
          <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
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
      <button type="submit" className={styles.submitButton}>Save Exam</button>
    </form>
  );
};

export default AddExamForm;
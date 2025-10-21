"use client";
import React, { useState } from 'react';
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
}

const AddAssignmentForm = ({ onSave }: AddAssignmentFormProps) => {
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    studentName: '',
    class: '',
    subject: '',
    dueDate: '',
    status: 'Pending',
  });

  const getTodayString = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  };

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
      <button type="submit" className={styles.submitButton}>Save Assignment</button>
    </form>
  );
};

export default AddAssignmentForm;
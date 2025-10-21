"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddStudentForm.module.scss';
// --- BADLAV 1: 'axios' ki jagah naye 'api' helper ko import karein ---
import api from '@/backend/utils/api';

interface FormData {
  studentId: string;
  name: string;
  class: string;
  rollNo: string;
  parentName: string;
  parentContact: string;
}

interface AddStudentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onUpdate?: (data: Partial<FormData>) => void;
  existingStudent?: {
    _id: string;
  } & Partial<FormData> | null;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose, onSuccess, onUpdate, existingStudent }) => {
  const [formData, setFormData] = useState<FormData>({
    studentId: '', name: '', class: '', rollNo: '', parentName: '', parentContact: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingStudent) {
      setFormData({
        studentId: existingStudent.studentId || '',
        name: existingStudent.name || '',
        class: existingStudent.class || '',
        rollNo: existingStudent.rollNo || '',
        parentName: existingStudent.parentName || '',
        parentContact: existingStudent.parentContact || '',
      });
    } else {
      setFormData({
        studentId: '', name: '', class: '', rollNo: '', parentName: '', parentContact: '',
      });
    }
  }, [existingStudent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (existingStudent && onUpdate) {
        await onUpdate(formData);
        onClose();
      } else {
        // --- BADLAV 2: axios.post -> api.post ---
        await api.post('/students', formData);
        onSuccess(); // Refresh the student list
        onClose();   // Close the modal
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || err.response?.data?.message || 'An error occurred. Please check all fields.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitButtonText = existingStudent ? 'Update Student' : 'Add Student';

  // Baaki saara JSX code bilkul same rahega
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <label htmlFor="studentId">Student ID</label>
        <input type="text" id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} required disabled={!!existingStudent} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="name">Student Name</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="class">Class</label>
        <input type="text" id="class" name="class" value={formData.class} onChange={handleChange} required />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="rollNo">Roll No.</label>
        <input type="text" id="rollNo" name="rollNo" value={formData.rollNo} onChange={handleChange} required />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="parentName">Parent's Name</label>
        <input type="text" id="parentName" name="parentName" value={formData.parentName} onChange={handleChange} required />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="parentContact">Parent's Contact</label>
        <input type="tel" id="parentContact" name="parentContact" value={formData.parentContact} onChange={handleChange} required />
      </div>
      
      {error && <p className={styles.error}>{error}</p>}
      
      <div className={styles.actions}>
        <button type="button" className={`${styles.btn} ${styles.cancelBtn}`} onClick={onClose} disabled={isLoading}>Cancel</button>
        <button type="submit" className={`${styles.btn} ${styles.submitBtn}`} disabled={isLoading}>{submitButtonText}</button>
      </div>
    </form>
  );
};

export default AddStudentForm;
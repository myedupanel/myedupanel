"use client";
import React, { useState } from 'react';
import styles from './AssignPeriodForm.module.scss';

// Sample Data (yeh data baad mein Teachers aur Subjects module se aayega)
const subjects = ["Maths", "Science", "English", "History", "Art"];
const teachers = ["Priya Sharma", "Rahul Verma", "Anjali Mehta"];

interface AssignPeriodFormProps {
  onClose: () => void;
  onSave: (data: { subject: string, teacher: string }) => void;
}

const AssignPeriodForm = ({ onClose, onSave }: AssignPeriodFormProps) => {
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ subject: selectedSubject, teacher: selectedTeacher });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="subject-select">Subject</label>
        <select 
          id="subject-select" 
          value={selectedSubject} 
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="teacher-select">Teacher</label>
        <select 
          id="teacher-select" 
          value={selectedTeacher} 
          onChange={(e) => setSelectedTeacher(e.target.value)}
        >
          {teachers.map(teacher => <option key={teacher} value={teacher}>{teacher}</option>)}
        </select>
      </div>
      <div className={styles.buttonGroup}>
        <button type="button" className={styles.cancelButton} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={styles.saveButton}>
          Assign Period
        </button>
      </div>
    </form>
  );
};

export default AssignPeriodForm;
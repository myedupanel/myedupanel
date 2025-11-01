"use client";
import React, { useState } from 'react';
import styles from './AssignPeriodForm.module.scss';

// Sample Data (Subjects ko abhi bhi hardcode rakha gaya hai)
const subjects = ["Maths", "Science", "English", "History", "Art"];

// --- FIX 1: Interface ko update kiya taaki missing props accept kare ---
interface AssignPeriodFormProps {
  onClose: () => void;
  // onSave mein ab 'class' bhi return karna hai
  onSave: (data: { subject: string, teacher: string, class: string }) => void; 
  
  // Missing Props add kiye
  classOptions: string[]; 
  teacherOptions: string[];
}

// --- FIX 2: Component logic update ki taaki props ka istemaal ho ---
const AssignPeriodForm = ({ onClose, onSave, classOptions, teacherOptions }: AssignPeriodFormProps) => {
  // Assuming the user is selecting SUBJECT and TEACHER
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
  const [selectedTeacher, setSelectedTeacher] = useState(teacherOptions[0] || '');
  
  // Naya state: Class selector ke liye
  const [selectedClass, setSelectedClass] = useState(classOptions[0] || ''); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !selectedTeacher || !selectedClass) {
        alert("Please select subject, teacher, and class.");
        return;
    }
    // onSave mein Class ko bhi return kiya
    onSave({ 
        subject: selectedSubject, 
        teacher: selectedTeacher,
        class: selectedClass 
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* NAYA: Class Selector (TimetablePage mein teacher view ke liye zaroori) */}
      <div className={styles.formGroup}>
        <label htmlFor="class-select">Assign to Class</label>
        <select 
          id="class-select" 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
        </select>
      </div>

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
          {teacherOptions.map(teacher => <option key={teacher} value={teacher}>{teacher}</option>)}
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
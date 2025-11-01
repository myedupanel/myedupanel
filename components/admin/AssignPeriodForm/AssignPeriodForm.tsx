"use client";
import React, { useState, useMemo } from 'react'; // <-- useMemo add kiya hai
import styles from './AssignPeriodForm.module.scss';
import Select from 'react-select';

// Comprehensive subject list (No Change)
const subjectOptions = [
  // Primary & Middle School
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Regional Language', label: 'Regional Language (Marathi, Tamil, etc.)' },
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'EVS (Environmental Science)', label: 'EVS (Environmental Science)' },
  { value: 'General Science', label: 'General Science' },
  { value: 'Social Science', label: 'Social Science' },
  { value: 'Computer Science', label: 'Computer Science' },
  
  // High School (9th-10th)
  { value: 'History', label: 'History' },
  { value: 'Geography', label: 'Geography' },
  { value: 'Civics / Political Science', label: 'Civics / Political Science' },
  { value: 'Economics', label: 'Economics' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Biology', label: 'Biology' },

  // Senior Secondary (11th-12th) - Science
  { value: 'Physics (11-12)', label: 'Physics (11-12)' },
  { value: 'Chemistry (11-12)', label: 'Chemistry (11-12)' },
  { value: 'Biology (11-12)', label: 'Biology (11-12)' },
  { value: 'Mathematics (11-12)', label: 'Mathematics (11-12)' },
  
  // Senior Secondary (11th-12th) - Commerce
  { value: 'Accountancy', label: 'Accountancy' },
  { value: 'Business Studies', label: 'Business Studies' },
  { value: 'Economics (11-12)', label: 'Economics (11-12)' },

  // Senior Secondary (11th-12th) - Arts/Humanities
  { value: 'History (11-12)', label: 'History (11-12)' },
  { value: 'Political Science (11-12)', label: 'Political Science (11-12)' },
  { value: 'Psychology', label: 'Psychology' },
  { value: 'Sociology', label: 'Sociology' },
  { value: 'Philosophy', label: 'Philosophy' },

  // Co-curricular & Other
  { value: 'Physical Education', label: 'Physical Education' },
  { value: 'Art & Craft', label: 'Art & Craft' },
  { value: 'Music', label: 'Music' },
  { value: 'Moral Science', label: 'Moral Science' },
];

// --- YEH NICHE WALA BLOCK DELETE KAR DIYA HAI ---
// const teacherOptions = [
//   { value: 'Priya Sharma', label: 'Priya Sharma' },
//   { value: 'Rahul Verma', label: 'Rahul Verma' },
//   { value: 'Anjali Mehta', label: 'Anjali Mehta' },
// ];
// --- END DELETE ---

// --- FIX 1: Interface ko update kiya ---
interface AssignPeriodFormProps {
  onClose: () => void;
  onSave: (data: { subject: string, teacher: string }) => void;
  classOptions: string[];    // <-- Yeh line add ki
  teacherOptions: string[];  // <-- Yeh line add ki
}

// --- FIX 2: Props ko yahan receive kiya ---
const AssignPeriodForm = ({ onClose, onSave, classOptions, teacherOptions }: AssignPeriodFormProps) => {

  // --- FIX 3: teacherOptions (jo prop se aa rahe hain) ko 'react-select' format mein convert kiya ---
  const teacherSelectOptions = useMemo(() => {
    return teacherOptions.map(teacher => ({
      value: teacher,
      label: teacher,
    }));
  }, [teacherOptions]);
  // --- END FIX 3 ---

  const [selectedSubject, setSelectedSubject] = useState(subjectOptions[0]);
  
  // --- FIX 4: Initial state ko prop wale options se set kiya ---
  const [selectedTeacher, setSelectedTeacher] = useState(teacherSelectOptions[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ subject: selectedSubject.value, teacher: selectedTeacher.value });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="subject-select">Subject</label>
        <Select
          id="subject-select"
          instanceId="subject-select"
          options={subjectOptions}
          value={selectedSubject}
          onChange={(option) => setSelectedSubject(option as any)}
          classNamePrefix="react-select"
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="teacher-select">Teacher</label>
        <Select
          id="teacher-select"
          instanceId="teacher-select"
          // --- FIX 5: Hardcoded options ki jagah prop wale options use kiye ---
          options={teacherSelectOptions} 
          value={selectedTeacher}
          onChange={(option) => setSelectedTeacher(option as any)}
          classNamePrefix="react-select"
        />
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
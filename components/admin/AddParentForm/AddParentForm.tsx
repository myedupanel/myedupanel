"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddParentForm.module.scss';
import axios from 'axios';
import Select from 'react-select'; // <-- Naya import

interface Student {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  contactNumber: string;
  email: string;
  occupation: string;
  studentId: string;
}

interface AddParentFormProps {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  existingParent?: { studentId: { id: string } } & Omit<FormData, 'studentId'> | null;
}

// Dropdown ke liye premium styling
const customStyles = {
  control: (provided: any) => ({
    ...provided,
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    padding: '0.3rem',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#3B82F6',
    },
  }),
  option: (provided: any, state: { isSelected: boolean; isFocused: boolean; }) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : '#ffffff',
    color: state.isSelected ? '#ffffff' : '#374151',
  }),
};

const AddParentForm: React.FC<AddParentFormProps> = ({ onClose, onSubmit, existingParent }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contactNumber: '',
    email: '',
    occupation: '',
    studentId: '',
  });
  
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('/api/students');
        setStudents(res.data);
      } catch (error) {
        console.error("Failed to fetch students for form", error);
      }
    };
    fetchStudents();
  }, []);
  
  useEffect(() => {
    if (existingParent) {
      setFormData({
        name: existingParent.name,
        contactNumber: existingParent.contactNumber,
        email: existingParent.email,
        occupation: existingParent.occupation,
        studentId: existingParent.studentId?.id || '',
      });
    }
  }, [existingParent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // react-select ke liye special handler
  const handleStudentSelect = (selectedOption: any) => {
    setFormData({ ...formData, studentId: selectedOption.value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) {
      alert("Please select a student.");
      return;
    }
    setIsLoading(true);
    await onSubmit(formData);
    setIsLoading(false);
  };
  
  // Student data ko react-select ke format { value, label } mein badlein
  const studentOptions = students.map(student => ({
    value: student.id,
    label: student.name,
  }));

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Parent Name</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="contactNumber">Contact</label>
        <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email">Email</label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="occupation">Occupation</label>
        <input type="text" id="occupation" name="occupation" value={formData.occupation} onChange={handleChange} disabled={isLoading} />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="studentId">Select Student</label>
        <Select
          id="studentId"
          name="studentId"
          options={studentOptions}
          styles={customStyles}
          placeholder="Search and select a student..."
          onChange={handleStudentSelect}
          value={studentOptions.find(option => option.value === formData.studentId)}
          isDisabled={isLoading}
        />
      </div>

      <div className={styles.buttonGroup}>
        <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={isLoading}>Cancel</button>
        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? 'Saving...' : (existingParent ? 'Update Parent' : 'Add Parent')}
        </button>
      </div>
    </form>
  );
};

export default AddParentForm;
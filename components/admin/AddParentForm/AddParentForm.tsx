// components/admin/AddParentForm.module.scss

"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddParentForm.module.scss';
import axios from 'axios';
import Select from 'react-select'; 
import api from '@/backend/utils/api'; // <-- axios ke bajaye api instance ka istemaal karein

// --- FIX 1: Interface ko API response se match karein ---
interface ApiStudent {
  studentid: number;
  first_name: string;
  last_name: string;
  class: { class_name: string } | null;
  // (Baaki fields ki zaroorat nahi hai, lekin API yeh bhejta hai)
}

// --- FIX 2: FormData mein studentId ko number karein ---
interface FormData {
  name: string;
  contactNumber: string;
  email: string;
  occupation: string;
  studentId: number | null; // <-- String se number (ya null) kiya
}

// --- FIX 3: existingParent prop mein bhi ID ko number karein ---
interface AddParentFormProps {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  existingParent?: { studentId: { id: number } } & Omit<FormData, 'studentId'> | null;
}

// Dropdown ke liye premium styling (No Change)
const customStyles = {
  // ... (aapke styles same rahenge)
};

// --- FIX 4: Student ka poora naam jodne ke liye helper function ---
const getFullName = (s: { first_name?: string, last_name?: string }) => [s.first_name, s.last_name].filter(Boolean).join(' ');

const AddParentForm: React.FC<AddParentFormProps> = ({ onClose, onSubmit, existingParent }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contactNumber: '',
    email: '',
    occupation: '',
    studentId: null, // <-- Default null rakha
  });
  
  const [students, setStudents] = useState<ApiStudent[]>([]); // <-- FIX: Naya interface use kiya
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // --- FIX 5: axios.get ko api.get se badla ---
        const res = await api.get('/students'); // API ab poora student list bhejta hai
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
        studentId: existingParent.studentId?.id || null, // <-- ID ab number hai
      });
    }
  }, [existingParent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStudentSelect = (selectedOption: any) => {
    setFormData({ ...formData, studentId: selectedOption.value }); // <-- Value ab number hai
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
  
  // --- FIX 6: Student data ko react-select format mein sahi se map karein ---
  const studentOptions = students.map(student => ({
    value: student.studentid, // <-- Sahi ID (number)
    label: `${getFullName(student)} (Class: ${student.class?.class_name || 'N/A'})` // <-- Sahi Naam
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
          options={studentOptions} // <-- Ab ismein sahi data hai
          styles={customStyles}
          placeholder="Search and select a student..."
          onChange={handleStudentSelect}
          // --- FIX 7: Value ko find karne ka logic update kiya ---
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
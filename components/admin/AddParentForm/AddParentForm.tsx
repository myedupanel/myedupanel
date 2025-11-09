// components/admin/AddParentForm/AddParentForm.tsx
"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddParentForm.module.scss';
import api from '@/backend/utils/api'; 
import AsyncSelect from 'react-select/async'; 

// --- Interface Definitions ---
interface StudentSearchResult {
  id: number; 
  name: string; 
  class: string;
}

interface FormData {
  name: string;
  contactNumber: string;
  email: string;
  occupation: string;
  studentId: number | null; 
}

interface SelectOption {
  value: number;
  label: string;
}

interface AddParentFormProps {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  existingParent?: { 
    // FIX: 'studentid' ko 'number | null' kiya
    studentid: number | null; 
    studentName: string; 
  } & Omit<FormData, 'studentId'> | null;
}

// Dropdown ke liye styling
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

// --- Live Search Function ---
const loadStudentOptions = (
  inputValue: string,
  callback: (options: SelectOption[]) => void) => {
  if (!inputValue || inputValue.length < 2) {
    callback([]);
    return;
  }
  api.get(`/students/search?name=${inputValue}`)
    .then(res => {
      const results: StudentSearchResult[] = res.data;
      const options = results.map(student => ({
        value: student.id, 
        label: `${student.name} (Class: ${student.class})`,
      }));
      callback(options);
    })
    .catch(err => {
      console.error("Failed to search students", err);
      callback([]);
    });
};

// --- Component ---
const AddParentForm: React.FC<AddParentFormProps> = ({ onClose, onSubmit, existingParent }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contactNumber: '',
    email: '',
    occupation: '',
    studentId: null,
  });
  
  const [defaultStudentOption, setDefaultStudentOption] = useState<SelectOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingParent) {
      setFormData({
        name: existingParent.name,
        contactNumber: existingParent.contactNumber,
        email: existingParent.email,
        occupation: existingParent.occupation,
        studentId: existingParent.studentid || null, // Yeh ab 'number | null' se match karega
      });
      
      if (existingParent.studentid && existingParent.studentName) {
        setDefaultStudentOption({ 
            value: existingParent.studentid, 
            label: existingParent.studentName,
        });
      }
    }
  }, [existingParent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStudentSelect = (selectedOption: SelectOption | null) => {
    setFormData({ ...formData, studentId: selectedOption ? selectedOption.value : null });
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
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required disabled={true} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="occupation">Occupation</label>
        <input type="text" id="occupation" name="occupation" value={formData.occupation} onChange={handleChange} disabled={isLoading} />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="studentId">Select Student</label>
        <AsyncSelect
          id="studentId"
          name="studentId"
          loadOptions={loadStudentOptions} 
          styles={customStyles}
          placeholder="Type to search a student..."
          onChange={handleStudentSelect}
          defaultValue={defaultStudentOption} 
          isDisabled={isLoading || !!existingParent} 
          cacheOptions
          defaultOptions
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
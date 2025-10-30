"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddMaterialForm.module.scss';
import { MdUploadFile } from 'react-icons/md';

// Define the allowed categories
type MaterialCategory = 'Notes' | 'Worksheet' | 'Question Paper' | 'Syllabus' | 'Other'; // 'Other' add kiya

// FIX 1: Form data ka type update kiya
// Ismein ab 'className' hai (naaki 'class')
// Aur 'fileName'/'fileContent' hata diye hain, kyunki file ab alag se bhejenge
export type MaterialFormData = {
  title: string;
  className: string;
  subject: string;
  category: MaterialCategory;
};

interface AddMaterialFormProps {
  // FIX 2: onSave prop ab 2 arguments expect karega: metadata (formData) aur file object
  onSave: (data: MaterialFormData, file: File | null) => void;
  initialData?: Partial<MaterialFormData> | null; 
  onClose: () => void;
}

const classOptions = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const subjectOptions = ['Mathematics', 'Science', 'English', 'History', 'Geography'];
const categoryOptions: MaterialCategory[] = ['Notes', 'Worksheet', 'Question Paper', 'Syllabus', 'Other']; 

const AddMaterialForm = ({ onSave, initialData, onClose }: AddMaterialFormProps) => {
  const [formData, setFormData] = useState<MaterialFormData>({
    title: '', 
    className: classOptions[0], // FIX 3: 'class' ko 'className' kiya
    subject: subjectOptions[0], 
    category: 'Notes', 
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '', 
        className: initialData.className || classOptions[0], // FIX 4: 'class' ko 'className' kiya
        subject: initialData.subject || subjectOptions[0], 
        category: categoryOptions.includes(initialData.category as MaterialCategory) 
                    ? initialData.category as MaterialCategory 
                    : 'Notes',
      });
      setSelectedFile(null);
    } else {
       setFormData({
          title: '', 
          className: classOptions[0], 
          subject: subjectOptions[0], 
          category: 'Notes', 
       });
       setSelectedFile(null);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'category' ? value as MaterialCategory : value 
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // FIX 5: handleSubmit ko poori tarah update kiya
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Edit mode mein, file zaroori nahi hai
    if (initialData) {
      onSave(formData, null); // Edit mein file update support nahi kar rahe, sirf metadata
      return;
    }
    
    // Add mode mein file zaroori hai
    if (selectedFile) {
      // FileReader logic (fileContent) hata diya
      // Ab hum metadata (formData) aur poori file (selectedFile) alag-alag bhej rahe hain
      onSave(formData, selectedFile);
    } else {
      alert("Please select a file to upload.");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroupFull}>
        <label htmlFor="title">Title</label>
        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
      </div>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          {/* FIX 6: 'class' ko 'className' se replace kiya */}
          <label htmlFor="className">Class</label>
          <select id="className" name="className" value={formData.className} onChange={handleChange}>
            {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="subject">Subject</label>
          <select id="subject" name="subject" value={formData.subject} onChange={handleChange}>
            {subjectOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="category">Category</label>
          <select id="category" name="category" value={formData.category} onChange={handleChange}>
            {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.formGroupFull}>
        <label>Upload File</label>
        <label htmlFor="file-upload" className={`${styles.uploadArea} ${initialData ? styles.disabled : ''}`}>
          <MdUploadFile size={40} />
          {selectedFile ? <p>Selected: <strong>{selectedFile.name}</strong></p> 
           : initialData ? <p>Current file cannot be changed.</p>
           : <p>Drag &amp; drop or click</p>}
        </label>
        <input id="file-upload" type="file" onChange={handleFileChange} className={styles.hiddenInput} disabled={!!initialData} />
        {initialData && <p className={styles.note}>File cannot be changed during edit. To replace, delete and re-upload.</p>}
      </div>
      <div className={styles.formActions}> 
          <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
          <button type="submit" className={styles.submitButton}>Save Material</button>
      </div>
    </form>
  );
};

export default AddMaterialForm;
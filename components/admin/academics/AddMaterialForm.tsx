"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddMaterialForm.module.scss';
import { MdUploadFile } from 'react-icons/md';

// Define the allowed categories
type MaterialCategory = 'Notes' | 'Worksheet' | 'Question Paper' | 'Syllabus';

export type MaterialFormData = {
  title: string;
  class: string;
  subject: string;
  category: MaterialCategory; // Use the defined type
  fileName: string | null;
  fileContent: string | null; 
};

interface AddMaterialFormProps {
  onSave: (data: MaterialFormData) => void;
  // Using 'any' for initialData to handle potential variations, 
  // but ensure it has the expected properties before use.
  initialData?: any | null; 
  onClose: () => void; // Added onClose prop
}

const classOptions = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const subjectOptions = ['Mathematics', 'Science', 'English', 'History', 'Geography'];
const categoryOptions: MaterialCategory[] = ['Notes', 'Worksheet', 'Question Paper', 'Syllabus'];

const AddMaterialForm = ({ onSave, initialData, onClose }: AddMaterialFormProps) => { // Added onClose
  // FIX 1: Initialize formData with the correct type for 'category'
  const [formData, setFormData] = useState<Omit<MaterialFormData, 'fileName' | 'fileContent'>>({
    title: '', 
    class: classOptions[0], 
    subject: subjectOptions[0], 
    category: 'Notes', // Default value must be one of the allowed types
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '', 
        class: initialData.class || classOptions[0],
        subject: initialData.subject || subjectOptions[0], 
        // Ensure initial category is valid, otherwise default to 'Notes'
        category: categoryOptions.includes(initialData.category) ? initialData.category : 'Notes',
      });
    }
  }, [initialData]);

  // FIX 2: Added type for event 'e'
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // FIX 3: Added type for 'prev' state
    setFormData(prev => ({ 
      ...prev, 
      // FIX 4: Explicitly cast value for category to ensure type safety
      [name]: name === 'category' ? value as MaterialCategory : value 
    }));
  };

  // FIX 5: Added type for event 'e'
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // FIX 6: Added type for event 'e'
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile); 
      reader.onload = () => {
        onSave({
          ...formData,
          fileName: selectedFile.name,
          fileContent: reader.result as string, 
        });
      };
      reader.onerror = (error) => console.error("Error reading file:", error);
    } else if (initialData && initialData.fileName && initialData.fileContent) {
      // Ensure initialData exists and has file info before using it
      onSave({ 
          ...formData, 
          fileName: initialData.fileName, 
          fileContent: initialData.fileContent 
      });
    } else if (!initialData) { // Only require file if not in edit mode without a file
      alert("Please select a file to upload.");
    } else {
        // If in edit mode but somehow initialData is missing file info (should ideally not happen)
        onSave({ ...formData, fileName: null, fileContent: null }); 
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
          <label htmlFor="class">Class</label>
          <select id="class" name="class" value={formData.class} onChange={handleChange}>
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
          {/* Ensure value matches the state type */}
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
           : initialData?.fileName ? <p>Current: <strong>{initialData.fileName}</strong></p> 
           : <p>Drag &amp; drop or click</p>}
        </label>
        <input id="file-upload" type="file" onChange={handleFileChange} className={styles.hiddenInput} disabled={!!initialData} />
        {initialData && <p className={styles.note}>File cannot be changed during edit.</p>}
      </div>
      <div className={styles.formActions}> {/* Added wrapper for buttons */}
          <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
          <button type="submit" className={styles.submitButton}>Save Material</button>
      </div>
    </form>
  );
};
export default AddMaterialForm;
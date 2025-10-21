"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddMaterialForm.module.scss';
import { MdUploadFile } from 'react-icons/md';

export type MaterialFormData = {
  title: string;
  class: string;
  subject: string;
  category: 'Notes' | 'Worksheet' | 'Question Paper' | 'Syllabus';
  fileName: string | null;
  fileContent: string | null; // File ka content
};

interface AddMaterialFormProps {
  onSave: (data: MaterialFormData) => void;
  initialData?: any | null;
}
const classOptions = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const subjectOptions = ['Mathematics', 'Science', 'English', 'History', 'Geography'];

const AddMaterialForm = ({ onSave, initialData }: AddMaterialFormProps) => {
  const [formData, setFormData] = useState({
    title: '', class: classOptions[0], subject: subjectOptions[0], category: 'Notes',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title, class: initialData.class,
        subject: initialData.subject, category: initialData.category,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Agar user ne nayi file select ki hai
    if (selectedFile) {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile); // File ko Data URL mein padhein
      reader.onload = () => {
        onSave({
          ...formData,
          fileName: selectedFile.name,
          fileContent: reader.result as string, // Data URL ko save ke liye bhejein
        });
      };
      reader.onerror = (error) => console.error("Error reading file:", error);
    } else if (initialData) {
      // Agar edit mode mein hai aur nayi file select nahi ki
      onSave({ ...formData, fileName: initialData.fileName, fileContent: initialData.fileContent });
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
          <select id="category" name="category" value={(formData as any).category} onChange={handleChange}>
            <option value="Notes">Notes</option>
            <option value="Worksheet">Worksheet</option>
            <option value="Question Paper">Question Paper</option>
            <option value="Syllabus">Syllabus</option>
          </select>
        </div>
      </div>
      <div className={styles.formGroupFull}>
        <label>Upload File</label>
        <label htmlFor="file-upload" className={`${styles.uploadArea} ${initialData ? styles.disabled : ''}`}>
          <MdUploadFile size={40} />
          {selectedFile ? <p>Selected: <strong>{selectedFile.name}</strong></p> : initialData?.fileName ? <p>Current: <strong>{initialData.fileName}</strong></p> : <p>Drag & drop or click</p>}
        </label>
        <input id="file-upload" type="file" onChange={handleFileChange} className={styles.hiddenInput} disabled={!!initialData} />
        {initialData && <p className={styles.note}>File cannot be changed during edit.</p>}
      </div>
      <button type="submit" className={styles.submitButton}>Save Material</button>
    </form>
  );
};
export default AddMaterialForm;
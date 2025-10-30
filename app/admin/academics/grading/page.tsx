"use client";
import React, { useState, useEffect } from 'react';
import styles from './GradingSystemPage.module.scss';
import { MdSave, MdAddCircle, MdDelete } from 'react-icons/md';
import api from '@/backend/utils/api'; // API utility import karein
// uuid ki ab zaroorat nahi

// Updated Type (bina 'id' ke, kyunki backend array manage karega)
type GradeRule = {
  grade: string;
  minPercent: number | string; // Input ke liye string allow karein
  maxPercent: number | string;
};

// Default scale ab backend se aayega, par frontend mein fallback rakh sakte hain
const fallbackGradingScale: GradeRule[] = [
  { grade: 'A+', minPercent: 90, maxPercent: 100 },
  { grade: 'A', minPercent: 80, maxPercent: 89 },
  // ... baaki default grades ...
];

const GradingSystemPage = () => {
  const [gradingScale, setGradingScale] = useState<GradeRule[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [isSaving, setIsSaving] = useState(false); // Saving state for button

  // API se data fetch karein
  useEffect(() => {
    const fetchScale = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/settings/grading-scale');
        setGradingScale(response.data);
      } catch (err) {
        console.error("Failed to fetch grading scale:", err);
        setError("Could not load grading scale. Using default.");
        setGradingScale(fallbackGradingScale); // Error hone par fallback use karein
      } finally {
        setIsLoading(false);
      }
    };
    fetchScale();
  }, []); // Sirf ek baar load karein

  // Local state ko update karein (frontend mein changes dikhane ke liye)
  const handleScaleChange = (index: number, field: keyof GradeRule, value: string | number) => {
    setGradingScale(prevScale =>
      prevScale.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      )
    );
  };

  // API call karke changes save karein
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Validate data before sending (e.g., check for empty fields, overlaps)
      const isValid = gradingScale.every(rule =>
         rule.grade.trim() !== '' &&
         rule.minPercent !== '' && rule.maxPercent !== '' &&
         Number(rule.minPercent) <= Number(rule.maxPercent)
      );
      if (!isValid) {
          alert("Please fill all fields correctly and ensure Min % is not greater than Max %.");
          setIsSaving(false);
          return;
      }
      // Convert percentages to numbers before sending
      const scaleToSave = gradingScale.map(rule => ({
          ...rule,
          minPercent: Number(rule.minPercent),
          maxPercent: Number(rule.maxPercent),
      }));

      // API ko poora updated scale bhejein
      const response = await api.put('/settings/grading-scale', { scale: scaleToSave });
      setGradingScale(response.data); // Backend se updated data lein (optional, par consistent rehne ke liye accha hai)
      alert('Grading scale saved successfully!');

    } catch (err: any) {
      console.error("Failed to save grading scale:", err);
      setError(`Error saving scale: ${err.response?.data?.msg || err.message}`);
      alert(`Error saving scale: ${err.response?.data?.msg || err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Naya grade add karein (sirf local state mein, save button se API call hoga)
  const handleAddGrade = () => {
    const newGrade: GradeRule = {
      grade: '',
      minPercent: '',
      maxPercent: '',
    };
    // Naye grade ko aakhir mein add karein
    setGradingScale(prevScale => [...prevScale, newGrade]);
  };

  // Grade delete karein (sirf local state mein, save button se API call hoga)
  const handleDeleteGrade = (indexToDelete: number) => {
      // Confirmation add karna accha rahega
      if (window.confirm(`Are you sure you want to remove the grade "${gradingScale[indexToDelete].grade || 'new grade'}"? Changes will be saved when you click 'Save Changes'.`)) {
        setGradingScale(prevScale => prevScale.filter((_, index) => index !== indexToDelete));
      }
  };

  if (isLoading) return <div className={styles.loadingMessage}>Loading Grading System...</div>;
  // Error state ko optionally display kar sakte hain

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1>Grading System</h1>
        {/* Disable button while saving */}
        <button className={styles.saveButton} onClick={handleSaveChanges} disabled={isSaving}>
          <MdSave />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
       {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.settingsPanel}>
        <div className={`${styles.gradeRow} ${styles.headerRow}`}>
          <div className={styles.cell}>Grade</div>
          <div className={styles.cell}>Min Percentage</div>
          <div className={styles.cell}>Max Percentage</div>
          <div className={styles.cell}>Action</div>
        </div>

        {/* Ab hum 'index' ka use karenge identify karne ke liye, 'id' ki zaroorat nahi */}
        {gradingScale.map((rule, index) => (
          <div key={index} className={styles.gradeRow}>
            <input
              type="text"
              value={rule.grade}
              className={styles.input}
              onChange={(e) => handleScaleChange(index, 'grade', e.target.value)}
              placeholder="e.g., A+"
            />
            <input
              type="number"
              value={rule.minPercent}
              className={styles.input}
              onChange={(e) => handleScaleChange(index, 'minPercent', e.target.value)}
              placeholder="e.g., 90"
              min="0"
              max="100"
            />
            <input
              type="number"
              value={rule.maxPercent}
              className={styles.input}
              onChange={(e) => handleScaleChange(index, 'maxPercent', e.target.value)}
              placeholder="e.g., 100"
              min="0"
              max="100"
            />
            {/* Delete button ko 'index' pass karein */}
            <button className={styles.deleteButton} onClick={() => handleDeleteGrade(index)}>
              <MdDelete />
            </button>
          </div>
        ))}

        <div className={styles.actionsRow}>
          <button className={styles.addButton} onClick={handleAddGrade}>
            <MdAddCircle />
            Add New Grade
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradingSystemPage;
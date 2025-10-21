"use client";
import React, { useState, useEffect } from 'react';
import styles from './GradingSystemPage.module.scss';
import { MdSave, MdAddCircle, MdDelete } from 'react-icons/md';
import { v4 as uuidv4 } from 'uuid'; // Unique ID banane ke liye

// Pehle `uuid` install karein (agar nahi kiya hai): npm install uuid @types/uuid

type GradeRule = {
  id: string;
  grade: string;
  minPercent: number | string;
  maxPercent: number | string;
};

const defaultGradingScale: GradeRule[] = [
  { id: '1', grade: 'A+', minPercent: 90, maxPercent: 100 },
  { id: '2', grade: 'A', minPercent: 80, maxPercent: 89 },
  { id: '3', grade: 'B', minPercent: 70, maxPercent: 79 },
  { id: '4', grade: 'C', minPercent: 60, maxPercent: 69 },
  { id: '5', grade: 'D', minPercent: 40, maxPercent: 59 },
  { id: '6', grade: 'F', minPercent: 0, maxPercent: 39 },
];

const GradingSystemPage = () => {
  const [gradingScale, setGradingScale] = useState<GradeRule[]>([]);

  useEffect(() => {
    const savedScale = localStorage.getItem('gradingScale');
    if (savedScale) {
      setGradingScale(JSON.parse(savedScale));
    } else {
      setGradingScale(defaultGradingScale);
    }
  }, []);

  const handleScaleChange = (id: string, field: keyof GradeRule, value: string | number) => {
    setGradingScale(prevScale => 
      prevScale.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const handleSaveChanges = () => {
    localStorage.setItem('gradingScale', JSON.stringify(gradingScale));
    alert('Grading scale saved successfully!');
  };

  // 1. Naya grade add karne ka function
  const handleAddGrade = () => {
    const newGrade: GradeRule = {
      id: uuidv4(),
      grade: '',
      minPercent: '',
      maxPercent: '',
    };
    setGradingScale(prevScale => [...prevScale, newGrade]);
  };

  // 2. Grade delete karne ka function
  const handleDeleteGrade = (idToDelete: string) => {
    setGradingScale(prevScale => prevScale.filter(rule => rule.id !== idToDelete));
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1>Grading System</h1>
        <button className={styles.saveButton} onClick={handleSaveChanges}>
          <MdSave />
          Save Changes
        </button>
      </div>

      <div className={styles.settingsPanel}>
        <div className={`${styles.gradeRow} ${styles.headerRow}`}>
          <div className={styles.cell}>Grade</div>
          <div className={styles.cell}>Min Percentage</div>
          <div className={styles.cell}>Max Percentage</div>
          <div className={styles.cell}>Action</div>
        </div>

        {gradingScale.map((rule) => (
          <div key={rule.id} className={styles.gradeRow}>
            <input 
              type="text" 
              value={rule.grade} 
              className={styles.input}
              onChange={(e) => handleScaleChange(rule.id, 'grade', e.target.value)}
            />
            <input 
              type="number" 
              value={rule.minPercent} 
              className={styles.input}
              onChange={(e) => handleScaleChange(rule.id, 'minPercent', e.target.value === '' ? '' : parseInt(e.target.value))}
            />
            <input 
              type="number" 
              value={rule.maxPercent} 
              className={styles.input}
              onChange={(e) => handleScaleChange(rule.id, 'maxPercent', e.target.value === '' ? '' : parseInt(e.target.value))}
            />
            {/* 3. Delete button ko functional banayein */}
            <button className={styles.deleteButton} onClick={() => handleDeleteGrade(rule.id)}>
              <MdDelete />
            </button>
          </div>
        ))}

        <div className={styles.actionsRow}>
          {/* 4. Add button ko functional banayein */}
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
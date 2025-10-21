"use client";
import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api';
import styles from './AssignFee.module.scss';
import { FiSave } from 'react-icons/fi';
import StudentSearch from '@/components/admin/StudentSearch/StudentSearch';

const AssignFeePage = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const res = await api.get('/fees/templates');
        setTemplates(res.data);
      } catch (error) {
        console.error("Failed to fetch templates", error);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleAssignFee = async () => {
    if (!selectedStudent || !selectedTemplateId || !dueDate) {
      alert("Please select a student, a fee template, and a due date.");
      return;
    }
    try {
      const body = { studentId: selectedStudent._id, templateId: selectedTemplateId, dueDate };
      const res = await api.post('/fees/assign', body);
      alert(res.data.message);
      // Reset form on success
      setSelectedStudent(null);
      setSelectedTemplateId('');
      setDueDate('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to assign fee.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Assign Fee to Students</h1>
      </header>
      <div className={styles.formContainer}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>1</span>
            <h2 className={styles.sectionTitle}>Select Student</h2>
          </div>
          <div className={styles.sectionContent}>
            <StudentSearch onStudentSelect={setSelectedStudent} />
            {selectedStudent && (
              <div className={styles.selectedStudent}>
                Selected: <strong>{selectedStudent.name}</strong> (Class: {selectedStudent.class})
              </div>
            )}
          </div>
        </div>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>2</span>
            <h2 className={styles.sectionTitle}>Select Template</h2>
          </div>
          <div className={styles.sectionContent}>
            <select
              className={styles.selectInput}
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              disabled={loadingTemplates || templates.length === 0}
            >
              <option value="">{loadingTemplates ? 'Loading...' : 'Select a Fee Template'}</option>
              {templates.map((template) => (
                <option key={template._id} value={template._id}>
                  {template.name}
                </option>
              ))}
            </select>
            
            {/* ===== YEH NAYA MESSAGE HAI ===== */}
            {!loadingTemplates && templates.length === 0 && (
              <p className={styles.errorMessage}>
                No fee templates found. Please go to the "Fee Templates" page to create one first.
              </p>
            )}
          </div>
        </div>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>3</span>
            <h2 className={styles.sectionTitle}>Set Due Date</h2>
          </div>
          <div className={styles.sectionContent}>
            <input 
                type="date"
                className={styles.selectInput}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.actions}>
            <button className={styles.assignButton} onClick={handleAssignFee}>
                <FiSave /> Assign Fee
            </button>
        </div>
      </div>
    </div>
  );
};

export default AssignFeePage;
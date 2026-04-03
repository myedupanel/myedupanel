"use client";

import React, { useState } from 'react';
import styles from './AddAcademicYearForm.module.scss';
import api from '@/backend/utils/api';

interface AcademicYear {
  id: number;
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface Props {
  existingYear?: AcademicYear;
  onSuccess: () => void;
  onCancel: () => void;
}

const AddAcademicYearForm: React.FC<Props> = ({ existingYear, onSuccess, onCancel }) => {
  const isEditing = !!existingYear;
  
  const [formData, setFormData] = useState({
    yearName: existingYear?.yearName || '',
    startDate: existingYear?.startDate ? new Date(existingYear.startDate).toISOString().split('T')[0] : '',
    endDate: existingYear?.endDate ? new Date(existingYear.endDate).toISOString().split('T')[0] : '',
    isCurrent: existingYear?.isCurrent || false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.yearName || !formData.startDate || !formData.endDate) {
        throw new Error('Please fill in all required fields');
      }

      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        throw new Error('End date must be after start date');
      }

      if (isEditing) {
        // Update existing year
        await api.put(`/academic-years/${existingYear.id}`, formData);
      } else {
        // Create new year
        await api.post('/academic-years', formData);
      }

      alert(isEditing ? 'Year updated successfully!' : 'Year created successfully!');
      onSuccess();
    } catch (err: any) {
      console.error('Error saving year:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2>{isEditing ? 'Edit Academic Year' : 'Create New Academic Year'}</h2>
      
      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="yearName">Year Name *</label>
          <input
            type="text"
            id="yearName"
            name="yearName"
            value={formData.yearName}
            onChange={handleChange}
            placeholder="e.g., 2024-2025"
            required
          />
          <small>Format: YYYY-YYYY (e.g., 2024-2025)</small>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="startDate">Start Date *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="endDate">End Date *</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              name="isCurrent"
              checked={formData.isCurrent}
              onChange={handleChange}
            />
            <span>Set as current active year</span>
          </label>
          <small>Only one year can be current at a time. This will deactivate other years.</small>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Year' : 'Create Year')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAcademicYearForm;

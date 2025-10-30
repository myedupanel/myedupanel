"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddEventForm.module.scss';

export type EventFormData = {
  title: string;
  category: 'Sports' | 'Academic' | 'Cultural';
  date: string;
  status: 'Upcoming' | 'Completed' | 'Postponed';
};

interface AddEventFormProps {
  onSave: (data: EventFormData) => void;
  initialData?: any | null;
}

const AddEventForm = ({ onSave, initialData }: AddEventFormProps) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    category: 'Academic',
    date: '',
    status: 'Upcoming',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        category: initialData.category,
        date: initialData.date,
        status: initialData.status,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="title">Event Title</label>
        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
      </div>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="category">Category</label>
          <select id="category" name="category" value={formData.category} onChange={handleChange}>
            <option value="Academic">Academic</option>
            <option value="Sports">Sports</option>
            <option value="Cultural">Cultural</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="date">Date</label>
          <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="status">Status</label>
        <select id="status" name="status" value={formData.status} onChange={handleChange}>
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
          <option value="Postponed">Postponed</option>
        </select>
      </div>
      <button type="submit" className={styles.submitButton}>Save Event</button>
    </form>
  );
};

export default AddEventForm;
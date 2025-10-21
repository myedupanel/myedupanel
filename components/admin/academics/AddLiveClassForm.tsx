"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddLiveClassForm.module.scss';

export type LiveClassFormData = {
  topic: string;
  teacher: string;
  class: string;
  subject: string;
  date: string;
  time: string;
  meetingLink: string;
};

interface AddLiveClassFormProps {
  onSave: (data: LiveClassFormData) => void;
  initialData?: any | null;
}

const teacherOptions = ['Priya Sharma', 'Rahul Verma', 'Anjali Mehta'];
const classOptions = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const AddLiveClassForm = ({ onSave, initialData }: AddLiveClassFormProps) => {
  const [formData, setFormData] = useState<LiveClassFormData>({
    topic: '',
    teacher: teacherOptions[0],
    class: classOptions[0],
    subject: '',
    date: '',
    time: '',
    meetingLink: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        topic: initialData.topic,
        teacher: initialData.teacher,
        class: initialData.class,
        subject: initialData.subject,
        date: initialData.date,
        time: initialData.time,
        meetingLink: initialData.meetingLink,
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
    // Form ab ek wrapper hai
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Saare input fields ab is scrollable body ke andar hain */}
      <div className={styles.formBody}>
        <div className={styles.formGroup}>
          <label htmlFor="topic">Class Topic</label>
          <input type="text" id="topic" name="topic" value={formData.topic} onChange={handleChange} required />
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="teacher">Teacher</label>
            <select id="teacher" name="teacher" value={formData.teacher} onChange={handleChange}>
              {teacherOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="class">Class</label>
            <select id="class" name="class" value={formData.class} onChange={handleChange}>
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="subject">Subject</label>
            <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="date">Date</label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="time">Time</label>
            <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} required />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="meetingLink">Meeting Link (e.g., Zoom, Google Meet)</label>
          <input type="url" id="meetingLink" name="meetingLink" value={formData.meetingLink} onChange={handleChange} required />
        </div>
      </div>

      {/* Submit button ab ek alag footer mein hai */}
      <div className={styles.formFooter}>
        <button type="submit" className={styles.submitButton}>Save Schedule</button>
      </div>
    </form>
  );
};

export default AddLiveClassForm;
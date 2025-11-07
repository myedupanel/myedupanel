"use client";

import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api';
import styles from './PlanForm.module.scss'; // Iske liye nayi CSS file banayenge
import { MdSave } from 'react-icons/md';
import { Plan } from './page'; // Plan interface ko page.tsx se import karein

// Form ke props
interface PlanFormProps {
  initialData?: Plan | null; // Edit ke liye data
  onSave: () => void; // Parent ko batane ke liye ki save ho gaya
  onClose: () => void; // Modal band karne ke liye
}

const PlanForm: React.FC<PlanFormProps> = ({ initialData, onSave, onClose }) => {
  // Form ke har field ke liye state
  const [planId, setPlanId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [featuresStr, setFeaturesStr] = useState(''); // Features ke liye textarea
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Jab 'initialData' badlega (yaani Edit modal khulega), form ko bharo
  useEffect(() => {
    if (initialData) {
      setPlanId(initialData.id);
      setName(initialData.name);
      setPrice(String(initialData.price));
      setDescription(initialData.description || '');
      setFeaturesStr(initialData.features.join('\n')); // Array ko string mein (har feature nayi line par)
      setIsActive(initialData.isActive);
    } else {
      // Agar Create form hai, toh sab reset karo
      setPlanId('');
      setName('');
      setPrice('');
      setDescription('');
      setFeaturesStr('');
      setIsActive(true);
    }
  }, [initialData]);

  // Form submit logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Textarea (string) ko array mein badlo
    const features = featuresStr.split('\n').filter(feature => feature.trim() !== '');

    const payload = {
      id: planId.toUpperCase(),
      name,
      price: Number(price),
      description,
      features,
      isActive,
    };

    try {
      if (initialData) {
        // --- UPDATE (EDIT) LOGIC ---
        await api.put(`/plans/admin/${initialData.id}`, payload);
      } else {
        // --- CREATE (NEW) LOGIC ---
        await api.post('/plans/admin', payload);
      }
      onSave(); // Parent ko batao ki save ho gaya (taaki list refresh ho)

    } catch (err: any) {
      console.error("Failed to save plan:", err);
      setError(err.response?.data?.message || 'Failed to save plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        
        <div className={styles.formGrid}>
          {/* Column 1 */}
          <div className={styles.formColumn}>
            <div className={styles.formGroup}>
              <label htmlFor="planId">Plan ID (Unique)</label>
              <input
                id="planId"
                type="text"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                placeholder="e.g., STARTER, PRO"
                required
                disabled={!!initialData} // Edit karte time ID change nahi kar sakte
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="name">Plan Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Starter Plan"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="price">Price (INR)</label>
              <input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 4999"
                required
              />
            </div>
          </div>

          {/* Column 2 */}
          <div className={styles.formColumn}>
            <div className={styles.formGroup}>
              <label htmlFor="description">Description (Optional)</label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Basic plan for new schools"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="features">Features (One feature per line)</label>
              <textarea
                id="features"
                value={featuresStr}
                onChange={(e) => setFeaturesStr(e.target.value)}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                rows={5}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Plan is Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          {error && <p className={styles.error}>{error}</p>}
          <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className={styles.saveButton} disabled={isSubmitting}>
            <MdSave />
            {isSubmitting ? 'Saving...' : 'Save Plan'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default PlanForm;
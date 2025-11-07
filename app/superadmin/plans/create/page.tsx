"use client";

import React, { useState } from 'react';
import api from '@/backend/utils/api'; // Aapka global API helper
import styles from './CreatePlanPage.module.scss'; // Hum yeh CSS file bhi banayenge
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Redirect karne ke liye
import { MdArrowBack, MdSave } from 'react-icons/md';

const CreatePlanPage = () => {
  // Form ke har field ke liye state
  const [planId, setPlanId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [featuresStr, setFeaturesStr] = useState(''); // Features ko string ke roop mein store karne ke liye (textarea se)
  const [isActive, setIsActive] = useState(true); // Default naya plan active rakhein

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  // Form submit hone par yeh function chalega
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Main logic: Textarea ki string ko array mein badalna
    // Har line (\n) ko split karo aur khaali lines ko hata do
    const features = featuresStr.split('\n').filter(feature => feature.trim() !== '');

    try {
      // Backend API ko call karein (yeh route humne bana liya hai)
      await api.post('/plans/admin', {
        id: planId.toUpperCase(), // Plan ID hamesha UPPERCASE mein save karein
        name,
        price: Number(price),
        description,
        features, // Naya array
        isActive,
      });

      // Success par, waapis plans ki list par bhej do
      router.push('/superadmin/plans');

    } catch (err: any) {
      console.error("Failed to create plan:", err);
      setError(err.response?.data?.message || 'Failed to create plan. Check console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Create New Plan</h1>
        <Link href="/superadmin/plans" className={styles.backButton}>
          <MdArrowBack />
          <span>Back to Plans List</span>
        </Link>
      </header>

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
                  placeholder="e.g., STARTER, PRO (No spaces)"
                  required
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
                  placeholder="Admin Dashboard (Basic)&#10;Unlimited Student Management&#10;Fee Counter"
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
                  <span>Make this plan active immediately?</span>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.saveButton} disabled={isSubmitting}>
              <MdSave />
              {isSubmitting ? 'Saving...' : 'Save Plan'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreatePlanPage;
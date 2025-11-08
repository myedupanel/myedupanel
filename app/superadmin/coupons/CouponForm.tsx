"use client";

import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api';
import styles from './CouponForm.module.scss'; // Iske liye nayi CSS file banayenge
import { MdSave } from 'react-icons/md';
import { Coupon } from './page'; // Coupon interface ko main page se import karein

// Form ke props
interface CouponFormProps {
  initialData?: Coupon | null; // Edit ke liye data
  onSave: () => void; // Parent ko batane ke liye ki save ho gaya
  onClose: () => void; // Modal band karne ke liye
}

// Date ko YYYY-MM-DD format mein badalne ke liye helper
const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

const CouponForm: React.FC<CouponFormProps> = ({ initialData, onSave, onClose }) => {
  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [expiryDate, setExpiryDate] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Jab 'initialData' badlega (yaani Edit modal khulega), form ko bharo
  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setDiscountType(initialData.discountType);
      setDiscountValue(initialData.discountValue);
      setExpiryDate(formatDateForInput(initialData.expiryDate));
      setMaxUses(String(initialData.maxUses || ''));
      setIsActive(initialData.isActive);
    } else {
      // Create form ke liye reset
      setCode('');
      setDiscountType('PERCENTAGE');
      setDiscountValue(10);
      setExpiryDate('');
      setMaxUses('');
      setIsActive(true);
    }
  }, [initialData]);

  // Form submit logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      expiryDate: expiryDate || null,
      maxUses: maxUses ? Number(maxUses) : null,
      isActive,
    };

    try {
      if (initialData) {
        // --- UPDATE (EDIT) LOGIC ---
        await api.put(`/coupons/${initialData.id}`, payload);
      } else {
        // --- CREATE (NEW) LOGIC ---
        await api.post('/coupons', payload);
      }
      onSave(); // Parent ko batao ki save ho gaya (taaki list refresh ho)

    } catch (err: any) {
      console.error("Failed to save coupon:", err);
      setError(err.response?.data?.message || 'Failed to save coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.couponForm}>
        <div className={styles.formGroup}>
          <label>Coupon Code</label>
          <input 
            type="text" 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g., WELCOME50"
            required 
          />
        </div>
        <div className={styles.formGroup}>
          <label>Discount Type</label>
          <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Discount Value</label>
          <input 
            type="number" 
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            placeholder="e.g., 50"
            required 
          />
        </div>
        <div className={styles.formGroup}>
          <label>Expiry Date (Optional)</label>
          <input 
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)} 
          />
        </div>
        <div className={styles.formGroup}>
          <label>Max Uses (Optional)</label>
          <input 
            type="number" 
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="e.g., 100 (Blank = unlimited)" 
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.checkboxContainer}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Coupon is Active</span>
          </label>
        </div>

        <div className={styles.formActions}>
          {error && <p className={styles.error}>{error}</p>}
          <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className={styles.saveButton} disabled={isSubmitting}>
            <MdSave />
            {isSubmitting ? 'Saving...' : 'Save Coupon'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CouponForm;
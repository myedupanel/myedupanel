// File: app/superadmin/coupons/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api'; // !! Path check karein, yeh aapki global api.ts file honi chahiye
import styles from './CouponsPage.module.scss'; // Hum yeh file agle step mein banayenge

// Coupon ki type (Prisma se match karti hui)
interface Coupon {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  isActive: boolean;
  timesUsed: number;
  maxUses: number | null;
  expiryDate: string | null;
  createdAt: string;
}

const CouponsPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10); // Default 10%
  const [expiryDate, setExpiryDate] = useState('');
  const [maxUses, setMaxUses] = useState('');

  // Page load par saare coupons fetch karein
  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/coupons');
      setCoupons(data);
    } catch (err) {
      setError('Failed to fetch coupons.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Form submit par naya coupon banayein
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.post('/coupons', {
        code: code.toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        expiryDate: expiryDate || null, // Khaali string ko null bhejein
        maxUses: maxUses ? Number(maxUses) : null,
      });
      
      // Form reset karein aur list refresh karein
      setCode('');
      setDiscountValue(10);
      setExpiryDate('');
      setMaxUses('');
      fetchCoupons(); // List ko refresh karein
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create coupon.');
    }
  };

  return (
    <div className={styles.couponsPage}>
      <header>
        <h1>Manage Coupons (SuperAdmin)</h1>
      </header>

      {/* 1. Naya Coupon Banane ka Form */}
      <div className={styles.formContainer}>
        <h3>Create New Coupon</h3>
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
          <button type="submit" className={styles.submitButton}>Create Coupon</button>
        </form>
        {error && <p className={styles.error}>{error}</p>}
      </div>

      {/* 2. Puraane Coupons ki Table */}
      <div className={styles.tableContainer}>
        <h3>Existing Coupons</h3>
        {isLoading ? <p>Loading coupons...</p> : (
          <table className={styles.couponsTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Status</th>
                <th>Used / Max</th>
                <th>Expires On</th>
                <th>Created On</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>{coupon.code}</td>
                  <td>{coupon.discountType}</td>
                  <td>{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                  <td>{coupon.isActive ? 'Active' : 'Inactive'}</td>
                  <td>{coupon.timesUsed} / {coupon.maxUses || '∞'}</td>
                  <td>{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}</td>
                  <td>{new Date(coupon.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CouponsPage;
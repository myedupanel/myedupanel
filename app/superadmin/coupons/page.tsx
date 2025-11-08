// File: app/superadmin/coupons/page.tsx (UPDATED)

"use client";

import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api'; // !! Path check karein
import styles from './CouponsPage.module.scss'; 
import { FiRefreshCw } from 'react-icons/fi'; // Naya icon

// === YAHI HAI FIX ===
// Interface ko 'export' karein taaki 'CouponForm.tsx' ise import kar sake
export interface Coupon {
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
// === END FIX ===

const CouponsPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [expiryDate, setExpiryDate] = useState('');
  const [maxUses, setMaxUses] = useState('');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

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
        expiryDate: expiryDate || null,
        maxUses: maxUses ? Number(maxUses) : null,
      });
      setCode('');
      setDiscountValue(10);
      setExpiryDate('');
      setMaxUses('');
      fetchCoupons(); 
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create coupon.');
    }
  };

  // Sync function
  const handleSyncPayments = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage('Syncing with Razorpay... (This may take a minute)');
    try {
      const { data } = await api.post('/payment/sync-payments');
      setSyncMessage(`✅ ${data.message}`);
    } catch (err: any) {
      console.error(err);
      setSyncMessage(`❌ Error: ${err.response?.data?.message || 'Sync failed.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={styles.couponsPage}>
      <header>
        <h1>Manage Coupons (SuperAdmin)</h1>
      </header>

      {/* Sync Section */}
      <div className={`${styles.formContainer} ${styles.syncContainer}`}>
        <h3>Payment Reconciliation</h3>
        <p>
          Agar kisi user ne payment ki hai lekin uska plan 'TRIAL' hi dikha raha hai, 
          yeh button dabane se system Razorpay se data check karke sabhi phanse hue 
          payments ko 'auto-fix' kar dega.
        </p>
        <button 
          onClick={handleSyncPayments} 
          disabled={isSyncing} 
          className={styles.syncButton}
        >
          {isSyncing ? 'Syncing...' : (
            <>
              <FiRefreshCw style={{ marginRight: '8px' }} />
              Sync Razorpay Payments
            </>
          )}
        </button>
        {syncMessage && (
          <p className={styles.syncMessage}>{syncMessage}</p>
        )}
      </div>

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
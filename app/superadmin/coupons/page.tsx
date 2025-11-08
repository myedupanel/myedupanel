// File: app/superadmin/coupons/page.tsx (UPDATED for Header Button & Text)

"use client";

import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api'; 
import styles from './CouponsPage.module.scss'; 
import { FiRefreshCw, FiPlus, FiGrid } from 'react-icons/fi'; // FiGrid icon import kiya
import { useRouter } from 'next/navigation'; // useRouter import kiya

// Interface (Bina Badlaav)
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
  
  const router = useRouter(); // useRouter hook initialize kiya

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

  const handleSyncPayments = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage('Syncing with Razorpay... (This may take a minute)');
    try {
      const { data } = await api.post('/payment/sync-payments');
      setSyncMessage(`✅ Sync complete! ${data.fixed} new/mismatched payments fixed, ${data.skipped} payments already synced, ${data.failed} payments failed.`);
    } catch (err: any) {
      console.error(err);
      setSyncMessage(`❌ Error: ${err.response?.data?.message || 'Sync failed.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={styles.couponsPage}>
      <header className={styles.header}>
        {/* === FIX 1: Header aur Button === */}
        <h1>Manage Coupons (SuperAdmin)</h1>
        <button 
            onClick={() => router.push('/admin/dashboard')} 
            className={styles.dashboardLinkButton}
        >
            <FiGrid /> Go to Dashboard
        </button>
        {/* === END FIX 1 === */}
      </header>

      {/* Block 1: Sync Section */}
      <div className={`${styles.pageSection} ${styles.syncContainer}`}>
        <div className={styles.sectionHeader}>
          <h3><FiRefreshCw /> Payment Reconciliation</h3>
        </div>
        {/* === FIX 2: Text Conversion to English === */}
        <p>
          If a user has paid but their plan still shows 'TRIAL', this button initiates 
          a synchronization with Razorpay to check all missing payments and **auto-fix** the user's plan status in the database.
        </p>
        {/* === END FIX 2 === */}
        <button 
          onClick={handleSyncPayments} 
          disabled={isSyncing} 
          className={styles.syncButton}
        >
          {isSyncing ? 'Syncing...' : 'Sync Razorpay Payments'}
        </button>
        {syncMessage && (
          <p className={styles.syncMessage}>{syncMessage}</p>
        )}
      </div>

      {/* Block 2: Create Form Section (Bina Badlaav) */}
      <div className={styles.pageSection}>
        <div className={styles.sectionHeader}>
          <h3><FiPlus /> Create New Coupon</h3>
        </div>
        <form onSubmit={handleSubmit} className={styles.couponForm}>
          {/* ... Poora Form ... */}
          <div className={styles.formGroup}>
            <label>Coupon Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
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
            <label>&nbsp;</label>
            <button type="submit" className={styles.submitButton}>Create Coupon</button>
          </div>
        </form>
        {error && <p className={styles.error}>{error}</p>}
      </div>

      {/* Block 3: Table Section (Bina Badlaav) */}
      <div className={styles.pageSection}>
        <div className={styles.sectionHeader}>
          <h3>Existing Coupons</h3>
        </div>
        {isLoading ? <p>Loading coupons...</p> : (
          <div className={styles.tableWrapper}>
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
                    <td data-label="Code">{coupon.code}</td>
                    <td data-label="Type">{coupon.discountType}</td>
                    <td data-label="Value">{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                    <td data-label="Status">
                      <span className={coupon.isActive ? styles.statusActive : styles.statusInactive}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td data-label="Used / Max">{coupon.timesUsed} / {coupon.maxUses || '∞'}</td>
                    <td data-label="Expires On">{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}</td>
                    <td data-label="Created On">{new Date(coupon.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponsPage;
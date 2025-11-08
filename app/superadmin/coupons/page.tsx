// File: app/superadmin/coupons/page.tsx (FINAL CRUD UI)

"use client";

import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api'; 
import styles from './CouponsPage.module.scss'; 
import { FiRefreshCw, FiPlus, FiGrid, FiEdit, FiTrash } from 'react-icons/fi'; // Icons add kiye
import { useRouter } from 'next/navigation';
// === NAYE IMPORTS ===
import Modal from '@/components/common/Modal/Modal'; // Modal Component (assuming existence)
import CouponForm from './CouponForm'; // CouponForm import
// === END NAYE IMPORTS ===


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

  // Form/Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null); // State to hold coupon being edited

  // Sync state (Bina Badlaav)
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  
  const router = useRouter();

  // 1. Fetch Logic
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

  // 2. Handle Sync (No Change)
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

  // 3. Handle Form Actions
  const handleOpenCreateModal = () => {
      setEditingCoupon(null); // Create mode
      setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (coupon: Coupon) => {
      setEditingCoupon(coupon); // Edit mode
      setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
      setIsModalOpen(false); // Modal close karo
      setEditingCoupon(null);
      fetchCoupons(); // List refresh karo
  };

  // 4. Handle Delete Action
  const handleDeleteClick = async (couponId: number) => {
      // FIX 1: Alert की जगह window.confirm का उपयोग करें
      if (!window.confirm(`Are you sure you want to delete coupon ID ${couponId}? This cannot be undone if used in a subscription.`)) {
          return;
      }
      try {
          // DELETE API call (backend/routes/couponRoutes.js mein deleteCoupon)
          await api.delete(`/coupons/${couponId}`);
          fetchCoupons(); // List refresh karo
      } catch (err: any) {
          alert(`Error deleting coupon: ${err.response?.data?.message || 'Server error'}`);
      }
  };


  return (
    <div className={styles.couponsPage}>
      <header className={styles.header}>
        <h1>Manage Coupons (SuperAdmin)</h1>
        <button 
            onClick={() => router.push('/admin/dashboard')} 
            className={styles.dashboardLinkButton}
        >
            <FiGrid /> Go to Dashboard
        </button>
      </header>

      {/* Block 1: Sync Section */}
      <div className={`${styles.pageSection} ${styles.syncContainer}`}>
        <div className={styles.sectionHeader}>
          <h3><FiRefreshCw /> Payment Reconciliation</h3>
        </div>
        <p>
          If a user has paid but their plan still shows 'TRIAL', this button initiates 
          a synchronization with Razorpay to check all missing payments and **auto-fix** the user's plan status in the database.
        </p>
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

      {/* Block 3: Table Section */}
      <div className={styles.pageSection}>
        <div className={styles.sectionHeader}>
          <h3>Existing Coupons</h3>
           {/* === NAYA BUTTON: Modal kholega === */}
           <button onClick={handleOpenCreateModal} className={styles.createButton}>
             <FiPlus /> Create New Coupon
           </button>
           {/* === END NAYA BUTTON === */}
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
                  {/* === NAYA COLUMN === */}
                  <th>Actions</th> 
                  {/* === END NAYA COLUMN === */}
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
                    {/* === ACTION BUTTONS === */}
                    <td data-label="Actions" className={styles.actionsCell}>
                      <button 
                        onClick={() => handleOpenEditModal(coupon)} 
                        className={`${styles.actionButton} ${styles.editButton}`}
                        aria-label={`Edit ${coupon.code}`}
                      >
                        <FiEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(coupon.id)} 
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        aria-label={`Delete ${coupon.code}`}
                      >
                        <FiTrash />
                      </button>
                    </td>
                    {/* === END ACTION BUTTONS === */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === MODAL INTEGRATION === */}
      {/* Note: Ise aapke project ke common Modal component ki zaroorat padegi */}
      <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
      >
          <CouponForm 
              initialData={editingCoupon}
              onSave={handleSaveSuccess}
              onClose={() => setIsModalOpen(false)}
          />
      </Modal>
      {/* === END MODAL === */}
    </div>
  );
};

export default CouponsPage;
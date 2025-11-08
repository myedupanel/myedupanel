"use client";

import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api'; 
import styles from './CouponsPage.module.scss'; 
import Link from 'next/link';
// === NAYE ICONS IMPORT KAREIN ===
import { MdGridView, MdAdd, MdEdit, MdDelete } from 'react-icons/md';
// === NAYE COMPONENTS IMPORT KAREIN ===
import Modal from '@/components/common/Modal/Modal';
import CouponForm from './CouponForm';

// Coupon ki type (Prisma se match karti hui)
// === 'export' ADD KIYA TAAKI FORM USE KAR SAKE ===
export interface Coupon {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  isActive: boolean;
  timesUsed: number;
  maxUses: number | null;
  expiryDate: string | null;
  createdAt: string; // Yeh ab schema fix ke baad kaam karega
}

// === NAYA HELPER FUNCTION DATE FORMAT KE LIYE ===
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Never';
  try {
    // Yahaan 'en-GB' (DD/MM/YYYY) format use kar rahe hain, aap 'en-IN' bhi kar sakte hain
    return new Date(dateString).toLocaleDateString('en-GB');
  } catch (e) {
    return 'Invalid Date';
  }
};

const CouponsPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // === NAYE MODAL STATES ===
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [couponToEdit, setCouponToEdit] = useState<Coupon | null>(null);

  // Page load par saare coupons fetch karein
  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      setError(''); 
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

  // === NAYA DELETE HANDLER ===
  const handleDelete = async (couponId: number, couponCode: string) => {
    if (window.confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) {
      try {
        setError('');
        await api.delete(`/coupons/${couponId}`);
        fetchCoupons(); // List refresh karein
      } catch (err: any) {
        console.error("Failed to delete coupon:", err);
        setError(err.response?.data?.message || 'Failed to delete coupon.');
      }
    }
  };

  // Jab form save ho (Create ya Edit), modal band karo aur list refresh karo
  const handleSaveSuccess = () => {
    fetchCoupons();
    setIsCreateModalOpen(false);
    setCouponToEdit(null);
  };

  return (
    <div className={styles.couponsPage}>
      <header className={styles.header}>
        <h1>Manage Coupons (SuperAdmin)</h1>
        {/* === GO TO DASHBOARD LINK BADLA GAYA === */}
        <Link href="/admin/dashboard" className={styles.dashboardLinkButton}>
          <MdGridView />
          <span>Go to Dashboard</span>
        </Link>
      </header>

      {/* 1. Naya Coupon Banane ka Form HATA KAR BUTTON ADD KIYA GAYA */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>Existing Coupons</h3>
          <button onClick={() => setIsCreateModalOpen(true)} className={styles.createButton}>
            <MdAdd />
            Create New Coupon
          </button>
        </div>
        
        {/* Error message ab table ke upar dikhega */}
        {error && <p className={styles.error}>{error}</p>}

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
                {/* === NAYA "ACTIONS" COLUMN === */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>{coupon.code}</td>
                  <td>{coupon.discountType}</td>
                  <td>{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                  <td>
                    {/* === NAYI STATUS STYLING === */}
                    <span className={coupon.isActive ? styles.statusActive : styles.statusInactive}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{coupon.timesUsed} / {coupon.maxUses || '∞'}</td>
                  {/* === DATE FORMATTING FIX === */}
                  <td>{formatDate(coupon.expiryDate)}</td>
                  <td>{formatDate(coupon.createdAt)}</td>
                  {/* === NAYE "ACTIONS" BUTTONS === */}
                  <td className={styles.actions}>
                    <button onClick={() => setCouponToEdit(coupon)} className={styles.actionButton}>
                      <MdEdit />
                    </button>
                    <button onClick={() => handleDelete(coupon.id, coupon.code)} className={`${styles.actionButton} ${styles.deleteButton}`}>
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* === NAYE MODALS (POPUPS) === */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Coupon"
      >
        <CouponForm 
          onSave={handleSaveSuccess} 
          onClose={() => setIsCreateModalOpen(false)} 
        />
      </Modal>

      <Modal
        isOpen={!!couponToEdit}
        onClose={() => setCouponToEdit(null)}
        title={`Edit Coupon: ${couponToEdit?.code}`}
      >
        <CouponForm 
          initialData={couponToEdit} 
          onSave={handleSaveSuccess} 
          onClose={() => setCouponToEdit(null)} 
        />
      </Modal>
      {/* ========================= */}
    </div>
  );
};

export default CouponsPage;
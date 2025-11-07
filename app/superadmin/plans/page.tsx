"use client";

import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api'; // Aapka global API helper
import styles from './PlansPage.module.scss'; // Purani CSS file
import Link from 'next/link';
import { MdGridView, MdAdd, MdEdit, MdDelete } from 'react-icons/md';

// === NAYE IMPORTS ===
import Modal from '@/components/common/Modal/Modal'; // Aapka common Modal component
import PlanForm from './PlanForm'; // Naya form component jo hum agle step mein banayenge
// ====================

// Plan ka structure (Prisma se match hona chahiye)
export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[]; // Features ko JSON array maan rahe hain
  isActive: boolean;
  createdAt: string;
}

const SuperAdminPlansPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === MODAL STATES ===
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);
  // ====================

  // Saare plans fetch karne ka function
  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/plans/admin-all'); 
      
      const parsedPlans = data.map((plan: any) => ({
        ...plan,
        features: Array.isArray(plan.features) 
          ? plan.features 
          : JSON.parse(plan.features || '[]')
      }));
      setPlans(parsedPlans);

    } catch (err) {
      console.error("Failed to fetch plans:", err);
      setError('Failed to fetch plans. Please check the API.');
    } finally {
      setIsLoading(false);
    }
  };

  // Page load par plans fetch karein
  useEffect(() => {
    fetchPlans();
  }, []);

  // === DELETE HANDLER (Ab yeh kaam karega) ===
  const handleDelete = async (planId: string) => {
    if (window.confirm(`Are you sure you want to delete the plan ${planId}? This cannot be undone.`)) {
      try {
        setError(null);
        await api.delete(`/plans/admin/${planId}`); // API call
        fetchPlans(); // List refresh karein
      } catch (err: any) {
        console.error("Failed to delete plan:", err);
        setError(err.response?.data?.message || 'Failed to delete plan.');
      }
    }
  };
  // ======================================

  // Jab form save ho (Create ya Edit), modal band karo aur list refresh karo
  const handleSaveSuccess = () => {
    fetchPlans();
    setIsCreateModalOpen(false);
    setPlanToEdit(null);
  };

  return (
    <div className={styles.plansPage}>
      <header className={styles.header}>
        <h1>Manage Plans (SuperAdmin)</h1>
        <div className={styles.headerActions}>
          {/* === BUTTON AB LINK NAHI RAHA === */}
          <button onClick={() => setIsCreateModalOpen(true)} className={styles.createButton}>
            <MdAdd />
            <span>Create New Plan</span>
          </button>
          {/* ============================= */}
          <Link href="/superadmin/dashboard" className={styles.dashboardLinkButton}>
            <MdGridView />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Plans ki Table */}
      <div className={styles.tableContainer}>
        <h3>All Pricing Plans</h3>
        {isLoading && <p>Loading plans...</p>}
        {error && <p className={styles.error}>{error}</p>}
        
        {!isLoading && !error && (
          <table className={styles.plansTable}>
            <thead>
              <tr>
                <th>Plan Name</th>
                <th>Plan ID</th>
                <th>Price (INR)</th>
                <th>Status</th>
                <th>Features Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td>{plan.name}</td>
                  <td>{plan.id}</td>
                  <td>₹{plan.price.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={plan.isActive ? styles.statusActive : styles.statusInactive}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{plan.features.length} Features</td>
                  <td className={styles.actions}>
                    {/* === EDIT BUTTON AB LINK NAHI RAHA === */}
                    <button onClick={() => setPlanToEdit(plan)} className={styles.actionButton}>
                      <MdEdit /> Edit
                    </button>
                    {/* ================================== */}
                    <button onClick={() => handleDelete(plan.id)} className={`${styles.actionButton} ${styles.deleteButton}`}>
                      <MdDelete /> Delete
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
        title="Create New Plan"
      >
        <PlanForm 
          onSave={handleSaveSuccess} 
          onClose={() => setIsCreateModalOpen(false)} 
        />
      </Modal>

      <Modal
        isOpen={!!planToEdit}
        onClose={() => setPlanToEdit(null)}
        title={`Edit Plan: ${planToEdit?.name}`}
      >
        <PlanForm 
          initialData={planToEdit} 
          onSave={handleSaveSuccess} 
          onClose={() => setPlanToEdit(null)} 
        />
      </Modal>
      {/* ========================= */}
    </div>
  );
};

export default SuperAdminPlansPage;
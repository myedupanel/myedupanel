// components/admin/AcademicYearManager/AcademicYearManager.tsx
"use client";

import React, { useState, useEffect } from 'react';
import styles from './AcademicYearManager.module.scss';
import Modal from '@/components/common/Modal/Modal';

// Import form dynamically to avoid build issues
import dynamic from 'next/dynamic';

const AddAcademicYearForm = dynamic(
  () => import('../AddAcademicYearForm/AddAcademicYearForm'),
  { ssr: false }
);

interface AcademicYear {
  id: number;
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  _count?: {
    students: number;
    teachers: number;
    feeRecords: number;
    transactions: number;
  };
  createdAt: string;
}

const AcademicYearManager: React.FC = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

  // Fetch all academic years
  const fetchYears = async () => {
    try {
      setLoading(true);
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${BACKEND_URL}/api/academic-years`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch years');
      }

      setYears(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching years:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  // Set a year as current
  const handleSetCurrent = async (yearId: number) => {
    if (!confirm('Set this year as the current active year?')) return;

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${BACKEND_URL}/api/academic-years/set-current`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ yearId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set current year');
      }

      alert('Year set as current successfully!');
      fetchYears();
      window.location.reload(); // Reload to update the context
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete a year
  const handleDelete = async (yearId: number, yearName: string) => {
    if (!confirm(`Delete academic year "${yearName}"? This action cannot be undone.`)) return;

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

      const response = await fetch(`${BACKEND_URL}/api/academic-years/${yearId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete year');
      }

      alert('Year deleted successfully!');
      fetchYears();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle form submission
  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingYear(null);
    fetchYears();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading academic years...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Academic Years Management</h1>
        <button 
          className={styles.addButton}
          onClick={() => setShowAddForm(true)}
        >
          + Create New Year
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.yearsList}>
        {years.length === 0 ? (
          <div className={styles.empty}>
            <p>No academic years found. Create one to get started!</p>
          </div>
        ) : (
          years.map((year) => (
            <div 
              key={year.id} 
              className={`${styles.yearCard} ${year.isCurrent ? styles.current : ''}`}
            >
              <div className={styles.yearHeader}>
                <div className={styles.yearInfo}>
                  <h3>
                    📅 {year.yearName}
                    {year.isCurrent && <span className={styles.badge}>Current</span>}
                  </h3>
                  <p className={styles.dates}>
                    {formatDate(year.startDate)} - {formatDate(year.endDate)}
                  </p>
                </div>
              </div>

              {year._count && (
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.label}>Students:</span>
                    <span className={styles.value}>{year._count.students}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>Teachers:</span>
                    <span className={styles.value}>{year._count.teachers}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>Fee Records:</span>
                    <span className={styles.value}>{year._count.feeRecords}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>Transactions:</span>
                    <span className={styles.value}>{year._count.transactions}</span>
                  </div>
                </div>
              )}

              <div className={styles.actions}>
                {!year.isCurrent && (
                  <button
                    className={styles.setCurrent}
                    onClick={() => handleSetCurrent(year.id)}
                  >
                    Set as Current
                  </button>
                )}
                <button
                  className={styles.edit}
                  onClick={() => setEditingYear(year)}
                >
                  Edit
                </button>
                {!year.isCurrent && (
                  <button
                    className={styles.delete}
                    onClick={() => handleDelete(year.id, year.yearName)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <Modal 
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          title="Create New Academic Year"
        >
          <AddAcademicYearForm 
            onSuccess={handleFormSuccess}
            onCancel={() => setShowAddForm(false)}
          />
        </Modal>
      )}

      {editingYear && (
        <Modal 
          isOpen={!!editingYear}
          onClose={() => setEditingYear(null)}
          title="Edit Academic Year"
        >
          <AddAcademicYearForm 
            existingYear={editingYear}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditingYear(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default AcademicYearManager;

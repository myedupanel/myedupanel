"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styles from '../students/StudentsPage.module.scss';
import ParentsTable from '@/components/admin/ParentsTable/ParentsTable';
import Modal from '@/components/common/Modal/Modal';
import AddParentForm from '@/components/admin/AddParentForm/AddParentForm';
import StudentFilters from '@/components/admin/StudentFilters/StudentFilters';
import { FiPlus } from 'react-icons/fi';
import axios from 'axios';

// --- YEH ADD KAREIN ---
import Link from 'next/link';
import { MdGridView } from 'react-icons/md';
// --- END ---

// 1. Behtar Typing ke liye Interfaces
interface Student {
  id: string;
  name: string;
  class: string;
}

interface Parent {
  id: string;
  name: string;
  contactNumber: string;
  email: string;
  occupation: string;
  studentId: Student;
}

const ParentsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parents, setParents] = useState<Parent[]>([]);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchParents = async () => {
    try {
      const res = await axios.get('/api/parents');
      setParents(res.data);
      // --- DEBUGGING LINE ---
      console.log("Fetched Parents Data from API:", res.data);
      // --------------------
    } catch (error) {
      console.error("Failed to fetch parents", error);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingParent(null);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingParent) {
        await axios.put(`/api/parents/${editingParent.id}`, data);
        alert('Parent updated successfully!');
      } else {
        await axios.post('/api/parents', data);
        alert('Parent added successfully!');
      }
      fetchParents();
      closeModal();
    } catch (error: any) {
      console.error("Failed to save parent", error);
      alert(`Error: ${error.response?.data?.msg || 'Could not save parent.'}`);
    }
  };

  const handleEdit = (parent: Parent) => {
    setEditingParent(parent);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this parent?')) {
      try {
        await axios.delete(`/api/parents/${id}`);
        fetchParents();
      } catch (error) {
        console.error('Failed to delete parent', error);
      }
    }
  };
  
  const filteredAndSortedParents = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    
    return parents
      .filter(parent => {
        const studentName = parent.studentId?.name?.toLowerCase() || '';
        return (
          parent.name.toLowerCase().includes(lowercasedQuery) ||
          studentName.includes(lowercasedQuery)
        );
      })
      .sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.name.localeCompare(b.name);
        } else {
          return b.name.localeCompare(a.name);
        }
      });
  }, [parents, searchQuery, sortOrder]);


  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Parent Management</h1>
        <button onClick={() => setIsModalOpen(true)} className={styles.addButton}>
          <FiPlus />
          Add New Parent
        </button>
      </header>
      
      <StudentFilters onSearch={setSearchQuery} onSort={setSortOrder} />

      <main>
        <ParentsTable parents={filteredAndSortedParents} onEdit={handleEdit} onDelete={handleDelete} />
      </main>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingParent ? "Edit Parent" : "Add a New Parent"}
      >
        <AddParentForm 
          onClose={closeModal} 
          onSubmit={handleFormSubmit}
          existingParent={editingParent}
        />
      </Modal>

      {/* --- YEH BUTTON ADD KIYA GAYA HAI --- */}
      {/* Yeh button page ke aakhir mein dikhega */}
      <Link href="/admin/school" className={styles.dashboardLinkButton}>
        <MdGridView />
        Go to Dashboard
      </Link>
      {/* --- END --- */}
    </div>
  );
};

export default ParentsPage;
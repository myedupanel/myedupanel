// app/admin/parents/page.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './ParentsPage.module.scss';
import ParentsTable from '@/components/admin/ParentsTable/ParentsTable';
import Modal from '@/components/common/Modal/Modal';
import AddParentForm from '@/components/admin/AddParentForm/AddParentForm';
import StudentFilters from '@/components/admin/StudentFilters/StudentFilters';
// FiMenu और FiSearch को import किया
import { FiPlus, FiMenu, FiSearch } from 'react-icons/fi'; 
import api from '@/backend/utils/api'; 
import Link from 'next/link';
import { MdGridView } from 'react-icons/md';
import { useAuth } from '@/app/context/AuthContext';
import { useAcademicYear } from '@/app/context/AcademicYearContext'; // Add this import

// --- 1. INTERFACES (PRISMA-AWARE) ---

interface ApiParent {
  id: number;
  name: string;
  contactNumber: string;
  email: string;
  occupation: string;
  schoolId: string;
  student?: { 
    studentid: number;
    first_name: string;
    last_name: string;
    class: { class_name: string } | null;
  };
}

interface ParentData {
  id: number;
  name: string;
  contactNumber: string;
  email: string;
  occupation: string;
  schoolId: string;
  studentid: number | null;
  studentName: string;
  studentClass: string;
}

interface FormData {
  name: string;
  contactNumber: string;
  email: string;
  occupation: string;
  studentId: number | null; 
}

// --- 2. HELPER FUNCTIONS ---

const getFullName = (s: { first_name?: string, last_name?: string } | null | undefined) => {
  if (!s) return 'N/A';
  return [s.first_name, s.last_name].filter(Boolean).join(' ');
}

const transformApiData = (parent: ApiParent): ParentData => ({
  id: parent.id,
  name: parent.name,
  contactNumber: parent.contactNumber,
  email: parent.email,
  occupation: parent.occupation || '',
  schoolId: parent.schoolId,
  studentid: parent.student?.studentid || null,
  studentName: getFullName(parent.student),
  studentClass: parent.student?.class?.class_name || 'N/A',
});


// --- 3. MAIN COMPONENT ---
const ParentsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // NAYA: Actions/Menu Modal state
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  // NAYA: Search Modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  
  const [parents, setParents] = useState<ParentData[]>([]);
  const [editingParent, setEditingParent] = useState<ParentData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAuth();
  const { currentYearId } = useAcademicYear(); // Add this line to use academic year context

  const fetchParents = useCallback(async () => {
    try {
      const res = await api.get('/parents');
      const formattedData = res.data.map(transformApiData);
      setParents(formattedData);
      console.log("Fetched and Transformed Parents Data:", formattedData);
    } catch (error) {
      console.error("Failed to fetch parents", error);
    }
  }, [currentYearId]); // Add currentYearId as dependency

  useEffect(() => {
    fetchParents();
  }, [fetchParents, currentYearId]); // Add currentYearId as dependency

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingParent(null);
  };

  const handleFormSubmit = async (data: FormData) => {
    const payload = {
        name: data.name,
        contactNumber: data.contactNumber,
        email: data.email,
        occupation: data.occupation,
        studentId: data.studentId 
    };
    
    try {
      if (editingParent) {
        await api.put(`/parents/${editingParent.id}`, payload);
        alert('Parent updated successfully!');
      } else {
        await api.post('/parents', payload);
        alert('Parent added successfully!');
      }
      fetchParents(); 
      closeModal();
    } catch (error: any) {
      console.error("Failed to save parent", error);
      alert(`Error: ${error.response?.data?.msg || 'Could not save parent.'}`);
    }
  };

  const handleEdit = (parent: ParentData) => {
    setEditingParent(parent);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this parent?')) {
      try {
        await api.delete(`/parents/${id}`);
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
        const studentName = parent.studentName?.toLowerCase() || '';
        return (
          parent.name.toLowerCase().includes(lowercasedQuery) ||
          studentName.includes(lowercasedQuery)
        );
      })
  }, [parents, searchQuery]);
  
  // NAYA: Search query handler for modal
  const handleSearchAndCloseModal = (query: string) => {
    setSearchQuery(query);
    setIsSearchModalOpen(false);
  };


  return (
    <div className={styles.pageContainer}>
      
      {/* --- UPDATED HEADER FOR MOBILE/DESKTOP --- */}
      <header className={styles.header}>
        {/* Hamburger Icon (Mobile Only) */}
        <button className={styles.menuButton} onClick={() => setIsActionsModalOpen(true)}>
            <FiMenu />
        </button>
        
        <h1 className={styles.title}>Parent Management</h1>
        
        {/* Search Icon (Mobile Only) */}
        <button className={styles.searchToggleButton} onClick={() => setIsSearchModalOpen(true)}>
            <FiSearch />
        </button>
        
        {/* Desktop Add Button (Mobile pe hide) */}
        <button onClick={() => setIsModalOpen(true)} className={`${styles.addButton} ${styles.desktopAddButton}`}>
          <FiPlus />
          Add New Parent
        </button>
      </header>
      
      {/* Desktop Search Filter (Mobile pe hide) */}
      <div className={styles.desktopSearchFilter}>
        <StudentFilters onSearch={setSearchQuery} />
      </div>

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
          existingParent={editingParent ? {
            studentid: editingParent.studentid, 
            studentName: editingParent.studentName, 
            name: editingParent.name,
            contactNumber: editingParent.contactNumber,
            email: editingParent.email,
            occupation: editingParent.occupation
          } : null}
        />
      </Modal>

      {/* --- NAYA: Actions Modal (Hamburger Menu Content) --- */}
      <Modal isOpen={isActionsModalOpen} onClose={() => setIsActionsModalOpen(false)} title="Quick Actions">
        <div className={styles.actionsModalContent}>
            <button 
                onClick={() => { setIsModalOpen(true); setIsActionsModalOpen(false); }} 
                className={`${styles.addButton} ${styles.modalAddButton}`}
            >
                <FiPlus /> Add New Parent
            </button>
        </div>
      </Modal>

      {/* --- NAYA: Search Modal --- */}
      <Modal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} title="Search Parents">
        <div className={styles.searchModalContent}>
          {/* onSearch ko update kiya taki modal close ho sake */}
          <StudentFilters onSearch={handleSearchAndCloseModal} />
        </div>
      </Modal>

      <Link href="/admin/school" className={styles.dashboardLinkButton}>
        <MdGridView />
        Go to Dashboard
      </Link>
    </div>
  );
};

export default ParentsPage;
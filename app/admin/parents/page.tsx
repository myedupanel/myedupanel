// app/admin/parents/page.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from '../parents/ParentsPage.module.scss'; // Student page ke styles use kar rahe hain
import ParentsTable from '@/components/admin/ParentsTable/ParentsTable';
import Modal from '@/components/common/Modal/Modal';
import AddParentForm from '@/components/admin/AddParentForm/AddParentForm';
import StudentFilters from '@/components/admin/StudentFilters/StudentFilters';
import { FiPlus } from 'react-icons/fi';
import api from '@/backend/utils/api'; // axios ke bajaye api instance
import Link from 'next/link';
import { MdGridView } from 'react-icons/md';
import { useAuth } from '@/app/context/AuthContext'; // Socket filtering ke liye

// --- 1. INTERFACES (PRISMA-AWARE) ---

// Yeh data API se aayega (assuming populated student)
interface ApiParent {
  id: number;
  name: string;
  contactNumber: string;
  email: string;
  occupation: string;
  schoolId: string;
  // Yeh assumption hai ki backend parent ke saath student ko populate karke bhej raha hai
  // Aapke purane code (`studentId: Student`) ke logic ke hisaab se
  student?: { 
    studentid: number;
    first_name: string;
    last_name: string;
    class: { class_name: string } | null;
  };
}

// Yeh data hum component ke state mein rakhenge
interface ParentData {
  id: number;
  name: string;
  contactNumber: string;
  email: string;
  occupation: string;
  schoolId: string;
  // Student data ko flat kar diya
  studentid: number | null;
  studentName: string;
  studentClass: string;
}

// Yeh data form se submit hoga (matches AddParentForm.tsx)
interface FormData {
  name: string;
  contactNumber: string;
  email: string;
  occupation: string;
  studentId: number | null; // Yeh student ka 'studentid' hai
}

// --- 2. HELPER FUNCTIONS ---

const getFullName = (s: { first_name?: string, last_name?: string } | null | undefined) => {
  if (!s) return 'N/A';
  return [s.first_name, s.last_name].filter(Boolean).join(' ');
}

// API data ko state data mein badalne ke liye
const transformApiData = (parent: ApiParent): ParentData => ({
  id: parent.id,
  name: parent.name,
  contactNumber: parent.contactNumber,
  email: parent.email,
  occupation: parent.occupation || '',
  schoolId: parent.schoolId,
  // Agar parent se student linked nahi hai toh handle karein
  studentid: parent.student?.studentid || null,
  studentName: getFullName(parent.student),
  studentClass: parent.student?.class?.class_name || 'N/A',
});


// --- 3. MAIN COMPONENT ---
const ParentsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parents, setParents] = useState<ParentData[]>([]); // FIX: Naya interface use kiya
  const [editingParent, setEditingParent] = useState<ParentData | null>(null); // FIX: Naya interface use kiya
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { user } = useAuth(); // Socket filtering ke liye

  const fetchParents = useCallback(async () => {
    try {
      const res = await api.get('/parents');
      const formattedData = res.data.map(transformApiData); // Data ko transform kiya
      setParents(formattedData);
      console.log("Fetched and Transformed Parents Data:", formattedData);
    } catch (error) {
      console.error("Failed to fetch parents", error);
    }
  }, []); // useCallback dependency

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  // (Aap yahaan baad mein Socket.IO listeners add kar sakte hain)

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingParent(null);
  };

  // FIX: handleFormSubmit ko naye FormData ke liye update kiya
  const handleFormSubmit = async (data: FormData) => {
    const payload = {
        name: data.name,
        contactNumber: data.contactNumber,
        email: data.email,
        occupation: data.occupation,
        studentId: data.studentId // Yeh student ka 'studentid' (number) hai
    };
    
    try {
      if (editingParent) {
        await api.put(`/parents/${editingParent.id}`, payload);
        alert('Parent updated successfully!');
      } else {
        await api.post('/parents', payload);
        alert('Parent added successfully!');
      }
      fetchParents(); // List ko refresh karein
      closeModal();
    } catch (error: any) {
      console.error("Failed to save parent", error);
      alert(`Error: ${error.response?.data?.msg || 'Could not save parent.'}`);
    }
  };

  // FIX: 'Parent' type ko 'ParentData' se badla
  const handleEdit = (parent: ParentData) => {
    setEditingParent(parent);
    setIsModalOpen(true);
  };

  // FIX: 'id' ko 'string' se 'number' kiya
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this parent?')) {
      try {
        await api.delete(`/parents/${id}`);
        fetchParents(); // List ko refresh karein
      } catch (error) {
        console.error('Failed to delete parent', error);
      }
    }
  };
  
  // FIX: Filter logic ko naye 'studentName' field ke liye update kiya
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
        {/* WARNING: Yeh component abhi error dega! */}
        <ParentsTable parents={filteredAndSortedParents} onEdit={handleEdit} onDelete={handleDelete} />
      </main>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingParent ? "Edit Parent" : "Add a New Parent"}
      >
        {/* --- YEH AAPKA REQUESTED FIX HAI --- */}
        <AddParentForm 
          onClose={closeModal} 
          onSubmit={handleFormSubmit}
          existingParent={editingParent ? {
            // Hum 'ParentData' state ko 'AddParentForm' ke props se map kar rahe hain
            studentid: editingParent.studentid, // 'studentid' (number | null)
            studentName: editingParent.studentName, // 'studentName' (string)
            name: editingParent.name,
            contactNumber: editingParent.contactNumber,
            email: editingParent.email,
            occupation: editingParent.occupation
          } : null}
        />
        {/* --- END FIX --- */}
      </Modal>

      <Link href="/admin/school" className={styles.dashboardLinkButton}>
        <MdGridView />
        Go to Dashboard
      </Link>
    </div>
  );
};

export default ParentsPage;
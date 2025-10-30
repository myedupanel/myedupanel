// app/admin/academics/assignments/page.tsx

"use client";
import React, { useState, useEffect } from 'react';
import styles from './AssignmentsPage.module.scss';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import Modal from '@/components/common/Modal/Modal';
// FIX: Form ke saath uski FormData type ko bhi import karein
import AddAssignmentForm, { AssignmentFormData } from '@/components/admin/academics/AddAssignmentForm';
import api from '@/backend/utils/api';

// Data Types
type AssignmentStatus = 'Pending' | 'Submitted' | 'Graded';
type FilterType = AssignmentStatus | 'All';
// Yeh type backend se match karta hai
type Assignment = {
    id: string;
    title: string;
    classInfo: string;
    subject?: string;
    dueDate?: string;
    status: AssignmentStatus;
};

const AssignmentsPage = () => {
  // State Management
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [selectedClass, setSelectedClass] = useState('All');

  // Fetch data from API on load
  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/academics/assignments');
      setAssignments(response.data);
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
      setError("Could not load assignments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []); // Run once on mount

  // Filtering Logic
  const classOptions = ['All', ...Array.from(new Set(assignments.map(a => a.classInfo)))];
  const filteredAssignments = assignments.filter(a =>
    (activeFilter === 'All' || a.status === activeFilter) &&
    (selectedClass === 'All' || a.classInfo === selectedClass)
  );

  // Modal Handlers
  const handleOpenAddModal = () => {
    setAssignmentToEdit(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (assignment: Assignment) => {
    setAssignmentToEdit(assignment); // Set the Assignment type
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAssignmentToEdit(null);
  };

  // CRUD Functions
  const handleSave = async (formData: AssignmentFormData) => {
    // formData ab naye 'classInfo' field ke saath aayega
    try {
      if (assignmentToEdit) {
        // UPDATE: Send formData to PUT API
        const response = await api.put(`/academics/assignments/${assignmentToEdit.id}`, formData);
        setAssignments(assignments.map(a =>
          a.id === assignmentToEdit.id ? response.data : a
        ));
        console.log("Assignment updated:", response.data);
      } else {
        // ADD: Send formData to POST API
        const response = await api.post('/academics/assignments', formData);
        setAssignments(prev => [...prev, response.data]);
        console.log("Assignment added:", response.data);
      }
      handleCloseModal();
    } catch (err: any) {
      console.error("Failed to save assignment:", err);
      alert(`Error saving assignment: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleDelete = async (idToDelete: string) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        await api.delete(`/academics/assignments/${idToDelete}`);
        setAssignments(assignments.filter(a => a.id !== idToDelete));
        console.log("Assignment deleted:", idToDelete);
      } catch (err: any) {
        console.error("Failed to delete assignment:", err);
        alert(`Error deleting assignment: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  if (isLoading) return <div className={styles.loadingMessage}>Loading Assignments...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Assignments</h1>
          <button className={styles.addButton} onClick={handleOpenAddModal}>
            <MdAdd /> Add New Assignment
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filterContainer}>
           <div>
            <button className={`${styles.filterButton} ${activeFilter === 'All' ? styles.active : ''}`} onClick={() => setActiveFilter('All')}>All</button>
            <button className={`${styles.filterButton} ${activeFilter === 'Pending' ? styles.active : ''}`} onClick={() => setActiveFilter('Pending')}>Pending</button>
            <button className={`${styles.filterButton} ${activeFilter === 'Submitted' ? styles.active : ''}`} onClick={() => setActiveFilter('Submitted')}>Submitted</button>
            <button className={`${styles.filterButton} ${activeFilter === 'Graded' ? styles.active : ''}`} onClick={() => setActiveFilter('Graded')}>Graded</button>
          </div>
          <select className={styles.classFilter} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            {classOptions.map(cls => ( <option key={cls} value={cls}>{cls === 'All' ? 'All Classes' : cls}</option> ))}
          </select>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.assignmentsTable}>
            <thead className={styles.tableHead}>
              <tr className={styles.tableRow}>
                <th className={styles.tableHeader}>Title</th>
                <th className={styles.tableHeader}>Class Info</th>
                <th className={styles.tableHeader}>Subject</th>
                <th className={styles.tableHeader}>Due Date</th>
                <th className={styles.tableHeader}>Status</th>
                <th className={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {filteredAssignments.map((assignment) => (
                <tr key={assignment.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>{assignment.title}</td>
                  <td className={styles.tableCell}>{assignment.classInfo}</td>
                  <td className={styles.tableCell}>{assignment.subject || 'N/A'}</td>
                  <td className={styles.tableCell}>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.statusBadge} ${styles[assignment.status.toLowerCase()]}`}>{assignment.status}</span>
                  </td>
                  <td className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <button className={styles.editButton} onClick={() => handleOpenEditModal(assignment)}><MdEdit /></button>
                    <button className={styles.deleteButton} onClick={() => handleDelete(assignment.id)}><MdDelete /></button>
                  </td>
                </tr>
              ))}
              {filteredAssignments.length === 0 && !isLoading && (
                 <tr className={styles.tableRow}><td colSpan={6} className={styles.noDataCell}>No assignments found matching your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === MODAL SECTION UPDATED === */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={assignmentToEdit ? "Edit Assignment" : "Add New Assignment"}>
        <AddAssignmentForm
          onSave={handleSave}
          // FIX: Ab hum 'assignmentToEdit' (jo backend 'Assignment' type hai) ko
          // 'AssignmentFormData' (jo form expect karta hai) mein map kar rahe hain.
          // Dono types ab 'classInfo' use karte hain, isliye error nahi aayega.
          initialData={assignmentToEdit ? {
              title: assignmentToEdit.title,
              classInfo: assignmentToEdit.classInfo, // Yeh field ab match karta hai
              subject: assignmentToEdit.subject || '', // Default value
              dueDate: assignmentToEdit.dueDate || '', // Default value
              status: assignmentToEdit.status,
          } : null}
          onClose={handleCloseModal}
        />
      </Modal>
      {/* === END MODAL UPDATE === */}
    </>
  );
};

export default AssignmentsPage;
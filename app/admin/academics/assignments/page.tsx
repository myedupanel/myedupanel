"use client";
import React, { useState, useEffect } from 'react';
import styles from './AssignmentsPage.module.scss';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import { v4 as uuidv4 } from 'uuid';
import Modal from '@/components/common/Modal/Modal';
import AddAssignmentForm, { AssignmentFormData } from '@/components/admin/academics/AddAssignmentForm';

// Data Types
type AssignmentStatus = 'Pending' | 'Submitted' | 'Graded';
type FilterType = AssignmentStatus | 'All';
type Assignment = { id: string; title: string; studentName: string; class: string; subject: string; dueDate: string; status: AssignmentStatus; };

const AssignmentsPage = () => {
  // State Management
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [selectedClass, setSelectedClass] = useState('All');

  // Load and Save data from/to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('assignments');
    if (saved && saved !== '[]') {
      setAssignments(JSON.parse(saved));
    } else {
      // Set default data if localStorage is empty
      setAssignments([
        { id: 'A001', title: 'Algebra Homework 1', studentName: 'Aarav Sharma', class: 'Grade 8', subject: 'Mathematics', dueDate: '2025-10-10', status: 'Graded' },
        { id: 'A002', title: 'Essay on World War II', studentName: 'Priya Patel', class: 'Grade 10', subject: 'History', dueDate: '2025-10-12', status: 'Submitted' },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('assignments', JSON.stringify(assignments));
  }, [assignments]);

  // Filtering Logic
  const classOptions = ['All', ...Array.from(new Set(assignments.map(a => a.class)))];
  const filteredAssignments = assignments.filter(a => 
    (activeFilter === 'All' || a.status === activeFilter) && 
    (selectedClass === 'All' || a.class === selectedClass)
  );

  // Modal Handlers
  const handleOpenAddModal = () => {
    setAssignmentToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (assignment: Assignment) => {
    setAssignmentToEdit(assignment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAssignmentToEdit(null);
  };

  // CRUD Functions
  const handleSave = (formData: AssignmentFormData) => {
    if (assignmentToEdit) {
      // Update existing assignment
      setAssignments(assignments.map(a => 
        a.id === assignmentToEdit.id ? { ...a, ...formData } : a
      ));
    } else {
      // Add new assignment
      setAssignments(prev => [...prev, { id: uuidv4(), ...formData }]);
    }
    handleCloseModal();
  };

  const handleDelete = (idToDelete: string) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      setAssignments(assignments.filter(a => a.id !== idToDelete));
    }
  };

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Assignments</h1>
          <button className={styles.addButton} onClick={handleOpenAddModal}>
            <MdAdd /> Add New Assignment
          </button>
        </div>

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

        <div className={styles.tableContainer}>
          <table className={styles.assignmentsTable}>
            <thead className={styles.tableHead}>
              <tr className={styles.tableRow}>
                <th className={styles.tableHeader}>Title</th>
                <th className={styles.tableHeader}>Student Name</th>
                <th className={styles.tableHeader}>Class</th>
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
                  <td className={styles.tableCell}>{assignment.studentName}</td>
                  <td className={styles.tableCell}>{assignment.class}</td>
                  <td className={styles.tableCell}>{assignment.subject}</td>
                  <td className={styles.tableCell}>{assignment.dueDate}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.statusBadge} ${styles[assignment.status.toLowerCase()]}`}>{assignment.status}</span>
                  </td>
                  <td className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <button className={styles.editButton} onClick={() => handleOpenEditModal(assignment)}><MdEdit /></button>
                    <button className={styles.deleteButton} onClick={() => handleDelete(assignment.id)}><MdDelete /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={assignmentToEdit ? "Edit Assignment" : "Add New Assignment"}>
        <AddAssignmentForm onSave={handleSave} initialData={assignmentToEdit} />
      </Modal>
    </>
  );
};

export default AssignmentsPage;

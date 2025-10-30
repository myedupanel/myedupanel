"use client";
import React from 'react';
import styles from './StudentsTable.module.scss';
// Icon ko import karein
import { FiEdit, FiTrash2, FiFileText } from 'react-icons/fi';

interface Student {
  id: string;
  studentId: string;
  name: string;
  class: string;
  rollNo: string;
  parentName: string;
  parentContact: string;
}

interface StudentsTableProps {
  students: Student[];
  onDelete: (id: string) => void;
  onEdit: (student: Student) => void;
  // Nayi prop
  onGenerateBonafide: (student: Student) => void;
}

const StudentsTable = ({ students, onDelete, onEdit, onGenerateBonafide }: StudentsTableProps) => {
  
  const handleDeleteClick = (studentId: string) => {
    onDelete(studentId);
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Student Name</th>
            <th>Class</th>
            <th>Roll No.</th>
            <th>Parent's Name</th>
            <th>Parent's Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.studentId}</td>
              <td>
                <div className={styles.studentCell}>
                  <div className={styles.avatar}>
                    <span>{student.name.charAt(0)}</span>
                  </div>
                  {student.name}
                </div>
              </td>
              <td>{student.class}</td>
              <td>{student.rollNo}</td>
              <td>{student.parentName}</td>
              <td>{student.parentContact}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(student)} className={`${styles.actionBtn} ${styles.edit}`}>
                    <FiEdit />
                  </button>
                  <button onClick={() => handleDeleteClick(student.id)} className={`${styles.actionBtn} ${styles.delete}`}>
                    <FiTrash2 />
                  </button>
                  {/* --- YEH NAYA BUTTON HAI --- */}
                  <button 
                    onClick={() => onGenerateBonafide(student)} 
                    className={`${styles.actionBtn} ${styles.bonafide}`}
                    title="Generate Bonafide"
                  >
                    <FiFileText />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentsTable;
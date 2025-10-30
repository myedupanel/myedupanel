"use client";
import React from 'react';
import styles from './TeachersTable.module.scss';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

// Step 1: Add teacherId to the interface
interface Teacher {
  id: string;
  teacherId: string;
  name: string;
  subject: string;
  contactNumber: string;
  email: string;
}

interface TeachersTableProps {
  teachers: Teacher[];
  onDelete: (id: string) => void;
  onEdit: (teacher: Teacher) => void;
}

const TeachersTable: React.FC<TeachersTableProps> = ({ teachers, onDelete, onEdit }) => {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {/* Step 2: Add the new column header */}
            <th>Teacher ID</th>
            <th>Teacher Name</th>
            <th>Subject</th>
            <th>Contact Number</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.id}>
              {/* Step 3: Add the data cell for the ID */}
              <td>{teacher.teacherId}</td>
              <td>{teacher.name}</td>
              <td>{teacher.subject}</td>
              <td>{teacher.contactNumber}</td>
              <td>{teacher.email}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(teacher)} className={`${styles.actionBtn} ${styles.edit}`}>
                    <FiEdit />
                  </button>
                  <button onClick={() => onDelete(teacher.id)} className={`${styles.actionBtn} ${styles.delete}`}>
                    <FiTrash2 />
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

export default TeachersTable;
"use client";
import React from 'react';
import styles from './ParentsTable.module.scss';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

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
  studentId: Student; // Nested student object
}

interface ParentsTableProps {
  parents: Parent[];
  onDelete: (id: string) => void;
  onEdit: (parent: Parent) => void;
}

const ParentsTable: React.FC<ParentsTableProps> = ({ parents, onDelete, onEdit }) => {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Parent Name</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Occupation</th>
            <th>Student Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {parents.map((parent) => (
            <tr key={parent.id}>
              <td>{parent.name}</td>
              <td>{parent.contactNumber}</td>
              <td>{parent.email}</td>
              <td>{parent.occupation}</td>
              {/* We can now access the student's name directly! */}
              <td>{parent.studentId ? parent.studentId.name : 'N/A'}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(parent)} className={`${styles.actionBtn} ${styles.edit}`}>
                    <FiEdit />
                  </button>
                  <button onClick={() => onDelete(parent.id)} className={`${styles.actionBtn} ${styles.delete}`}>
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

export default ParentsTable;
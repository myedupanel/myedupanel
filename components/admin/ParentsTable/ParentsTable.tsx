// components/admin/ParentsTable/ParentsTable.tsx
"use client";
import React from 'react';
import styles from './ParentsTable.module.scss';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

// --- FIX: Interface ko 'page.tsx' ke 'ParentData' se match kiya ---
// Yeh woh data hai jo 'page.tsx' se 'parents' prop mein aa raha hai
interface ParentDataProp {
  id: number; // ID ab number hai
  name: string;
  contactNumber: string;
  email: string;
  occupation: string;
  // Student data ab flat hai (nested nahi hai)
  studentName: string;
  studentClass: string;
  studentid: number | null;
  schoolId: string; // <-- YEH FIELD ADD KIYA
}

interface ParentsTableProps {
  parents: ParentDataProp[]; // FIX: Naya type use kiya
  onDelete: (id: number) => void; // FIX: ID ab number hai
  onEdit: (parent: ParentDataProp) => void; // FIX: Naya type use kiya
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
            <th>Student Class</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {parents.map((parent) => (
            <tr key={parent.id}> {/* FIX: key ab number ID hai */}
              <td>{parent.name}</td>
              <td>{parent.contactNumber}</td>
              <td>{parent.email}</td>
              <td>{parent.occupation || 'N/A'}</td>
              {/* FIX: Nested 'parent.studentId.name' ke bajaye seedha 'parent.studentName' */}
              <td>{parent.studentName || 'N/A'}</td>
              <td>{parent.studentClass || 'N/A'}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(parent)} className={`${styles.actionBtn} ${styles.edit}`}>
                    <FiEdit />
                  </button>
                  {/* FIX: 'onDelete' ab number ID bhejega */}
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
// components/admin/TeachersTable/TeachersTable.tsx
"use client";
import React from 'react';
import styles from './TeachersTable.module.scss';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

// --- FIX: Interface ko 'page.tsx' ke 'TeacherData' se match kiya ---
interface TeacherDataProp {
  teacher_dbid: number; // Database ID (ab number hai)
  teacherId: string;    // Form waali ID (jaise "T-101")
  name: string;
  subject: string;
  contactNumber: string;
  email: string;
}

interface TeachersTableProps {
  teachers: TeacherDataProp[]; // FIX: Naya type use kiya
  onDelete: (id: number) => void; // FIX: ID ab number hai
  onEdit: (teacher: TeacherDataProp) => void; // FIX: Naya type use kiya
}

const TeachersTable: React.FC<TeachersTableProps> = ({ teachers, onDelete, onEdit }) => {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
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
            // FIX: Key ko 'teacher_dbid' (number ID) kiya
            <tr key={teacher.teacher_dbid}>
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
                  {/* FIX: 'onDelete' ab number ID (teacher_dbid) bhejega */}
                  <button onClick={() => onDelete(teacher.teacher_dbid)} className={`${styles.actionBtn} ${styles.delete}`}>
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
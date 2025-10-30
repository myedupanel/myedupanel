// components/admin/StudentsTable/StudentsTable.tsx

"use client";
import React from 'react';
import styles from './StudentsTable.module.scss';
import { FiEdit, FiTrash2, FiFileText } from 'react-icons/fi';

// --- FIX: Interface ko naye 'StudentData' type se match kiya ---
interface StudentData {
  studentid: number;      // Database ID (ab number hai)
  roll_number: string;    // Yeh "Student ID" ya "Roll No." ki tarah display hoga
  first_name: string;
  last_name: string;
  class_name: string;
  father_name: string;
  guardian_contact: string;
  // Baaki optional fields jo page.tsx se aa rahe hain (lekin table mein zaroori nahi)
  [key: string]: any; // Doosre fields ko allow karne ke liye
}

interface StudentsTableProps {
  students: StudentData[]; // FIX: Ab naya type 'StudentData[]' accept karega
  onDelete: (id: number) => void; // FIX: Ab 'number' ID expect karega
  onEdit: (student: StudentData) => void; // FIX: Ab 'StudentData' type expect karega
  onGenerateBonafide: (student: StudentData) => void; // FIX: Ab 'StudentData' type expect karega
}

const StudentsTable = ({ students, onDelete, onEdit, onGenerateBonafide }: StudentsTableProps) => {
  
  // FIX: 'handleDeleteClick' ab 'number' ID lega
  const handleDeleteClick = (studentId: number) => {
    onDelete(studentId);
  };

  // Helper function poora naam jodne ke liye
  const getFullName = (student: StudentData) => {
    return [student.first_name, student.last_name].filter(Boolean).join(' ');
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Student ID / Roll No.</th> {/* FIX: Header badla */}
            <th>Student Name</th>
            <th>Class</th>
            <th>Parent's Name</th>
            <th>Parent's Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.studentid}> {/* FIX: Key ko 'studentid' kiya */}
              
              <td>{student.roll_number}</td> {/* FIX: 'studentId' ko 'roll_number' kiya */}
              
              <td>
                <div className={styles.studentCell}>
                  <div className={styles.avatar}>
                    {/* FIX: 'name' ko 'first_name' kiya */}
                    <span>{student.first_name ? student.first_name.charAt(0) : 'S'}</span>
                  </div>
                  {getFullName(student)} {/* FIX: 'name' ko helper function se badla */}
                </div>
              </td>
              
              <td>{student.class_name}</td> {/* FIX: 'class' ko 'class_name' kiya */}
              
              {/* FIX: 'rollNo' waala column hata diya, kyonki woh 'roll_number' ke saath merge ho gaya hai */}
              
              <td>{student.father_name}</td> {/* FIX: 'parentName' ko 'father_name' kiya */}
              <td>{student.guardian_contact}</td> {/* FIX: 'parentContact' ko 'guardian_contact' kiya */}
              
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(student)} className={`${styles.actionBtn} ${styles.edit}`}>
                    <FiEdit />
                  </button>
                  {/* FIX: 'student.id' (string) ko 'student.studentid' (number) se badla */}
                  <button onClick={() => handleDeleteClick(student.studentid)} className={`${styles.actionBtn} ${styles.delete}`}>
                    <FiTrash2 />
                  </button>
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
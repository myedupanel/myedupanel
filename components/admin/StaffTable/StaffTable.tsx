// components/admin/StaffTable/StaffTable.tsx

"use client";
import React from 'react';
import styles from './StaffTable.module.scss';
import { MdEdit, MdDelete } from 'react-icons/md';

// --- Interface Updated: id ab number hai ---
interface StaffMember {
  id: number; // FIX: Changed to number
  staffId: string; // This is the ID entered in the form, for display
  name: string;
  role: string;
  contact: string;
  joiningDate: string;
  leavingDate?: string;
}
// --- END ---


interface StaffTableProps {
  staff: StaffMember[];
  onDelete: (staffId: number) => void; // FIX: Expects number
  onEdit: (staffMember: StaffMember) => void; 
}

const StaffTable = ({ staff, onDelete, onEdit }: StaffTableProps) => {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Staff ID</th> 
            <th>Name</th>
            <th>Role</th>
            <th>Contact</th>
            <th>Joining Date</th>
            <th>Leaving Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.length > 0 ? (
            staff.map((member) => (
              // --- Key ab number ID hai ---
              <tr key={member.id}>
                <td>{member.staffId}</td>
                <td>{member.name}</td>
                <td>{member.role}</td>
                <td>{member.contact}</td>
                <td>{member.joiningDate}</td>
                <td>{member.leavingDate || 'N/A'}</td>
                <td className={styles.actions}>
                  <button className={styles.iconButton} title="Edit" onClick={() => onEdit(member)}>
                    <MdEdit />
                  </button>
                  {/* --- onDelete ab number ID bhejega --- */}
                  <button className={`${styles.iconButton} ${styles.deleteButton}`} title="Delete" onClick={() => onDelete(member.id)}>
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className={styles.emptyMessage}>No staff members found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
export default StaffTable;
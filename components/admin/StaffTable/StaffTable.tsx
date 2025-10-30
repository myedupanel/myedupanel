"use client";
import React from 'react';
import styles from './StaffTable.module.scss';
import { MdEdit, MdDelete } from 'react-icons/md';

// --- Interface Updated: Add staffId for display ---
interface StaffMember {
  id: string; // This is the MongoDB id, used for key and actions
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
  onDelete: (staffId: string) => void; // Expects id (which is passed as 'id' prop)
  onEdit: (staffMember: StaffMember) => void; // Expects this component's StaffMember type
}

const StaffTable = ({ staff, onDelete, onEdit }: StaffTableProps) => {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Staff ID</th> {/* Header remains same */}
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
              // --- Use member.id (which is id) for the key ---
              <tr key={member.id}>
                {/* --- Display member.staffId in the first column --- */}
                <td>{member.staffId}</td>
                {/* --- Other columns remain same --- */}
                <td>{member.name}</td>
                <td>{member.role}</td>
                <td>{member.contact}</td>
                <td>{member.joiningDate}</td>
                <td>{member.leavingDate || 'N/A'}</td>
                <td className={styles.actions}>
                  {/* onEdit sends the full 'member' object */}
                  <button className={styles.iconButton} title="Edit" onClick={() => onEdit(member)}>
                    <MdEdit />
                  </button>
                  {/* onDelete sends member.id (which is the id) */}
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
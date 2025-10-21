"use client";
import React from 'react';
import styles from './StaffTable.module.scss';
import { MdEdit, MdDelete } from 'react-icons/md';

interface StaffMember {
  id: string; name: string; role: string; contact: string; joiningDate: string;
  leavingDate?: string;
}

interface StaffTableProps {
  staff: StaffMember[];
  onDelete: (staffId: string) => void;
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
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.name}</td>
                <td>{member.role}</td>
                <td>{member.contact}</td>
                <td>{member.joiningDate}</td>
                <td>{member.leavingDate || 'N/A'}</td>
                <td className={styles.actions}>
                  <button className={styles.iconButton} title="Edit" onClick={() => onEdit(member)}>
                    <MdEdit />
                  </button>
                  <button className={`${styles.iconButton} ${styles.deleteButton}`} title="Delete" onClick={() => onDelete(member.id)}>
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className={styles.emptyMessage}>No staff members found. Add one to get started!</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
export default StaffTable;
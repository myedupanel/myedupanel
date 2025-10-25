"use client";
import React from 'react';
import styles from './StaffTable.module.scss';
import { MdEdit, MdDelete } from 'react-icons/md';

// --- UPDATED StaffMember Interface ---
// Matches the data structure coming from page.tsx (backend User model)
interface StaffMember {
  _id: string;        // Changed from id to _id
  name: string;
  email: string;     // Added email field
  role: string;      // Expects backend role ('teacher', 'staff')
  contact?: string;    // Made contact optional
  createdAt?: string; // Using createdAt from User model instead of joiningDate
  // joiningDate?: string; // Removed joiningDate for now
  // leavingDate?: string; // Removed leavingDate
}
// --- END INTERFACE UPDATE ---

// --- UPDATED StaffTableProps Interface ---
interface StaffTableProps {
  staff: StaffMember[]; // Expects array of the updated StaffMember type
  onDelete: (staffId: string) => void; // Expects _id to be passed
  onEdit: (staffMember: StaffMember) => void; // Expects the updated StaffMember type
  // Removed getDisplayRole prop, we'll handle display inside the component
}
// --- END PROPS UPDATE ---

// --- Helper function to format date (optional but nice) ---
const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        // Format as DD Mon YYYY (e.g., 25 Oct 2025)
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return 'Invalid Date';
    }
};

// --- Helper function to get display role ---
const getDisplayRole = (backendRole: string): string => {
    switch(backendRole) {
        case 'teacher': return 'Teacher';
        case 'staff': return 'Staff'; // General Staff, maybe map specific designations later if you add Staff model
        case 'admin': return 'Admin';
        case 'parent': return 'Parent';
        default: return backendRole.charAt(0).toUpperCase() + backendRole.slice(1); // Default title case
    }
};


const StaffTable = ({ staff, onDelete, onEdit }: StaffTableProps) => { // Removed getDisplayRole from props destructuring
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {/* <th>Staff ID</th> */}{/* Removed Staff ID column for simplicity, using Name/Email */}
            <th>Name</th>
            <th>Role</th>
            <th>Email</th> {/* Added Email Column */}
            <th>Contact</th>
            <th>Created/Joined</th> {/* Changed Header */}
            {/* <th>Leaving Date</th> */}{/* Removed Leaving Date Column */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.length > 0 ? (
            staff.map((member) => (
              // --- UPDATED Key and Data Usage ---
              <tr key={member._id}> {/* Use _id for key */}
                {/* <td>{member.staffId || member._id}</td> */}{/* Display _id or staffId if available */}
                <td>{member.name}</td>
                {/* Use helper function to display role */}
                <td>{getDisplayRole(member.role)}</td>
                <td>{member.email}</td> {/* Display Email */}
                <td>{member.contact || 'N/A'}</td> {/* Display Contact or N/A */}
                {/* Display formatted createdAt date */}
                <td>{formatDate(member.createdAt)}</td>
                {/* <td>{member.leavingDate ? formatDate(member.leavingDate) : 'N/A'}</td> */}{/* Leaving date removed */}
                <td className={styles.actions}>
                  <button className={styles.iconButton} title="Edit" onClick={() => onEdit(member)}>
                    <MdEdit />
                  </button>
                  {/* Pass _id to onDelete */}
                  <button className={`${styles.iconButton} ${styles.deleteButton}`} title="Delete" onClick={() => onDelete(member._id)}>
                    <MdDelete />
                  </button>
                </td>
              </tr>
              // --- END UPDATED Key and Data Usage ---
            ))
          ) : (
            <tr>
              {/* Updated colSpan */}
              <td colSpan={6} className={styles.emptyMessage}>No staff members found. Add one to get started!</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
export default StaffTable;
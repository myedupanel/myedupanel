"use client";
import React, { useState, useEffect } from 'react';
import styles from './StaffPage.module.scss';
import { MdAdd, MdSearch } from 'react-icons/md';
import StaffTable from '@/components/admin/StaffTable/StaffTable';
import Modal from '@/components/common/Modal/Modal';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';
import EditStaffForm from '@/components/admin/EditStaffForm/EditStaffForm'; // <-- Naya form import karein

const allRoles = ['All', 'Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff','Other' ];

interface StaffMember {
  id: string; name: string; role: string; contact: string; joiningDate: string;
  leavingDate?: string;
}

const StaffPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');

  // Naya State: Edit modal ke liye
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);

  useEffect(() => {
    const savedStaff = localStorage.getItem('staffList');
    if (savedStaff) {
      setStaffList(JSON.parse(savedStaff));
    }
  }, []);

  const handleSaveStaff = (newStaffData: any) => {
    const newStaffMember: StaffMember = {
      id: newStaffData.staffId, name: newStaffData.name, role: newStaffData.role, contact: newStaffData.contact,
      joiningDate: new Date(newStaffData.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      leavingDate: newStaffData.leavingDate ? new Date(newStaffData.leavingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined,
    };
    const updatedStaffList = [newStaffMember, ...staffList];
    setStaffList(updatedStaffList);
    localStorage.setItem('staffList', JSON.stringify(updatedStaffList));
    setIsAddModalOpen(false);
  };

  const handleDeleteStaff = (staffId: string) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      const updatedList = staffList.filter(member => member.id !== staffId);
      setStaffList(updatedList);
      localStorage.setItem('staffList', JSON.stringify(updatedList));
    }
  };

  // Naya function: Edit modal kholne ke liye
  const handleEditClick = (staffMember: StaffMember) => {
    setCurrentStaff(staffMember);
    setIsEditModalOpen(true);
  };

  // Naya function: Staff member ko update karne ke liye
  const handleUpdateStaff = (updatedStaffData: StaffMember) => {
    const updatedList = staffList.map(member => 
      member.id === updatedStaffData.id ? updatedStaffData : member
    );
    setStaffList(updatedList);
    localStorage.setItem('staffList', JSON.stringify(updatedList));
    setIsEditModalOpen(false);
  };

  const filteredStaff = staffList
    .filter(member => (filterRole === 'All' ? true : member.role === filterRole))
    .filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={styles.staffContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Staff Management</h1>
        <button className={styles.addButton} onClick={() => setIsAddModalOpen(true)}>
          <MdAdd /> Add New Staff
        </button>
      </div>
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <MdSearch />
          <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className={styles.filterDropdown} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
      </div>
      
      <StaffTable staff={filteredStaff} onDelete={handleDeleteStaff} onEdit={handleEditClick} />

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Staff Member">
        <AddStaffForm onClose={() => setIsAddModalOpen(false)} onSave={handleSaveStaff} />
      </Modal>

      {/* Naya Modal: Edit Staff ke liye */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Staff Member">
        {currentStaff && (
          <EditStaffForm 
            onClose={() => setIsEditModalOpen(false)} 
            onSave={handleUpdateStaff}
            staffData={currentStaff}
          />
        )}
      </Modal>
    </div>
  );
};
export default StaffPage;
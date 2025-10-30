"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './StaffPage.module.scss';
import { MdAdd, MdSearch, MdGridView } from 'react-icons/md';
import StaffTable from '@/components/admin/StaffTable/StaffTable';
// Define the type StaffTable USES (Based on StaffTable.tsx code)
interface StaffTableMemberType {
  id: string;
  staffId: string; 
  name: string;
  role: string;
  contact: string;
  joiningDate: string; // Formatted Date
  leavingDate?: string; // Formatted Date
}
import Modal from '@/components/common/Modal/Modal';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';
import EditStaffForm from '@/components/admin/EditStaffForm/EditStaffForm';
import Link from 'next/link';
import axios from 'axios';
import api from '@/backend/utils/api';
import { io } from "socket.io-client";
import { useAuth } from '@/app/context/AuthContext';

const allRoles = ['All', 'Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff','Other' ];

// Interface for data coming FROM THE API
interface ApiStaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  schoolId?: string;
  createdAt?: string;
  details?: {
    staffId?: string;
    contactNumber?: string;
    joiningDate?: string;
    leavingDate?: string;
  }
}

// Interface for internal state management
interface InternalStaffMember {
   id: string;
   staffId: string; // Staff ID from form/details
   name: string;
   role: string;
   contact: string;
   email: string;
   joiningDate: string; // Formatted Date
   leavingDate?: string;
   schoolId?: string;
   contactNumber?: string;
   rawJoiningDate?: string;
   rawLeavingDate?: string;
}

// Interface for Add/Edit Form Data
interface StaffFormData {
    staffId?: string;
    name: string;
    role: string;
    contactNumber?: string;
    email: string;
    joiningDate: string; // YYYY-MM-DD string
    leavingDate?: string;
}

// Helper to transform API data
const transformApiData = (apiStaff: ApiStaffMember): InternalStaffMember => {
    const details = apiStaff.details || {};
    const formattedJoiningDate = details.joiningDate
        ? new Date(details.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A';
    const formattedLeavingDate = details.leavingDate
        ? new Date(details.leavingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : undefined;

    return {
        id: apiStaff.id,
        // --- FIX: Ensure staffId always has a value ---
        staffId: details.staffId || apiStaff.id || 'N/A', 
        // --- END FIX ---
        name: apiStaff.name || 'N/A',
        role: apiStaff.role || 'N/A',
        contact: details.contactNumber || 'N/A',
        email: apiStaff.email || 'N/A',
        joiningDate: formattedJoiningDate,
        leavingDate: formattedLeavingDate,
        schoolId: apiStaff.schoolId,
        contactNumber: details.contactNumber,
        rawJoiningDate: details.joiningDate,
        rawLeavingDate: details.leavingDate,
    };
};


const StaffPage = () => {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<InternalStaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<InternalStaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // fetchStaff (No change)
  const fetchStaff = useCallback(async () => {
      // ... (fetch logic remains same) ...
        if (!user?.id) {
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      setError(null);
      try {
          const response = await api.get<{ data: ApiStaffMember[] }>('/staff', {
              params: { schoolId: user.id }
          });
          const transformedData = (response.data?.data || []).map(transformApiData);
          setStaffList(transformedData);
      } catch (err: any) {
          console.error("Failed to fetch staff:", err);
          setError("Could not load staff data. Please try again.");
          setStaffList([]);
      } finally {
          setIsLoading(false);
      }
  }, [user?.id]);


  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Socket.IO useEffect (No change)
  useEffect(() => {
      // ... (socket logic remains same) ...
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://myedupanel.onrender.com");
      socket.on('connect', () => console.log('StaffPage Socket Connected'));

      socket.on('staff_added', (rawNewStaff: ApiStaffMember) => {
          console.log('SOCKET: Staff Added Raw:', rawNewStaff);
          const newStaff = transformApiData(rawNewStaff);
          console.log('SOCKET: Staff Added Transformed:', newStaff);
          if(newStaff.schoolId === user?.id) {
             setStaffList((prevList) => {
                 if (prevList.some(s => s.id === newStaff.id)) return prevList;
                 return [newStaff, ...prevList].sort((a,b) => a.name.localeCompare(b.name));
             });
             console.log('SOCKET: Staff list updated (added)');
          } else {
             console.log('SOCKET: Added staff ignored (different school)');
          }
      });

      socket.on('staff_updated', (rawUpdatedStaff: ApiStaffMember) => {
          console.log('SOCKET: Staff Updated Raw:', rawUpdatedStaff);
          const updatedStaff = transformApiData(rawUpdatedStaff);
          console.log('SOCKET: Staff Updated Transformed:', updatedStaff);
           if(updatedStaff.schoolId === user?.id) {
                setStaffList((prevList) =>
                    prevList.map((staff) =>
                    staff.id === updatedStaff.id ? updatedStaff : staff
                    )
                );
                console.log('SOCKET: Staff list updated (updated)');
           } else {
               console.log('SOCKET: Updated staff ignored (different school)');
           }
      });

      socket.on('staff_deleted', (deletedStaffInfo: { id: string, schoolId: string }) => {
          console.log('SOCKET: Staff Deleted Info:', deletedStaffInfo);
          if (deletedStaffInfo.schoolId === user?.schoolId) {
              setStaffList((prevList) =>
                prevList.filter((staff) => staff.id !== deletedStaffInfo.id)
              );
              console.log('SOCKET: Staff list updated (deleted)');
          } else {
              console.log('SOCKET: Deleted staff ignored (different school)');
          }
      });

      socket.on('disconnect', () => console.log('StaffPage Socket Disconnected'));
      socket.on('connect_error', (err) => console.error('StaffPage Socket Connection Error:', err));
      return () => { socket.disconnect(); };
  }, [user?.id]);

  // handleSaveStaff (No change)
  const handleSaveStaff = async (staffFormData: StaffFormData) => {
    // ... (logic remains same) ...
     if (!staffFormData.email) {
        alert("Email is required.");
        return;
    }
    const dataToSend = { ...staffFormData };
    try {
        await api.post('/staff', dataToSend);
        setIsAddModalOpen(false);
    } catch (err: any) {
        console.error("Failed to save staff:", err);
        alert(`Error adding staff: ${err.response?.data?.msg || err.message}`);
    }
  };

  // handleDeleteStaff (No change)
  const handleDeleteStaff = async (staffId: string) => {  
    // ... (logic remains same) ...
     if (window.confirm("Delete staff member?")) {
      try {
        await api.delete(`/staff/${staffId}`);
      } catch (err: any) {
        console.error('Failed to delete staff:', err);
        alert(`Error deleting staff: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  // handleEditClick (No change)
  const handleEditClick = (staffTableMember: StaffTableMemberType) => { // Receives type StaffTable sends
    // ... (logic remains same) ...
    console.log("Edit clicked for (from table):", staffTableMember);
    const staffToEdit = staffList.find(s => s.id === staffTableMember.id);
    if (staffToEdit) {
        console.log("Found internal staff object to edit:", staffToEdit);
        setCurrentStaff(staffToEdit);
        setIsEditModalOpen(true);
    } else {
        console.error("Could not find internal staff member in list to edit using id:", staffTableMember.id);
        alert("Could not initiate edit. Please refresh.");
    }
  };

  // handleUpdateStaff (No change)
  const handleUpdateStaff = async (staffFormData: StaffFormData) => {
      // ... (logic remains same) ...
        if (!currentStaff?.id) return;
      const dataToSend = { ...staffFormData };
      try {
          await api.put(`/staff/${currentStaff.id}`, dataToSend);
          setIsEditModalOpen(false);
          setCurrentStaff(null);
      } catch (err: any) {
          console.error('Failed to update staff:', err);
          alert(`Error updating staff: ${err.response?.data?.msg || err.message}`);
      }
  };

  // Filter logic (No change)
  const filteredStaff = useMemo(() => {
        // ... (logic remains same) ...
          return staffList
            .filter(member => (filterRole === 'All' ? true : member.role === filterRole))
            .filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()));
   }, [staffList, filterRole, searchTerm]);


  return (
    <div className={styles.staffContainer}>
      {/* Header and Controls (No change) */}
      <div className={styles.header}>
        {/* ... */}
         <h1 className={styles.title}>Staff Management</h1>
        <button className={styles.addButton} onClick={() => { setCurrentStaff(null); setIsAddModalOpen(true); }}>
          <MdAdd /> Add New Staff
        </button>
      </div>
      <div className={styles.controls}>
         {/* ... */}
         <div className={styles.searchBox}>
          <MdSearch />
          <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className={styles.filterDropdown} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
      </div>

      {/* Loading/Error/Table Section */}
      {isLoading ? (
          <div className={styles.loadingState}>Loading Staff...</div>
      ) : error ? (
          <div className={styles.errorState}>{error} <button onClick={fetchStaff}>Retry</button></div>
      ) : staffList.length === 0 ? (
          <div className={styles.emptyState}>No staff members found. Add one to get started!</div>
      ) : (
          // === PASS CORRECT MAPPED DATA TO StaffTable ===
          <StaffTable
              // Map internal data to the exact format StaffTable expects
              staff={filteredStaff.map(s => ({
                  id: s.id,
                  staffId: s.staffId, // Pass staffId for display in the first column
                  name: s.name,
                  role: s.role,
                  contact: s.contact, // Pass transformed contact
                  joiningDate: s.joiningDate, // Pass formatted date
                  leavingDate: s.leavingDate, // Pass formatted date
                  // Exclude fields StaffTable doesn't need: , email, schoolId, contactNumber, rawDates
              }))}
              
              onDelete={handleDeleteStaff}
              // Pass the function expecting StaffTableMemberType
              onEdit={handleEditClick}
          />
          // === END ===
      )}

      {/* Modals */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Staff Member">
        <AddStaffForm onClose={() => setIsAddModalOpen(false)} onSave={handleSaveStaff} />
      </Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Staff Member">
        {currentStaff && (
          // EditStaffForm uses InternalStaffMember
          <EditStaffForm
            onClose={() => { setIsEditModalOpen(false); setCurrentStaff(null); }}
            onSave={handleUpdateStaff}
            staffData={currentStaff} // Pass InternalStaffMember
          />
        )}
      </Modal>

      {/* Dashboard Link */}
      <Link href="/admin/school" className={styles.dashboardLinkButton}>
        <MdGridView />
        Go to Dashboard
      </Link>
    </div>
  );
};
export default StaffPage;
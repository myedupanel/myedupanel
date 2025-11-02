"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './StaffPage.module.scss';
import { MdAdd, MdSearch, MdGridView } from 'react-icons/md';
import StaffTable from '@/components/admin/StaffTable/StaffTable';
import Modal from '@/components/common/Modal/Modal';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';
import EditStaffForm from '@/components/admin/EditStaffForm/EditStaffForm';
import Link from 'next/link';
// import axios from 'axios'; // api import ho raha hai, iski zaroorat nahi
import api from '@/backend/utils/api';
import { io } from "socket.io-client";
import { useAuth } from '@/app/context/AuthContext';

const allRoles = ['All', 'Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff','Other' ];

// StaffTable component in fields ko expect karta hai
interface StaffTableMemberType {
  id: number; 
  staffId: string; 
  name: string;
  role: string;
  contact: string;
  joiningDate: string; 
  leavingDate?: string; 
}

// --- YAHAN BADLAAV KIYA GAYA HAI ---
// API se ab 'staffProfile' nested aayega
interface ApiStaffMember {
  id: number; 
  name: string;
  role: string;
  email: string;
  schoolId?: string;
  createdAt?: string;
  // 'details' ke bajaye ab 'staffProfile' aayega
  staffProfile: {
    staffId?: string;
    contactNumber?: string;
    joiningDate?: string;
    leavingDate?: string;
  } | null; // Yeh null ho sakta hai agar data corrupt ho
}
// --- END BADLAAV ---

// Internal state (No Change)
interface InternalStaffMember {
   id: number; 
   staffId: string; 
   name: string;
   role: string;
   contact: string;
   email: string;
   joiningDate: string; 
   leavingDate?: string;
   schoolId?: string;
   contactNumber?: string; // Edit form ke liye
   rawJoiningDate?: string; // Edit form ke liye
   rawLeavingDate?: string; // Edit form ke liye
}

// Form data (No Change)
interface StaffFormData {
    staffId?: string;
    name: string;
    role: string;
    contactNumber?: string;
    email: string;
    joiningDate: string; 
    leavingDate?: string;
}

// --- YAHAN BADLAAV KIYA GAYA HAI ---
// Helper to transform API data
const transformApiData = (apiStaff: ApiStaffMember): InternalStaffMember => {
    // 'details' ke bajaye ab 'staffProfile' se data lein
    const profile = apiStaff.staffProfile || {}; 
    
    const formattedJoiningDate = profile.joiningDate
        ? new Date(profile.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A';
    const formattedLeavingDate = profile.leavingDate
        ? new Date(profile.leavingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : undefined;

    return {
        id: apiStaff.id, 
        staffId: profile.staffId || String(apiStaff.id) || 'N/A', 
        name: apiStaff.name || 'N/A',
        role: apiStaff.role || 'N/A',
        contact: profile.contactNumber || 'N/A', // <-- YEH AB KAAM KAREGA
        email: apiStaff.email || 'N/A',
        joiningDate: formattedJoiningDate, // <-- YEH AB KAAM KAREGA
        leavingDate: formattedLeavingDate,
        schoolId: apiStaff.schoolId,
        contactNumber: profile.contactNumber, // Edit form ke liye
        rawJoiningDate: profile.joiningDate, // Edit form ke liye
        rawLeavingDate: profile.leavingDate, // Edit form ke liye
    };
};
// --- END BADLAAV ---


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

  // fetchStaff (No Change)
  const fetchStaff = useCallback(async () => {
        if (!user?.schoolId) { 
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      setError(null);
      try {
          // Backend ab naya data format bhejega
          const response = await api.get<{ data: ApiStaffMember[] }>('/staff'); 
          
          // Naya 'transformApiData' function naye data ko handle kar lega
          const transformedData = (response.data?.data || []).map(transformApiData);
          setStaffList(transformedData);
      } catch (err: any) {
          console.error("Failed to fetch staff:", err);
          setError("Could not load staff data. Please try again.");
          setStaffList([]);
      } finally {
          setIsLoading(false);
      }
  }, [user?.schoolId]); 

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Socket.IO useEffect (No Change)
  useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://myedupanel.onrender.com");
      socket.on('connect', () => console.log('StaffPage Socket Connected'));

      socket.on('staff_added', (rawNewStaff: ApiStaffMember) => {
          // Naya 'transformApiData' function naye socket data ko handle kar lega
          const newStaff = transformApiData(rawNewStaff); 
          if(newStaff.schoolId === user?.schoolId) { 
             setStaffList((prevList) => {
                 if (prevList.some(s => s.id === newStaff.id)) return prevList; 
                 return [newStaff, ...prevList].sort((a,b) => a.name.localeCompare(b.name));
             });
          }
      });

      socket.on('staff_updated', (rawUpdatedStaff: ApiStaffMember) => {
          // Naya 'transformApiData' function naye socket data ko handle kar lega
          const updatedStaff = transformApiData(rawUpdatedStaff);
           if(updatedStaff.schoolId === user?.schoolId) { 
                setStaffList((prevList) =>
                    prevList.map((staff) =>
                    staff.id === updatedStaff.id ? updatedStaff : staff 
                    )
                );
           }
      });

      socket.on('staff_deleted', (deletedStaffInfo: { id: number, schoolId: string }) => { 
          if (deletedStaffInfo.schoolId === user?.schoolId) { 
              setStaffList((prevList) =>
                prevList.filter((staff) => staff.id !== deletedStaffInfo.id) 
              );
          }
      });

      socket.on('disconnect', () => console.log('StaffPage Socket Disconnected'));
      socket.on('connect_error', (err) => console.error('StaffPage Socket Connection Error:', err));
      return () => { socket.disconnect(); };
  }, [user?.schoolId]); 

  // handleSaveStaff (No Change)
  const handleSaveStaff = async (staffFormData: StaffFormData) => {
     if (!staffFormData.email) {
        alert("Email is required.");
        return;
    }
    // Backend ab saare fields (staffId, contactNumber etc.) handle kar lega
    const dataToSend = { ...staffFormData };
    try {
        await api.post('/staff', dataToSend);
        setIsAddModalOpen(false);
    } catch (err: any) {
        console.error("Failed to save staff:", err);
        alert(`Error adding staff: ${err.response?.data?.msg || err.message}`);
    }
  };

  // handleDeleteStaff (No Change)
  const handleDeleteStaff = async (staffId: number) => { 
     if (window.confirm("Delete staff member?")) {
      try {
        await api.delete(`/staff/${staffId}`); 
      } catch (err: any) {
        console.error('Failed to delete staff:', err);
        alert(`Error deleting staff: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  // handleEditClick (No Change)
  const handleEditClick = (staffTableMember: StaffTableMemberType) => { 
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

  // handleUpdateStaff (No Change)
  const handleUpdateStaff = async (staffFormData: StaffFormData) => {
        if (!currentStaff?.id) return; 
      const dataToSend = { ...staffFormData };
      try {
          // Backend ab saare fields handle kar lega
          await api.put(`/staff/${currentStaff.id}`, dataToSend); 
          setIsEditModalOpen(false);
          setCurrentStaff(null);
      } catch (err: any) {
          console.error('Failed to update staff:', err);
          alert(`Error updating staff: ${err.response?.data?.msg || err.message}`);
      }
  };

  // Filter logic (No Change)
  const filteredStaff = useMemo(() => {
          return staffList
            .filter(member => (filterRole === 'All' ? true : member.role === filterRole))
            .filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()));
   }, [staffList, filterRole, searchTerm]);


  return (
    <div className={styles.staffContainer}>
      {/* Header and Controls (No change) */}
      <div className={styles.header}>
         <h1 className={styles.title}>Staff Management</h1>
        <button className={styles.addButton} onClick={() => { setCurrentStaff(null); setIsAddModalOpen(true); }}>
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

      {/* Loading/Error/Table Section */}
      {isLoading ? (
          <div className={styles.loadingState}>Loading Staff...</div>
      ) : error ? (
          <div className={styles.errorState}>{error} <button onClick={fetchStaff}>Retry</button></div>
      ) : staffList.length === 0 ? (
          <div className={styles.emptyState}>No staff members found. Add one to get started!</div>
      ) : (
          <StaffTable
              staff={filteredStaff.map(s => ({
                  id: s.id, 
                  staffId: s.staffId, 
                  name: s.name,
                  role: s.role,
                  contact: s.contact, // <-- YEH AB DATA DIKHAYEGA
                  joiningDate: s.joiningDate, // <-- YEH AB DATA DIKHAYEGA
                  leavingDate: s.leavingDate, 
              }))}
              
              onDelete={handleDeleteStaff} 
              onEdit={handleEditClick}
          />
      )}

      {/* Modals (No Change) */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Staff Member">
        <AddStaffForm onClose={() => setIsAddModalOpen(false)} onSave={handleSaveStaff} />
      </Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Staff Member">
        {currentStaff && (
          <EditStaffForm
            onClose={() => { setIsEditModalOpen(false); setCurrentStaff(null); }}
            onSave={handleUpdateStaff}
            staffData={currentStaff} 
          />
        )}
      </Modal>

      {/* Dashboard Link (No Change) */}
      <Link href="/admin/school" className={styles.dashboardLinkButton}>
        <MdGridView />
        Go to Dashboard
      </Link>
    </div>
  );
};
export default StaffPage;
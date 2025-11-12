// app/admin/staff/page.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './StaffPage.module.scss';
import { MdAdd, MdSearch, MdGridView } from 'react-icons/md';
// NAYE IMPORTS
import { FiMenu, FiSearch } from 'react-icons/fi'; 
import StaffTable from '@/components/admin/StaffTable/StaffTable';
import Modal from '@/components/common/Modal/Modal';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';
import EditStaffForm from '@/components/admin/EditStaffForm/EditStaffForm';
import Link from 'next/link';
import axios from 'axios';
import api from '@/backend/utils/api';
import { io } from "socket.io-client";
import { useAuth } from '@/app/context/AuthContext';
import { useAcademicYear } from '@/app/context/AcademicYearContext'; // Add this import

const allRoles = ['All', 'Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff','Other' ];

// Define the type StaffTable USES (Based on StaffTable.tsx code)
interface StaffTableMemberType {
  id: number; // FIX: Changed to number
  staffId: string; 
  name: string;
  role: string;
  contact: string;
  joiningDate: string; 
  leavingDate?: string; 
}

// Interface for data coming FROM THE API (Backend now sends numeric id)
interface ApiStaffMember {
  id: number; // FIX: Changed from _id: string to id: number
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

// Interface for internal state management (All IDs must be number)
interface InternalStaffMember {
   id: number; // FIX: Changed to number, removed duplicate _id/id: string
   staffId: string; // Staff ID from form/details
   name: string;
   role: string;
   contact: string;
   email: string;
   joiningDate: string; 
   leavingDate?: string;
   schoolId?: string;
   contactNumber?: string;
   rawJoiningDate?: string;
   rawLeavingDate?: string;
}

// Interface for Add/Edit Form Data (No change)
interface StaffFormData {
    staffId?: string;
    name: string;
    role: string;
    contactNumber?: string;
    email: string;
    joiningDate: string; 
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
        id: apiStaff.id, // FIX: Used apiStaff.id (number)
        staffId: details.staffId || String(apiStaff.id) || 'N/A', 
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
  const { currentYearId } = useAcademicYear(); // Add this line to use academic year context
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<InternalStaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<InternalStaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NAYE STATES FOR MOBILE
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);


  // fetchStaff (Fixed parameter and user ID usage)
  const fetchStaff = useCallback(async () => {
        if (!user?.schoolId) { 
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      setError(null);
      try {
          const response = await api.get<{ data: ApiStaffMember[] }>('/staff'); 
          const transformedData = (response.data?.data || []).map(transformApiData);
          setStaffList(transformedData);
      } catch (err: any) {
          console.error("Failed to fetch staff:", err);
          setError("Could not load staff data. Please try again.");
          setStaffList([]);
      } finally {
          setIsLoading(false);
      }
  }, [user?.schoolId, currentYearId]); 

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff, currentYearId]); 

  // Socket.IO useEffect (Fixed comparisons)
  useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://myedupanel.onrender.com");
      socket.on('connect', () => console.log('StaffPage Socket Connected'));

      socket.on('staff_added', (rawNewStaff: ApiStaffMember) => {
          const newStaff = transformApiData(rawNewStaff);
          if(newStaff.schoolId === user?.schoolId) { 
             setStaffList((prevList) => {
                 if (prevList.some(s => s.id === newStaff.id)) return prevList; 
                 return [newStaff, ...prevList].sort((a,b) => a.name.localeCompare(b.name));
             });
          }
      });

      socket.on('staff_updated', (rawUpdatedStaff: ApiStaffMember) => {
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

  // handleSaveStaff (No change)
  const handleSaveStaff = async (staffFormData: StaffFormData) => {
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

  // handleDeleteStaff (Fixed staffId type to number)
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

  // handleEditClick (Fixed received type)
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

  // handleUpdateStaff (Fixed user ID usage)
  const handleUpdateStaff = async (staffFormData: StaffFormData) => {
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
          return staffList
            .filter(member => (filterRole === 'All' ? true : member.role === filterRole))
            .filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()));
   }, [staffList, filterRole, searchTerm]);
   
   // NAYA: Search query handler for modal
  const handleSearchAndCloseModal = (query: string, role: string) => {
    setSearchTerm(query);
    setFilterRole(role);
    setIsSearchModalOpen(false);
  };


  return (
    <div className={styles.staffContainer}>
      {/* --- UPDATED HEADER FOR MOBILE/DESKTOP --- */}
      <header className={styles.header}>
        {/* Hamburger Icon (Mobile Only) */}
        <button className={styles.menuButton} onClick={() => setIsActionsModalOpen(true)}>
            <FiMenu />
        </button>
        
        <h1 className={styles.title}>Staff Management</h1>
        
        {/* Search Icon (Mobile Only) */}
        <button className={styles.searchToggleButton} onClick={() => setIsSearchModalOpen(true)}>
            <FiSearch />
        </button>

        {/* Desktop Add Button (Mobile pe hide) */}
        <button className={`${styles.addButton} ${styles.desktopAddButton}`} onClick={() => { setCurrentStaff(null); setIsAddModalOpen(true); }}>
          <MdAdd /> Add New Staff
        </button>
      </header>
      
      {/* Desktop Controls (Search and Filter) - Mobile pe hide */}
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
                  contact: s.contact, 
                  joiningDate: s.joiningDate, 
                  leavingDate: s.leavingDate, 
              }))}
              
              onDelete={handleDeleteStaff} 
              onEdit={handleEditClick} 
          />
      )}

      {/* Modals */}
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

      {/* 4. NAYA: Actions Modal (Hamburger Menu Content) */}
      <Modal isOpen={isActionsModalOpen} onClose={() => setIsActionsModalOpen(false)} title="Quick Actions">
        <div className={styles.actionsModalContent}>
            <button 
                onClick={() => { setCurrentStaff(null); setIsAddModalOpen(true); setIsActionsModalOpen(false); }} 
                className={`${styles.addButton} ${styles.modalAddButton}`}
            >
                <MdAdd /> Add New Staff
            </button>
        </div>
      </Modal>

      {/* 5. NAYA: Search Modal */}
      <Modal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} title="Search Staff">
        <div className={styles.searchModalContent}>
          {/* Mobile search: Passes the current searchTerm and filterRole to the StudentFilters component,
             which we'll use for both search text and the role dropdown in the modal.
             We need to adjust the StudentFilters to handle both text and a dropdown if it's reused here. 
             For now, we'll keep the search text filter and rely on the filterRole dropdown being outside the modal logic in the main component.
          */}
          <div className={styles.mobileSearchFilter}>
            {/* Using a simple input for search inside modal for simplicity, since StudentFilters expects a single onSearch handler */}
             <div className={styles.searchBox}>
                <MdSearch />
                <input 
                    type="text" 
                    placeholder="Search by name..." 
                    defaultValue={searchTerm} 
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSearchAndCloseModal(e.currentTarget.value, filterRole);
                        }
                    }}
                />
            </div>
            <select className={styles.filterDropdown} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
             <button 
                 className={styles.modalSearchApplyButton} 
                 onClick={() => {
                     const input = document.querySelector(`.${styles.mobileSearchFilter} input`) as HTMLInputElement;
                     handleSearchAndCloseModal(input.value, filterRole);
                 }}
             >
                 Apply Filters
             </button>
          </div>
        </div>
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
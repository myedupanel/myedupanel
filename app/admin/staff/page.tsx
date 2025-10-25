"use client";
import React, { useState, useEffect, useCallback } from 'react'; // useCallback ko import kiya
import styles from './StaffPage.module.scss';
import { MdAdd, MdSearch } from 'react-icons/md';
import StaffTable from '@/components/admin/StaffTable/StaffTable';
import Modal from '@/components/common/Modal/Modal';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';
import EditStaffForm from '@/components/admin/EditStaffForm/EditStaffForm';
// --- API Helper ko import karein ---
import api from '@/backend/utils/api'; // Path check kar lein
import { useAuth } from '@/app/context/AuthContext'; // Auth context use karein schoolId ke liye (optional)

// Frontend dropdown options (Title Case for display)
const displayRoles = ['All', 'Teacher', 'Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff', 'Other'];

// --- Staff Member Interface ko User model se align karein ---
interface StaffMember {
  _id: string; // MongoDB ID
  name: string;
  email: string; // Email zaroori hai User model ke liye
  role: string; // Backend role ('teacher', 'staff')
  contact?: string; // Optional field agar User model mein nahi hai
  joiningDate?: string; // Optional field agar User model mein nahi hai (ya createdAt use karein)
  createdAt?: string; // User model se aa sakta hai
  // Add other User fields if needed
}

const StaffPage = () => {
  const { user } = useAuth(); // Get logged in user if needed
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All'); // Filter frontend display roles
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [error, setError] = useState(''); // Error state

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);

  // --- Data Fetch karne ke liye function ---
  const fetchStaffAndTeachers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    console.log("Fetching staff and teachers from API...");
    try {
      // API se staff aur teachers dono fetch karein (assuming backend supports filtering)
      // Agar alag routes hain toh do alag calls karein
      const response = await api.get('/admin/users', {
        params: { roles: ['staff', 'teacher'] } // Backend ko batayein kaunse roles chahiye
      });
      console.log("API Response:", response.data);
      // Backend se aaye data ko StaffMember type mein map karein
      const fetchedUsers = response.data.map((user: any) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // Backend role ('teacher', 'staff')
        createdAt: user.createdAt, // Ya joiningDate agar alag model hai
        // contact: user.contact // Add agar User model mein hai
      }));
      setStaffList(fetchedUsers);
      console.log("Staff list updated from API.");
    } catch (err) {
      console.error("Failed to fetch staff/teachers:", err);
      setError('Could not load staff data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependency array khaali, ya [user] agar schoolId specific fetch karna hai

  // --- Initial data fetch ---
  useEffect(() => {
    fetchStaffAndTeachers();
  }, [fetchStaffAndTeachers]); // fetchStaffAndTeachers ko dependency mein daalein

  // --- Role Mapping Function ---
  const mapFrontendRoleToBackend = (frontendRole: string): string => {
    const roleLower = frontendRole.toLowerCase();
    if (roleLower === 'teacher') {
      return 'teacher';
    }
    // Baaki sabhi roles ko 'staff' maan lein
    // Aap yahaan aur specific mapping add kar sakte hain agar backend mein alag roles hain
    switch(roleLower) {
        case 'accountant':
        case 'office admin':
        case 'librarian':
        case 'security':
        case 'transport staff':
        case 'other':
            return 'staff';
        default:
            return 'staff'; // Default fallback
    }
  };

  // --- UPDATED: Naya staff save karne ke liye API call ---
  const handleSaveStaff = async (newStaffData: any) => {
     setError('');
     setIsLoading(true);
     console.log("Saving new staff:", newStaffData);

     // Map frontend role to backend role
     const backendRole = mapFrontendRoleToBackend(newStaffData.role);
     console.log(`Mapped role: ${newStaffData.role} -> ${backendRole}`);

     // Data object backend ke liye (ensure all required fields are present)
     const payload = {
        name: newStaffData.name,
        email: newStaffData.email, // Ensure AddStaffForm provides email
        role: backendRole,
        // Optional fields ko bhi include kar sakte hain agar backend /create-user route handle karta hai
        // contact: newStaffData.contact,
        // joiningDate: newStaffData.joiningDate,
     };

     try {
       // Sahi API endpoint ko call karein
       const response = await api.post('/admin/create-user', payload);
       console.log("Staff added successfully via API:", response.data);
       setIsAddModalOpen(false);
       fetchStaffAndTeachers(); // List ko refresh karein
     } catch (err: any) {
        console.error("Error saving staff:", err.response?.data || err.message);
        setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to add staff.');
     } finally {
        setIsLoading(false);
     }
  };

  // --- UPDATED: Staff delete karne ke liye API call ---
  const handleDeleteStaff = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      setError('');
      setIsLoading(true); // Indicate loading state
      console.log("Deleting user with ID:", userId);
      try {
        // User ko delete karne ke liye API call karein
        // Assuming backend route is /api/admin/users/:id
        await api.delete(`/admin/users/${userId}`);
        console.log("User deleted successfully via API.");
        fetchStaffAndTeachers(); // List ko refresh karein
      } catch (err: any) {
        console.error("Error deleting staff:", err.response?.data || err.message);
        setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to delete staff.');
        setIsLoading(false); // Stop loading on error
      }
      // setIsLoading(false); // Removed from here, handled in fetch or error
    }
  };

  // Naya function: Edit modal kholne ke liye (No API call here)
  const handleEditClick = (staffMember: StaffMember) => {
    setCurrentStaff(staffMember);
    setIsEditModalOpen(true);
  };

  // Naya function: Staff member ko update karne ke liye (Needs backend API)
  const handleUpdateStaff = async (updatedStaffData: StaffMember) => {
     setError('');
     setIsLoading(true);
     console.log("Updating staff:", updatedStaffData);
     // Map frontend role to backend role if needed
     // const backendRole = mapFrontendRoleToBackend(updatedStaffData.role);

     const payload = {
       name: updatedStaffData.name,
       // Include other fields you want to update (e.g., contact)
       // Role update might need separate handling or confirmation
     };

     try {
        // User ko update karne ke liye API call karein
        // Assuming backend route is /api/admin/users/:id
        await api.put(`/admin/users/${updatedStaffData._id}`, payload);
        console.log("Staff updated successfully via API.");
        setIsEditModalOpen(false);
        fetchStaffAndTeachers(); // Refresh list
     } catch (err: any) {
       console.error("Error updating staff:", err.response?.data || err.message);
       setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to update staff.');
     } finally {
       setIsLoading(false);
     }
  };

  // Frontend display role ko backend role se map karein filter ke liye
  const getBackendRoleFromDisplay = (displayRole: string): string | null => {
      if (displayRole === 'All') return null; // 'All' means no filter
      return mapFrontendRoleToBackend(displayRole);
  };

  // --- Filtering logic update ---
  const filteredStaff = staffList
    .filter(member => {
        const backendFilterRole = getBackendRoleFromDisplay(filterRole);
        // Agar 'All' select kiya hai ya member ka role filter se match karta hai
        return !backendFilterRole || member.role === backendFilterRole;
    })
    .filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Function to map backend role to frontend display role
  const getDisplayRole = (backendRole: string): string => {
       switch(backendRole) {
           case 'teacher': return 'Teacher';
           case 'staff': return 'Staff'; // Ya aap specific designation dikha sakte hain agar Staff model hai
           default: return backendRole.charAt(0).toUpperCase() + backendRole.slice(1); // Default title case
       }
  };

  return (
    <div className={styles.staffContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Staff Management</h1>
        <button className={styles.addButton} onClick={() => setIsAddModalOpen(true)} disabled={isLoading}>
          <MdAdd /> Add New Staff
        </button>
      </div>

      {/* Show Loading / Error Messages */}
      {isLoading && <p>Loading staff data...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <MdSearch />
          <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {/* Filter dropdown uses displayRoles */}
        <select className={styles.filterDropdown} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          {displayRoles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
      </div>

      {/* StaffTable ko _id pass karna hoga delete/edit ke liye */}
      <StaffTable staff={filteredStaff} onDelete={handleDeleteStaff} onEdit={handleEditClick} />

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Staff Member">
        {/* AddStaffForm ko email field ki zaroorat hogi */}
        <AddStaffForm onClose={() => setIsAddModalOpen(false)} onSave={handleSaveStaff} />
      </Modal>

      {/* Edit Staff Modal (Update onSave prop) */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Staff Member">
        {currentStaff && (
          // EditStaffForm ko User data (name, email etc.) handle karna hoga
          <EditStaffForm
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleUpdateStaff} // Pass the updated handler
            staffData={currentStaff} // Pass current user data
          />
        )}
      </Modal>
    </div>
  );
};
export default StaffPage;
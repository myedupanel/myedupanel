"use client";
import React, { useState, useEffect } from 'react';
import styles from './SchoolPage.module.scss';
import Sidebar from '@/components/layout/Sidebar/Sidebar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// --- BADLAV 1: Import 'api' helper ---
import api from '@/backend/utils/api'; // Ensure this path is correct
// --- END BADLAV 1 ---
import { useAuth } from '@/app/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import {
    MdPeople, MdSchool, MdFamilyRestroom, MdBadge,
    MdEventAvailable, MdAttachMoney, MdSchedule,
    MdAssessment, MdSettings, MdPersonAdd
} from 'react-icons/md';

import Modal from '@/components/common/Modal/Modal';
import AddStudentForm from '@/components/admin/AddStudentForm/AddStudentForm';
import AddTeacherForm from '@/components/admin/AddTeacherForm/AddTeacherForm';
import AddParentForm from '@/components/admin/AddParentForm/AddParentForm';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';

// Interface definitions (MenuItem, DashboardData) remain the same
interface MenuItem { /* ... */ }
const schoolMenuItems: MenuItem[] = [ /* ... */ ];
interface DashboardData { /* ... */ }

const DashboardControlCenter = () => {
    // --- BADLAV 2: Destructure 'token' ---
    const { token } = useAuth(); // We need the token for api calls if not automatically handled by 'api' helper
    // --- END BADLAV 2 ---
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(''); // Use a different name than 'error' from fetchData
    const [activeModal, setActiveModal] = useState<string | null>(null);

    const openModal = (modalName: string) => setActiveModal(modalName);
    const closeModal = () => {
        setActiveModal(null);
        setApiError(''); // Clear API error when modal closes
    };

    // --- BADLAV 3: Updated handleFormSubmit ---
    const handleFormSubmit = async (formData: any) => {
        setApiError(''); // Clear previous errors
        let apiEndpoint = '';
        let dataToSend = { ...formData }; // Copy form data
        let successMessage = 'Entry added successfully!';

        // Determine API endpoint and map role based on modal type
        switch (activeModal) {
            case 'add-student':
                apiEndpoint = '/students'; // Assuming POST /api/students exists
                // Student form might not send 'role', backend should handle it
                successMessage = 'Student added successfully!';
                break;
            case 'add-teacher':
                apiEndpoint = '/teachers'; // Assuming POST /api/teachers exists
                dataToSend.role = 'teacher'; // Ensure backend role is set
                successMessage = 'Teacher added successfully!';
                break;
            case 'add-parent':
                apiEndpoint = '/parents'; // Assuming POST /api/parents exists
                dataToSend.role = 'parent'; // Ensure backend role is set
                successMessage = 'Parent added successfully!';
                break;
            case 'add-staff':
                apiEndpoint = '/admin/create-user'; // Use the generic create-user route

                // --- Role Mapping Logic ---
                const frontendRole = formData.role; // e.g., "Security", "Teacher", "Accountant"
                if (frontendRole === 'Teacher') {
                    dataToSend.role = 'teacher'; // Map "Teacher" to "teacher"
                } else {
                    // Map all other roles from the dropdown to "staff"
                    dataToSend.role = 'staff';
                }
                // --- End Role Mapping ---

                // We might need email for the User model, assuming AddStaffForm collects it
                // If not, the backend /create-user needs to handle optional email
                // dataToSend.email = formData.email; // Make sure email is included if needed

                successMessage = 'Staff added successfully!';
                break;
            default:
                console.error("Unknown modal type:", activeModal);
                setApiError("Invalid form type.");
                return; // Don't proceed if modal type is unknown
        }

        console.log("Sending data to backend:", apiEndpoint, dataToSend);

        try {
            // Use the 'api' helper which should include the auth token automatically
            await api.post(apiEndpoint, dataToSend);
            console.log(successMessage);
            closeModal();
            // Optionally: Refresh dashboard data after successful submission
            // fetchData(); // Uncomment this if you rename the fetchData function
        } catch (err: any) {
            const message = err.response?.data?.msg || err.response?.data?.message || `Failed to add ${activeModal?.split('-')[1] || 'entry'}.`;
            console.error("API Error:", message, err.response?.data);
            setApiError(message); // Show error to the user within the modal/form if possible
            // Keep modal open on error
        }
    };
    // --- END BADLAV 3 ---


    const getModalTitle = () => {
        switch (activeModal) {
            case 'add-student': return 'Add New Student';
            case 'add-teacher': return 'Add New Teacher';
            case 'add-parent': return 'Add New Parent';
            case 'add-staff': return 'Add New Staff';
            default: return 'New Entry';
        }
    };

    // Renamed fetchData to avoid conflict with state variable 'data' if needed inside handleFormSubmit
    const fetchDashboardData = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await api.get<DashboardData>('/admin/dashboard-data'); // Use 'api' helper
            setData(response.data);
            setApiError(''); // Clear previous errors on successful fetch
        } catch (err) {
            setApiError('Could not load dashboard data.');
            console.error("API fetch error:", err);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchDashboardData(); // Call the renamed function
    }, [token]);

    // Loading and Error states remain the same
    if (loading) { /* ... */ }
    // Use apiError state for displaying fetch errors
    if (apiError && !loading) { return <div className={`${styles.message} ${styles.error}`}>{apiError}</div>; }


    return (
        <div className={styles.overviewContainer}>
            <h1 className={styles.mainTitle}>School Control Center</h1>

            {/* Main Grid content remains the same */}
            <div className={styles.mainGrid}>
                {/* ... chartBox ... */}
                {/* ... summaryBox for Students ... */}
                {/* ... summaryBox for Teachers ... */}
                {/* ... summaryBox for Fee Counter ... */}
                {/* ... summaryBox for Parents ... */}
                {/* ... summaryBox for Staff ... */}
            </div>

            {/* Modal rendering logic */}
            <Modal isOpen={!!activeModal} onClose={closeModal} title={getModalTitle()}>
                {/* Pass handleFormSubmit to the correct prop of each form */}
                {activeModal === 'add-student' && <AddStudentForm onClose={closeModal} onSuccess={fetchDashboardData} />} {/* Assuming AddStudentForm calls API internally or needs onSuccess */}
                {activeModal === 'add-teacher' && <AddTeacherForm onClose={closeModal} onSubmit={handleFormSubmit} />}
                {activeModal === 'add-parent' && <AddParentForm onClose={closeModal} onSubmit={handleFormSubmit} />}
                {/* Pass handleFormSubmit to onSave for AddStaffForm */}
                {activeModal === 'add-staff' && <AddStaffForm onClose={closeModal} onSave={handleFormSubmit} />}
                 {/* Display API error inside Modal if needed */}
                 {apiError && <p className={styles.modalError}>{apiError}</p>}
            </Modal>
        </div>
    );
};

// SchoolPage component remains the same
const SchoolPage = () => { /* ... */ };

export default SchoolPage;
"use client";
import React, { useState, useEffect } from 'react';
import styles from './SchoolPage.module.scss';
// FIX: Sidebar import ki zaroorat nahi hai. Layout khud manage karega.
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { 
    MdPeople, MdSchool, MdFamilyRestroom, MdBadge,
    MdEventAvailable, MdAttachMoney, MdSchedule,
    MdAssessment, MdSettings, MdPersonAdd 
} from 'react-icons/md';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// 1. Socket.IO client ko import karein
import { io } from "socket.io-client";
// FIX: Forms ke liye import add kiye (assuming they are used)
import Modal from '@/components/common/Modal/Modal';
import AddStudentForm from '@/components/admin/AddStudentForm/AddStudentForm';
import AddTeacherForm from '@/components/admin/AddTeacherForm/AddTeacherForm';
import AddParentForm from '@/components/admin/AddParentForm/AddParentForm';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';


// --- FIX: Unnecessary interfaces and arrays removed as logic moved to Sidebar.tsx ---
// interface NavItem { ... } <-- REMOVED
// const schoolMenuItems: NavItem[] = [...] <-- REMOVED

// Required Interfaces (Data fetching ke liye)
interface Student { id: string; name: string; details?: { class: string; }; }
interface Teacher { id: string; name: string; details?: { subject: string; }; }
interface DashboardStats { totalStudents: number; totalTeachers: number; totalParents: number; totalStaff: number; }
interface DashboardData {
    stats: DashboardStats;
    recentStudents: Student[];
    recentTeachers: Teacher[];
    // FIX: Add missing properties for chart/fees/staff/parents data
    admissionsData?: any[]; 
    recentFees?: any[];
    recentParents?: any[];
    recentStaff?: any[];
}


// Main Dashboard Component
const DashboardControlCenter = () => {
    const { token } = useAuth(); 
    
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(''); 
    const [activeModal, setActiveModal] = useState<string | null>(null);

    const openModal = (modalName: string) => setActiveModal(modalName);
    const closeModal = () => setActiveModal(null);
    
    // NOTE: Modal handlers added back for full functionality
    const handleStudentSuccess = async () => { 
      try {
        // Refresh dashboard data after successful student addition
        fetchData();
        closeModal();
      } catch (error) {
        console.error("Error refreshing data after student addition:", error);
        alert("Student added successfully, but there was an issue refreshing the dashboard.");
      }
    }
    const handleTeacherSuccess = async (teacherData: any) => { 
      try {
        const response = await axios.post('/api/teachers', teacherData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Teacher added successfully", response.data);
        closeModal();
        // Refresh dashboard data
        fetchData();
        return Promise.resolve();
      } catch (error) {
        console.error("Error adding teacher:", error);
        alert("Failed to add teacher. Please try again.");
        return Promise.reject(error);
      }
    }
    const handleParentSuccess = async (parentData: any) => { 
      try {
        const response = await axios.post('/api/parents', parentData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Parent added successfully", response.data);
        closeModal();
        // Refresh dashboard data
        fetchData();
        return Promise.resolve();
      } catch (error) {
        console.error("Error adding parent:", error);
        alert("Failed to add parent. Please try again.");
        return Promise.reject(error);
      }
    }
    const handleStaffSuccess = async (staffData: any) => { 
      try {
        const response = await axios.post('/api/staff', staffData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Staff added successfully", response.data);
        closeModal();
        // Refresh dashboard data
        fetchData();
        return Promise.resolve();
      } catch (error) {
        console.error("Error adding staff:", error);
        alert("Failed to add staff. Please try again.");
        return Promise.reject(error);
      }
    }

    const getModalTitle = () => {
        switch (activeModal) {
            case 'add-student': return 'Add New Student';
            case 'add-teacher': return 'Add New Teacher';
            case 'add-parent': return 'Add New Parent';
            case 'add-staff': return 'Add New Staff';
            default: return 'New Entry';
        }
    };


    const fetchData = async () => {
        if (!token) return; 
        if (!data) setLoading(true); 

        try {
            // NOTE: URL is '/api/admin/dashboard-data' as fixed in layout.tsx context
            const response = await axios.get('/api/admin/dashboard-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data);
            setError('');
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            setError('Could not load dashboard data.');
        } finally {
            if (!data) setLoading(false);
        }
    };

    useEffect(() => {
        if (token) { fetchData(); }
    }, [token]); 

    // REAL-TIME UPDATES KE LIYE useEffect
    useEffect(() => {
        const socket = io("https://myedupanel.onrender.com");
        socket.on('updateDashboard', () => { fetchData(); });
        return () => { socket.disconnect(); };
    }, [token]); 

    if (loading) { return <div className={styles.loading}>Loading Dashboard...</div>; }
    if (error) { return <div className={styles.error}>{error}</div>; }
    
    const getStudentClass = (student: Student | any) => student.details?.class || 'N/A';
    const getTeacherSubject = (teacher: Teacher | any) => teacher.details?.subject || 'N/A';

    return (
        <div className={styles.overviewContainer}>
            <h1 className={styles.mainTitle}>School Control Center</h1>
            
            <div className={styles.mainGrid}>
                {/* Students Box (Now with real data) */}
                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}>
                        <h2><MdPeople/> Students ({data?.stats?.totalStudents})</h2>
                        <Link href="/admin/students" className={styles.viewAllLink}>View All</Link>
                    </div>
                    <ul className={styles.recentList}>
                        <li className={styles.listHeader}>Recent Admissions</li>
                        {data?.recentStudents?.map(student => (
                            <li key={student.id}><span>{student.name} ({getStudentClass(student)})</span></li>
                        ))}
                    </ul>
                    <div className={styles.boxFooter}><button onClick={() => openModal('add-student')} className={styles.addButton}><MdPersonAdd /> Add Student</button></div>
                </div>

                {/* Teachers Box (Now with real data) */}
                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}>
                        <h2><MdSchool/> Teachers ({data?.stats?.totalTeachers})</h2>
                        <Link href="/admin/teachers" className={styles.viewAllLink}>View All</Link>
                    </div>
                    <ul className={styles.recentList}>
                        <li className={styles.listHeader}>Recently Joined</li>
                         {data?.recentTeachers?.map(teacher => (
                            <li key={teacher.id}><span>{teacher.name}</span><span className={styles.subject}>{getTeacherSubject(teacher)}</span></li>
                        ))}
                    </ul>
                    <div className={styles.boxFooter}><button onClick={() => openModal('add-teacher')} className={styles.addButton}><MdPersonAdd /> Add Teacher</button></div>
                </div>

                {/* Other boxes */}
                 <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdFamilyRestroom/> Parents ({data?.stats?.totalParents})</h2></div>
                     {/* Add actual Parent list here if available in DashboardData */}
                    <div className={styles.boxContent}><p>Parent data will be shown here.</p></div>
                     <div className={styles.boxFooter}><button onClick={() => openModal('add-parent')} className={styles.addButton}><MdPersonAdd /> Add Parent</button></div>
                </div>
                 <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdBadge/> Staff ({data?.stats?.totalStaff})</h2></div>
                     {/* Add actual Staff list here if available in DashboardData */}
                    <div className={styles.boxContent}><p>Staff data will be shown here.</p></div>
                     <div className={styles.boxFooter}><button onClick={() => openModal('add-staff')} className={styles.addButton}><MdPersonAdd /> Add Staff</button></div>
                </div>

            </div>
            {/* Modal definition (FIXED with children prop) */}
            <Modal isOpen={!!activeModal} onClose={closeModal} title={getModalTitle()}>
                <>
                    {activeModal === 'add-student' && <AddStudentForm onClose={closeModal} onSuccess={handleStudentSuccess} />}
                    {activeModal === 'add-teacher' && <AddTeacherForm onClose={closeModal} onSubmit={handleTeacherSuccess} />}
                    {activeModal === 'add-parent' && <AddParentForm onClose={closeModal} onSubmit={handleParentSuccess} />}
                    {activeModal === 'add-staff' && <AddStaffForm onClose={closeModal} onSave={handleStaffSuccess} />}
                </>
            </Modal>
        </div>
    );
};

// Main Page Component
const SchoolPage = () => {
    // === PERMANENT ILAJ: NO SIDEBAR OR LAYOUT WRAPPERS HERE ===
    return <DashboardControlCenter />;
};

export default SchoolPage;
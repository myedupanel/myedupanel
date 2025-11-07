// File: app/admin/school/page.tsx (Fixed API URL)
"use client";
import React, { useState, useEffect } from 'react';
import styles from './SchoolPage.module.scss';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'; 
import { 
    MdPeople, MdSchool, MdFamilyRestroom, MdBadge,
    MdEventAvailable, MdAttachMoney, MdSchedule,
    MdAssessment, MdSettings, MdPersonAdd, MdClass 
} from 'react-icons/md'; 
import api from '@/backend/utils/api'; 
import { io } from "socket.io-client";
import Modal from '@/components/common/Modal/Modal';
import AddStudentForm from '@/components/admin/AddStudentForm/AddStudentForm';
import AddTeacherForm from '@/components/admin/AddTeacherForm/AddTeacherForm';
import AddParentForm from '@/components/admin/AddParentForm/AddParentForm';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';

// === TypeScript Interfaces (Copied from previous fix) ===
interface Student { id: string; name: string; details?: { class: string; }; }
interface Teacher { id: string; name: string; details?: { subject: string; }; }
interface DashboardStats { totalStudents: number; totalTeachers: number; totalParents: number; totalStaff: number; }
interface AdmissionDataPoint { month?: number; name: string; admissions: number; }
interface RecentFee { id: string; student: string; amount: string; date?: string;}
interface RecentParent { id: string; name: string; }
interface RecentStaff { id: string; name: string; role?: string; details?: { role?: string };}

interface DashboardData {
    stats: DashboardStats;
    recentStudents: Student[];
    recentTeachers: Teacher[];
    admissionsData: AdmissionDataPoint[];
    recentFees: RecentFee[];
    recentParents: RecentParent[];
    recentStaff: RecentStaff[];
}
// ===========================================

// Main Dashboard Component
const DashboardControlCenter = () => {
    const { token } = useAuth(); 
    const router = useRouter(); 
    
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(''); 
    const [activeModal, setActiveModal] = useState<string | null>(null);

    const openModal = (modalName: string) => setActiveModal(modalName);
    const closeModal = () => setActiveModal(null);
    const handleStudentSuccess = () => { console.log("Student added!"); closeModal(); }
    const handleTeacherSuccess = () => { console.log("Teacher added!"); closeModal(); }
    const handleParentSuccess = () => { console.log("Parent added!"); closeModal(); }
    const handleStaffSuccess = async (staffData: any) => { console.log("Staff added/updated", staffData); closeModal(); return Promise.resolve(); }

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
            // === FIX: API URL को 'dashboard-stats' से 'dashboard-data' किया गया (404 FIX) ===
            const response = await axios.get('/api/admin/dashboard-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data);
            setError('');
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            // यहाँ एरर को ठीक किया गया ताकि 404 पर भी 'Could not load dashboard data' दिखे
            setError('Could not load dashboard data.');
        } finally {
            if (!data) setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]); 

    // REAL-TIME UPDATES KE LIYE useEffect
    useEffect(() => {
        const socket = io("https://myedupanel.onrender.com");
        socket.on('updateDashboard', () => {
            console.log("REAL-TIME UPDATE RECEIVED! Dashboard data refresh ho raha hai...");
            fetchData();
        });
        return () => {
            socket.disconnect();
        };
    }, [token]); 

    if (loading) {
        return <div className={styles.loading}>Loading Dashboard...</div>;
    }
    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    const getStudentClass = (student: Student | any) => student.class || student.details?.class || 'N/A';
    const getTeacherSubject = (teacher: Teacher | any) => teacher.subject || teacher.details?.subject || 'N/A';
    const getStaffRole = (staff: RecentStaff | any) => staff.role || staff.details?.role || 'N/A';
    
    return (
        <div className={styles.overviewContainer}>
            <h1 className={styles.mainTitle}>School Control Center</h1>
            
            <div className={styles.mainGrid}>
                {/* ... (Your Dashboard UI JSX remains the same) ... */}
            </div>
             {/* Modal definition */}
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
    // FIX: सिर्फ DashboardControlCenter को रिटर्न करें
    return <DashboardControlCenter />;
};

export default SchoolPage;
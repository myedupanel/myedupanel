"use client";
// --- Import React explicitly for Fragment ---
import React, { useState, useEffect } from 'react';
// --- END ---
import styles from './SchoolPage.module.scss';
import Sidebar from '@/components/layout/Sidebar/Sidebar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth, User } from '@/app/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    MdPeople, MdSchool, MdFamilyRestroom, MdBadge,
    MdEventAvailable, MdAttachMoney, MdSchedule,
    MdAssessment, MdSettings, MdPersonAdd,
    MdClass // <-- 1. YEH NAYA ICON IMPORT KIYA HAI
} from 'react-icons/md';

import Modal from '@/components/common/Modal/Modal';
import AddStudentForm from '@/components/admin/AddStudentForm/AddStudentForm';
import AddTeacherForm from '@/components/admin/AddTeacherForm/AddTeacherForm';
import AddParentForm from '@/components/admin/AddParentForm/AddParentForm';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';
import api from '@/backend/utils/api';


interface MenuItem {
    id: string;
    title: string;
    path: string; // FIX: Path is required
    icon: React.ReactNode;
    color: string;
}

const schoolMenuItems: MenuItem[] = [
    { id: 'students', title: 'Students', path: '/admin/students', icon: <MdPeople />, color: '#3b82f6' },
    { id: 'teachers', title: 'Teachers', path: '/admin/teachers', icon: <MdSchool />, color: '#8b5cf6' },
    // FIX: Missing path added
    { id: 'parents', title: 'Parents', path: '/admin/parents', icon: <MdFamilyRestroom />, color: '#ef4444' },
    // FIX: Missing path added
    { id: 'staff', title: 'Staff', path: '/admin/staff', icon: <MdBadge />, color: '#f97316' },
    // --- 2. YEH NAYA LINK "STAFF" KE NEECHE ADD KIYA HAI ---
    { 
      id: 'manage-classes',
      title: 'Manage Classes', 
      path: '/admin/school/classes', // Path to your classes page
      icon: <MdClass />, 
      color: '#64748b' // Using Timetable Settings color
    },
    // --- END NAYA LINK ---
    { id: 'attendance', title: 'Attendance', path: '/admin/attendance/student', icon: <MdEventAvailable />, color: '#10b981' },
    { id: 'fee-counter', title: 'Fee Counter', path: '/admin/fee-counter', icon: <MdAttachMoney />, color: '#14b8a6' },
    { id: 'timetable', title: 'Timetable', path: '/admin/timetable', icon: <MdSchedule />, color: '#6366f1' },
    { id: 'Timetable settings', title: 'Timetable Settings', path: '/admin/settings', icon: <MdSettings />, color: '#64748b' },
    { id: 'academics', title: 'Academics', path: '/admin/academics', icon: <MdAssessment />, color: '#0ea5e9' },
];

interface DashboardData {
    admissionsData: { month?: number; name: string; admissions: number }[];
    recentStudents: { id: string; name: string; class?: string; details?: { class?: string } }[];
    recentTeachers: { id: string; name: string; subject?: string; details?: { subject?: string } }[];
    recentFees: { id: string; student: string; amount: string; date?: string }[];
    recentParents: { id: string; name: string }[];
    recentStaff: { id: string; name: string; role?: string; details?: { role?: string } }[];
}

// FIX: Empty Dashboard Data Fallback
const EMPTY_DASHBOARD_DATA: DashboardData = {
    admissionsData: [],
    recentStudents: [],
    recentTeachers: [],
    recentParents: [],
    recentFees: [],
    recentStaff: []
};

const DashboardControlCenter = () => {
    const { token } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeModal, setActiveModal] = useState<string | null>(null);

    const openModal = (modalName: string) => setActiveModal(modalName);
    const closeModal = () => setActiveModal(null);

    const handleFormSubmit = async () => {
        return new Promise<void>((resolve) => {
             console.log("Form submitted!");
             closeModal();
             resolve();
        });
    };

    const handleStudentSuccess = () => {
        console.log("Student added!");
        closeModal();
    }
     const handleTeacherSuccess = () => {
        console.log("Teacher added!");
        closeModal();
    }
      const handleParentSuccess = () => {
        console.log("Parent added!");
        closeModal();
    }
     const handleStaffSuccess = async (staffData: any) => {
        console.log("Staff potentially added/updated via API call inside AddStaffForm", staffData);
        closeModal();
        return Promise.resolve();
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

    // 💡 FIX: fetchData logic updated for 2-second timeout
    useEffect(() => {
        const fetchRemoteData = async () => {
            if (!token) {
                throw new Error('Authentication token not found.');
            }
            const response = await api.get<DashboardData>('/admin/dashboard-data');
            return response.data;
        };

        const timeoutPromise = new Promise<DashboardData>((_, reject) => 
            setTimeout(() => reject(new Error('Control Center Load Timeout')), 2000) // 2 seconds timeout
        );

        const loadData = async () => {
            setLoading(true);
            setError('');
            
            try {
                // Race the actual API call against the 2-second timeout
                const data = await Promise.race([fetchRemoteData(), timeoutPromise]);
                setData(data);

            } catch (err: any) {
                // If timeout or error occurs, log it and set empty data
                console.error("Control Center Load Failed or Timed Out:", err.message || err);
                setError(err.message === 'Control Center Load Timeout' ? 'Dashboard timed out. Backend is slow/down.' : 'Could not load dashboard data.');
                setData(EMPTY_DASHBOARD_DATA); // Show empty UI instead of loading spinner

            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [token]);
    // END FIX

    // --- Loading/Error Handling ---
    if (loading) { return <div className={styles.message}>Loading Control Center...</div>; }
    
    // Show user-friendly error state on timeout/hard error
    if (error && data?.admissionsData.length === 0) { 
        return (
            <div className={`${styles.message} ${styles.error}`}>
                <h2>Connection Error</h2>
                <p>{error}</p>
                <p>Please check your backend connection. Displaying minimal data structure.</p>
            </div>
        ); 
    }
    
    if (!data) { return <div className={styles.message}>No dashboard data available.</div>; }


    const getStudentClass = (student: any) => student.class || student.details?.class || 'N/A';
    const getTeacherSubject = (teacher: any) => teacher.subject || teacher.details?.subject || 'N/A';
    const getStaffRole = (staff: any) => staff.role || staff.details?.role || 'N/A';


    return (
        <div className={styles.overviewContainer}>
            <h1 className={styles.mainTitle}>School Control Center</h1>

            <div className={styles.mainGrid}>
                {/* Chart Box */}
                <div className={`${styles.summaryBox} ${styles.chartBox}`}>
                     <div className={styles.boxHeader}><h2><MdAssessment/> Student Admissions</h2></div>
                     <div className={styles.chartContainer}>
                        {data.admissionsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={data.admissionsData || []} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={10} interval={0} />
                                    <YAxis fontSize={10} allowDecimals={false}/>
                                    <Tooltip wrapperStyle={{ fontSize: '12px' }}/>
                                    <Bar dataKey="admissions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className={styles.noDataChart}>No admission data available.</div>
                        )}
                     </div>
                </div>

                {/* Students Box */}
                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdPeople/> Students</h2><Link href="/admin/students" className={styles.viewAllLink}>View All</Link></div>
                     <ul className={styles.recentList}>
                        {(data.recentStudents || []).map(s => <li key={s.id}><span>{s.name} ({getStudentClass(s)})</span></li>)}
                        {(data.recentStudents || []).length === 0 && <li className={styles.noRecent}>No recent students</li>}
                     </ul>
                    <div className={styles.boxFooter}><button onClick={() => openModal('add-student')} className={styles.addButton}><MdPersonAdd /> Add Student</button></div>
                </div>

                {/* Teachers Box */}
                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdSchool/> Teachers</h2><Link href="/admin/teachers" className={styles.viewAllLink}>View All</Link></div>
                    <ul className={styles.recentList}>
                       {(data.recentTeachers || []).map(t => <li key={t.id}><span>{t.name}</span><span className={styles.subject}>{getTeacherSubject(t)}</span></li>)}
                       {(data.recentTeachers || []).length === 0 && <li className={styles.noRecent}>No recent teachers</li>}
                    </ul>
                    <div className={styles.boxFooter}><button onClick={() => openModal('add-teacher')} className={styles.addButton}><MdPersonAdd /> Add Teacher</button></div>
                </div>

                {/* Fee Counter Box */}
                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdAttachMoney/> Fee Counter</h2><Link href="/admin/fee-counter" className={styles.viewAllLink}>View All</Link></div>
                     <ul className={styles.recentList}>
                         {(data.recentFees || []).map(f => <li key={f.id}><span>{f.student}</span><span>{f.amount}</span></li>)}
                         {(data.recentFees || []).length === 0 && <li className={styles.noRecent}>No recent payments</li>}
                     </ul>
                     <div className={styles.boxFooter}><Link href="/admin/fee-counter/collection" className={styles.addButton}>Collect Fees</Link></div>
                </div>

                {/* Parents Box */}
                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdFamilyRestroom/> Parents</h2><Link href="/admin/parents" className={styles.viewAllLink}>View All</Link></div>
                     <ul className={styles.recentList}>
                        {(data.recentParents || []).map(p => <li key={p.id}><span>{p.name}</span></li>)}
                        {(data.recentParents || []).length === 0 && <li className={styles.noRecent}>No recent parents</li>}
                     </ul>
                    <div className={styles.boxFooter}><button onClick={() => openModal('add-parent')} className={styles.addButton}><MdPersonAdd /> Add Parent</button></div>
                </div>

                {/* Staff Box */}
                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdBadge/> Staff</h2><Link href="/admin/staff" className={styles.viewAllLink}>View All</Link></div>
                     <ul className={styles.recentList}>
                        {(data.recentStaff || []).map(s => <li key={s.id}><span>{s.name}</span><span className={styles.subject}>{getStaffRole(s)}</span></li>)}
                        {(data.recentStaff || []).length === 0 && <li className={styles.noRecent}>No recent staff</li>}
                     </ul>
                     <div className={styles.boxFooter}><button onClick={() => openModal('add-staff')} className={styles.addButton}><MdPersonAdd /> Add Staff</button></div>
                </div>

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
    return (
        <div className={styles.schoolPageContainer}>
            {/* Sidebar ab updated 'schoolMenuItems' list use karega */}
            <Sidebar menuItems={schoolMenuItems} />
            <main className={styles.mainContent}>
                <DashboardControlCenter />
            </main>
        </div>
    );
};

export default SchoolPage;
"use client";
import React, { useState, useEffect } from 'react';
import styles from './SchoolPage.module.scss';
// FIX: Sidebar import ko yahaan se hata diya gaya hai, yeh ab layout.tsx se aayega
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth, User } from '@/app/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    MdPeople, MdSchool, MdFamilyRestroom, MdBadge,
    MdEventAvailable, MdAttachMoney, MdSchedule,
    MdAssessment, MdSettings, MdPersonAdd,
    MdClass 
} from 'react-icons/md'; 
import Modal from '@/components/common/Modal/Modal';
import AddStudentForm from '@/components/admin/AddStudentForm/AddStudentForm';
import AddTeacherForm from '@/components/admin/AddTeacherForm/AddTeacherForm';
import AddParentForm from '@/components/admin/AddParentForm/AddParentForm';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';
import api from '@/backend/utils/api';


// === FIX 1: Missing TypeScript Interfaces ===

interface RecentStudent {
    id: string; 
    name: string; 
    class?: string; 
    details?: { class?: string };
}
interface RecentTeacher {
    id: string; 
    name: string; 
    subject?: string; 
    details?: { subject?: string };
}
interface RecentStaff {
    id: string; 
    name: string; 
    role?: string; 
    details?: { role?: string };
}
interface RecentFee {
    id: string; 
    student: string; 
    amount: string; 
    date?: string;
}
interface RecentParent {
    id: string;
    name: string;
}
interface AdmissionDataPoint {
    month?: number; 
    name: string; 
    admissions: number;
}
interface DashboardData {
    admissionsData: AdmissionDataPoint[];
    recentStudents: RecentStudent[];
    recentTeachers: RecentTeacher[];
    recentFees: RecentFee[];
    recentParents: RecentParent[];
    recentStaff: RecentStaff[];
    // Agar backend se stats aa rahe hain toh unhe bhi yahaan define karein
    stats?: {
        totalStudents: number;
        totalTeachers: number;
        totalParents: number;
        totalStaff: number;
    }
}
// ===========================================

// --- schoolMenuItems array (No longer used by SchoolPage but kept for reference) ---
const schoolMenuItems = [
    // ... items ...
] as const;


const DashboardControlCenter = () => {
    const { token } = useAuth();
    const router = useRouter();
    // FIX: State ko DashboardData type diya
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

    const handleStudentSuccess = () => { console.log("Student added!"); closeModal(); }
    const handleTeacherSuccess = () => { console.log("Teacher added!"); closeModal(); }
    const handleParentSuccess = () => { console.log("Parent added!"); closeModal(); }
    const handleStaffSuccess = async (staffData: any) => { console.log("Staff potentially added/updated via API call inside AddStaffForm", staffData); closeModal(); return Promise.resolve(); }


    const getModalTitle = () => {
        switch (activeModal) {
            case 'add-student': return 'Add New Student';
            case 'add-teacher': return 'Add New Teacher';
            case 'add-parent': return 'Add New Parent';
            case 'add-staff': return 'Add New Staff';
            default: return 'New Entry';
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                setLoading(false);
                setError('Authentication token not found.');
                return;
            }
            try {
                setLoading(true);
                setError('');
                const response = await api.get<DashboardData>('/admin/dashboard-data');
                setData(response.data);
            } catch (err: any) {
                setError('Could not load dashboard data.');
                console.error("API fetch error:", err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    if (loading) { return <div className={styles.message}>Loading Control Center...</div>; }
    if (error) { return <div className={`${styles.message} ${styles.error}`}>{error}</div>; }
    if (!data) { return <div className={styles.message}>No dashboard data available.</div>; }

    // === FIX 2: Implicit 'any' errors ke liye typing add ki ===
    const getStudentClass = (student: RecentStudent) => student.class || student.details?.class || 'N/A';
    const getTeacherSubject = (teacher: RecentTeacher) => teacher.subject || teacher.details?.subject || 'N/A';
    const getStaffRole = (staff: RecentStaff) => staff.role || staff.details?.role || 'N/A';
    // =========================================================

    return (
        <div className={styles.overviewContainer}>
            {/* ... (Aapka poora Dashboard UI yahaan) ... */}
            <h1 className={styles.mainTitle}>School Control Center</h1>
            {/* ... (Chart, Boxes, Modals, etc. ka code) ... */}
            <div className={styles.mainGrid}>
                {/* Chart Box */}
                <div className={`${styles.summaryBox} ${styles.chartBox}`}>
                     <div className={styles.boxHeader}><h2><MdAssessment/> Student Admissions</h2></div>
                     <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data.admissionsData || []} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} interval={0} />
                                <YAxis fontSize={10} allowDecimals={false}/>
                                <Tooltip wrapperStyle={{ fontSize: '12px' }}/>
                                <Bar dataKey="admissions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
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
            {/* Sidebar yahaan nahi aayega, woh ab layout.tsx mein hai */}
            <main className={styles.mainContent}>
                <DashboardControlCenter />
            </main>
        </div>
    );
return <DashboardControlCenter />;
};
export default SchoolPage;
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


// === TypeScript Interfaces (No Change) ===
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
            // === FIX 1: API Endpoint बदला गया ===
            const response = await axios.get('/api/admin/dashboard-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // ===================================
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
                {/* Chart Box */}
                <div className={`${styles.summaryBox} ${styles.chartBox}`}>
                     <div className={styles.boxHeader}><h2><MdAssessment/> Student Admissions</h2></div>
                     <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data?.admissionsData || []} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} interval={0} />
                                <YAxis fontSize={10} allowDecimals={false}/>
                                <Tooltip wrapperStyle={{ fontSize: '12px' }}/>
                                <Bar dataKey="admissions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                </div>

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

                {/* Fee Counter Box */}
                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdAttachMoney/> Fee Counter</h2><Link href="/admin/fee-counter" className={styles.viewAllLink}>View All</Link></div>
                     <ul className={styles.recentList}>
                         {data?.recentFees?.map(f => <li key={f.id}><span>{f.student}</span><span>{f.amount}</span></li>)}
                         {(data?.recentFees || []).length === 0 && <li className={styles.noRecent}>No recent payments</li>}
                     </ul>
                     <div className={styles.boxFooter}><Link href="/admin/fee-counter/collection" className={styles.addButton}>Collect Fees</Link></div>
                </div>

                {/* Parents Box */}
                 <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdFamilyRestroom/> Parents ({data?.stats?.totalParents})</h2><Link href="/admin/parents" className={styles.viewAllLink}>View All</Link></div>
                    <ul className={styles.recentList}>
                        {(data?.recentParents || []).map(p => <li key={p.id}><span>{p.name}</span></li>)}
                        {(data?.recentParents || []).length === 0 && <li className={styles.noRecent}>No recent parents</li>}
                    </ul>
                    <div className={styles.boxFooter}><button onClick={() => openModal('add-parent')} className={styles.addButton}><MdPersonAdd /> Add Parent</button></div>
                </div>
                
                 {/* Staff Box */}
                 <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdBadge/> Staff ({data?.stats?.totalStaff})</h2><Link href="/admin/staff" className={styles.viewAllLink}>View All</Link></div>
                    <ul className={styles.recentList}>
                        {(data?.recentStaff || []).map(s => <li key={s.id}><span>{s.name}</span><span className={styles.subject}>{getStaffRole(s)}</span></li>)}
                        {(data?.recentStaff || []).length === 0 && <li className={styles.noRecent}>No recent staff</li>}
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
    // === FIX 2: Layout tags (Sidebar, mainContent) hata diye gaye ===
    return <DashboardControlCenter />;
};

export default SchoolPage;
"use client";
import React, { useState, useEffect } from 'react';
import styles from './SchoolPage.module.scss';
import Sidebar from '@/components/layout/Sidebar/Sidebar'; 
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Import all necessary icons
import { 
    MdPeople, MdSchool, MdFamilyRestroom, MdBadge,
    MdEventAvailable, MdAttachMoney, MdSchedule, 
    MdAssessment, MdSettings, MdPersonAdd 
} from 'react-icons/md';

// Import your Modal and all Form components
// Double-check that these paths are correct for your project
import Modal from '@/components/common/Modal/Modal';
import AddStudentForm from '@/components/admin/AddStudentForm/AddStudentForm';
import AddTeacherForm from '@/components/admin/AddTeacherForm/AddTeacherForm';
import AddParentForm from '@/components/admin/AddParentForm/AddParentForm';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';

// Your colored menu items array
const schoolMenuItems = [
    { id: 'students', title: 'Students', path: '/admin/students', icon: <MdPeople />, color: '#3b82f6' },
    { id: 'teachers', title: 'Teachers', path: '/admin/teachers', icon: <MdSchool />, color: '#8b5cf6' },
    { id: 'parents', title: 'Parents', path: '/admin/parents', icon: <MdFamilyRestroom />, color: '#ef4444' },
    { id: 'staff', title: 'Staff', path: '/admin/staff', icon: <MdBadge />, color: '#f97316' },
    { id: 'attendance', title: 'Attendance', path: '/admin/attendance/student', icon: <MdEventAvailable />, color: '#10b981' },
    { id: 'fee-counter', title: 'Fee Counter', path: '/admin/fee-counter', icon: <MdAttachMoney />, color: '#14b8a6' },
    { id: 'timetable', title: 'Timetable', path: '/admin/timetable', icon: <MdSchedule />, color: '#6366f1' },
    { id: 'Timetable settings', title: 'Timetable Settings', path: '/admin/settings', icon: <MdSettings />, color: '#64748b' },
    { id: 'academics', title: 'Academics', path: '/admin/academics', icon: <MdAssessment />, color: '#0ea5e9' },
];

// Main Dashboard Component
const DashboardControlCenter = () => {
    const { token } = useAuth();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State and functions to control the modal
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const openModal = (modalName: string) => setActiveModal(modalName);
    const closeModal = () => setActiveModal(null);

    // Helper function to get the correct title for the modal
    const getModalTitle = () => {
        switch (activeModal) {
            case 'add-student': return 'Add New Student';
            case 'add-teacher': return 'Add New Teacher';
            case 'add-parent': return 'Add New Parent';
            case 'add-staff': return 'Add New Staff';
            default: return 'New Entry';
        }
    };

    // === FIX: Restored the data fetching logic inside useEffect ===
    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5000/api/admin/dashboard-data', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
            } catch (err) {
                setError('Could not load dashboard data.');
                console.error("API fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    if (loading) { return <div className={styles.message}>Loading...</div>; }
    if (error) { return <div className={`${styles.message} ${styles.error}`}>{error}</div>; }

    return (
        <div className={styles.overviewContainer}>
            <h1 className={styles.mainTitle}>School Control Center</h1>
            
            <div className={styles.mainGrid}>
                {/* Chart - This will now reappear with real data */}
                <div className={`${styles.summaryBox} ${styles.chartBox}`}>
                     <div className={styles.boxHeader}><h2><MdAssessment/> Student Admissions</h2></div>
                     <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.admissionsData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                                <Bar dataKey="admissions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                </div>

                {/* All other summary boxes remain the same, now powered by real data */}
                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdPeople/> Students</h2><Link href="/admin/students" className={styles.viewAllLink}>View All</Link></div>
                     <ul className={styles.recentList}>{data?.recentStudents?.map(s => <li key={s._id}><span>{s.name} ({s.details?.class || 'N/A'})</span></li>)}</ul>
                    <div className={styles.boxFooter}><button onClick={() => openModal('add-student')} className={styles.addButton}><MdPersonAdd /> Add Student</button></div>
                </div>

                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdSchool/> Teachers</h2><Link href="/admin/teachers" className={styles.viewAllLink}>View All</Link></div>
                    <ul className={styles.recentList}>{data?.recentTeachers?.map(t => <li key={t._id}><span>{t.name}</span><span className={styles.subject}>{t.details?.subject || 'N/A'}</span></li>)}</ul>
                    <div className={styles.boxFooter}><button onClick={() => openModal('add-teacher')} className={styles.addButton}><MdPersonAdd /> Add Teacher</button></div>
                </div>

                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdAttachMoney/> Fee Counter</h2><Link href="/admin/fee-counter" className={styles.viewAllLink}>View All</Link></div>
                     <ul className={styles.recentList}>{data?.recentFees?.map(f => <li key={f._id}><span>{f.student}</span><span>{f.amount}</span></li>)}</ul>
                     <div className={styles.boxFooter}><button className={styles.addButton}>Collect Fees</button></div>
                </div>

                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdFamilyRestroom/> Parents</h2><Link href="/admin/parents" className={styles.viewAllLink}>View All</Link></div>
                     <ul className={styles.recentList}>{data?.recentParents?.map(p => <li key={p._id}><span>{p.name}</span></li>)}</ul>
                    <div className={styles.boxFooter}><button onClick={() => openModal('add-parent')} className={styles.addButton}><MdPersonAdd /> Add Parent</button></div>
                </div>

                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdBadge/> Staff</h2><Link href="/admin/staff" className={styles.viewAllLink}>View All</Link></div>
                     <ul className={styles.recentList}>{data?.recentStaff?.map(s => <li key={s._id}><span>{s.name}</span><span className={styles.subject}>{s.details?.role || 'N/A'}</span></li>)}</ul>
                     <div className={styles.boxFooter}><button onClick={() => openModal('add-staff')} className={styles.addButton}><MdPersonAdd /> Add Staff</button></div>
                </div>
                
                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdSchedule/> Timetable</h2><Link href="/admin/timetable" className={styles.viewAllLink}>View All</Link></div>
                     <div className={styles.boxContent}><p className={styles.smallText}>Next Period (10 A): <strong>Physics</strong></p></div>
                     <div className={styles.boxFooter}><button onClick={() => router.push('/admin/timetable')} className={styles.addButton}>Manage Timetable</button></div>
                </div>

                 <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdAssessment/> Academics</h2><Link href="/admin/academics" className={styles.viewAllLink}>View All</Link></div>
                    <div className={styles.boxContent}><p className={styles.smallText}>Upcoming: <strong>Mid-Term Exams</strong></p></div>
                     <div className={styles.boxFooter}><button onClick={() => router.push('/admin/academics')} className={styles.addButton}>Manage Exams</button></div>
                </div>
            </div>

            <Modal isOpen={!!activeModal} onClose={closeModal} title={getModalTitle()}>
                {activeModal === 'add-student' && <AddStudentForm onClose={closeModal} />}
                {activeModal === 'add-teacher' && <AddTeacherForm onClose={closeModal} />}
                {activeModal === 'add-parent' && <AddParentForm onClose={closeModal} />}
                {activeModal === 'add-staff' && <AddStaffForm onClose={closeModal} />}
            </Modal>
        </div>
    );
};

// Main Page Component (no changes)
const SchoolPage = () => {
    return (
        <div className={styles.schoolPageContainer}>
            <Sidebar menuItems={schoolMenuItems} />
            <main className={styles.mainContent}>
                <DashboardControlCenter />
            </main>
        </div>
    );
};

export default SchoolPage;
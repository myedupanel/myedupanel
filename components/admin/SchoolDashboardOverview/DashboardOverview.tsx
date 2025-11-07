"use client";
import React, { useState, useEffect } from 'react'; // <--- Make sure React is imported!
import styles from './SchoolPage.module.scss';
import Sidebar from '@/components/layout/Sidebar/Sidebar'; 
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { 
    MdPeople, MdSchool, MdFamilyRestroom, MdBadge,
    MdEventAvailable, MdAttachMoney, MdSchedule,
    MdAssessment, MdSettings, MdPersonAdd 
} from 'react-icons/md';

// 1. Socket.IO client ko import karein
import { io } from "socket.io-client";

// --- FIX: UPDATED NAVITEM INTERFACE (JSX Namespace Error Fixed) ---
interface NavItem {
    id: string;
    title: string;
    path: string;
    // FIX: JSX.Element को React.ReactElement से बदला गया है
    icon: React.ReactElement; 
    name: string; 
    type: 'free' | 'premium' | 'upcoming'; 
}
// ----------------------------------------


// schoolMenuItems array ko NavItem[] type dekar fix karein
const schoolMenuItems: NavItem[] = [
    { 
        id: 'students', 
        title: 'Students', 
        path: '/admin/students', 
        icon: <MdPeople />,
        name: 'Students', 
        type: 'free'     
    },
    { 
        id: 'teachers', 
        title: 'Teachers', 
        path: '/admin/teachers', 
        icon: <MdSchool />,
        name: 'Teachers', 
        type: 'free'     
    },
    { 
        id: 'parents', 
        title: 'Parents', 
        path: '/admin/parents', 
        icon: <MdFamilyRestroom />,
        name: 'Parents', 
        type: 'free'     
    },
    { 
        id: 'staff', 
        title: 'Staff', 
        path: '/admin/staff', 
        icon: <MdBadge />,
        name: 'Staff', 
        type: 'free'     
    },
    { 
        id: 'events', 
        title: 'Events', 
        path: '/admin/events', 
        icon: <MdEventAvailable />,
        name: 'Events', 
        type: 'premium'     
    },
    { 
        id: 'fees', 
        title: 'Fees', 
        path: '/admin/fees', 
        icon: <MdAttachMoney />,
        name: 'Fees', 
        type: 'premium'     
    },
    { 
        id: 'schedules', 
        title: 'Schedules', 
        path: '/admin/schedules', 
        icon: <MdSchedule />,
        name: 'Schedules', 
        type: 'premium'     
    },
    { 
        id: 'reports', 
        title: 'Reports', 
        path: '/admin/reports', 
        icon: <MdAssessment />,
        name: 'Reports', 
        type: 'premium'     
    },
    { 
        id: 'settings', 
        title: 'Settings', 
        path: '/admin/settings', 
        icon: <MdSettings />,
        name: 'Settings', 
        type: 'free'     
    },
];

// (All your existing interfaces remain the same)
interface Student {
    id: string;
    name: string;
    details?: {
        class: string;
    };
}
interface Teacher {
    id: string;
    name: string;
    details?: {
        subject: string;
    };
}
interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalStaff: number;
}
interface DashboardData {
    stats: DashboardStats;
    recentStudents: Student[];
    recentTeachers: Teacher[];
}

// Main Dashboard Component
const DashboardControlCenter = () => {
    const { token } = useAuth(); // Get token to authorize API call
    
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(''); // Error state

    // fetchData function defined outside useEffect
    const fetchData = async () => {
        if (!token) return; 

        if (!data) setLoading(true); 

        try {
            const response = await axios.get('/api/admin/dashboard-stats', {
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

    // 3. Data load karne ke liye useEffect
    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]); 

    // 4. REAL-TIME UPDATES KE LIYE useEffect
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
                            <li key={student.id}><span>{student.name} ({student.details?.class})</span></li>
                        ))}
                    </ul>
                    <div className={styles.boxFooter}><button className={styles.addButton}><MdPersonAdd /> Add Student</button></div>
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
                            <li key={teacher.id}><span>{teacher.name}</span><span className={styles.subject}>{teacher.details?.subject}</span></li>
                        ))}
                    </ul>
                    <div className={styles.boxFooter}><button className={styles.addButton}><MdPersonAdd /> Add Teacher</button></div>
                </div>

                {/* Other boxes */}
                 <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdFamilyRestroom/> Parents ({data?.stats?.totalParents})</h2></div>
                    <div className={styles.boxContent}><p>Parent data will be shown here.</p></div>
                </div>
                 <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}><h2><MdBadge/> Staff ({data?.stats?.totalStaff})</h2></div>
                    <div className={styles.boxContent}><p>Staff data will be shown here.</p></div>
                </div>

            </div>
        </div>
    );
};

// Main Page Component
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
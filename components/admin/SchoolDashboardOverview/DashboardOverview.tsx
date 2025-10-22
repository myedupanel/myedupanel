"use client";
import React, { useState, useEffect } from 'react';
import styles from './DashboardOverview.module.scss';
import Sidebar from '@/components/layout/Sidebar/Sidebar'; 
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext'; // To get the auth token
import { 
    MdPeople, MdSchool, MdFamilyRestroom, MdBadge,
    MdEventAvailable, MdAttachMoney, MdSchedule,
    MdAssessment, MdSettings, MdPersonAdd 
} from 'react-icons/md';

// (schoolMenuItems array remains the same)
const schoolMenuItems = [
    { id: 'students', title: 'Students', path: '/admin/students', icon: <MdPeople /> },
    { id: 'teachers', title: 'Teachers', path: '/admin/teachers', icon: <MdSchool /> },
    // ... rest of the items
];

// ✨ FIX: Define interfaces for your data shape
interface Student {
    _id: string;
    name: string;
    details?: {
        class: string;
    };
}

interface Teacher {
    _id: string;
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

// This is the main interface for your API data
interface DashboardData {
    stats: DashboardStats;
    recentStudents: Student[];
    recentTeachers: Teacher[];
}

// Main Dashboard Component
const DashboardControlCenter = () => {
    const { token } = useAuth(); // Get token to authorize API call
    
    // ✨ FIX (Applied): Update useState to expect DashboardData or null
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(''); // Error state

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return; // Wait until token is available

            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
                setError('');
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError('Could not load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]); // Re-run when token becomes available

    if (loading) {
        return <div className={styles.loading}>Loading Dashboard...</div>;
    }
    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.overviewContainer}>
            <h1 className={styles.mainTitle}>School Control Center</h1>
            
            {/* The top 4 cards have been removed as requested */}

            <div className={styles.mainGrid}>
                {/* Students Box (Now with real data) */}
                <div className={styles.summaryBox}>
                    <div className={styles.boxHeader}>
                        {/* data?.stats... is correct because 'data' can be null */}
                        <h2><MdPeople/> Students ({data?.stats?.totalStudents})</h2>
                        <Link href="/admin/students" className={styles.viewAllLink}>View All</Link>
                    </div>
                    <ul className={styles.recentList}>
                        <li className={styles.listHeader}>Recent Admissions</li>
                        {/* 'student' is now correctly typed as 'Student' */}
                        {data?.recentStudents?.map(student => (
                            <li key={student._id}><span>{student.name} ({student.details?.class})</span></li>
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
                        {/* 'teacher' is now correctly typed as 'Teacher' */}
                         {data?.recentTeachers?.map(teacher => (
                            <li key={teacher._id}><span>{teacher.name}</span><span className={styles.subject}>{teacher.details?.subject}</span></li>
                        ))}
                    </ul>
                    <div className={styles.boxFooter}><button className={styles.addButton}><MdPersonAdd /> Add Teacher</button></div>
                </div>

                {/* Other boxes can be updated similarly once their backend data is ready */}
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
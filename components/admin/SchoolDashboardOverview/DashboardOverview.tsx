"use client";
import React, { useState, useEffect } from 'react';
import styles from './SchoolPage.module.scss'; // Using the name from your example
import Sidebar from '@/components/layout/Sidebar/Sidebar'; 
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext'; // To get the auth token
import { 
    MdPeople, MdSchool, MdFamilyRestroom, MdBadge,
    MdEventAvailable, MdAttachMoney, MdSchedule,
    MdAssessment, MdSettings, MdPersonAdd 
} from 'react-icons/md';

// ✨ 1. Socket.IO client ko import karein
import { io } from "socket.io-client";

// (schoolMenuItems array remains the same)
const schoolMenuItems = [
    { id: 'students', title: 'Students', path: '/admin/students', icon: <MdPeople /> },
    { id: 'teachers', title: 'Teachers', path: '/admin/teachers', icon: <MdSchool /> },
    // ... rest of the items
];

// (All your interfaces remain the same)
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

    // ✨ 2. Humne 'fetchData' function ko 'useEffect' se bahar nikaal liya hai
    //    Taaki hum isse baar-baar call kar sakein
    const fetchData = async () => {
        if (!token) return; // Wait until token is available

        // Sirf pehli baar page load par 'Loading...' dikhayein
        if (!data) setLoading(true); 

        try {
            // NOTE: Make sure this is your correct dashboard API endpoint
            const response = await axios.get('/api/admin/dashboard-stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data);
            setError('');
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            setError('Could not load dashboard data.');
        } finally {
            // Loading state ko sirf pehli baar hi false karein
            if (!data) setLoading(false);
        }
    };

    // ✨ 3. Yeh 'useEffect' pehli baar data load karne ke liye hai
    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]); // Re-run when token becomes available

    // ✨ 4. YEH NAYA 'useEffect' REAL-TIME UPDATES KE LIYE HAI
    useEffect(() => {
        // Apne backend server se connect karein
        const socket = io("https://myedupanel.onrender.com");

        // 'updateDashboard' event ko "sunein"
        // Yeh wahi event hai jo aapne backend 'students.js' se emit kiya tha
        socket.on('updateDashboard', () => {
            console.log("REAL-TIME UPDATE RECEIVED! Dashboard data refresh ho raha hai...");
            
            // Jaise hi event aaye, data ko dobaara fetch karein
            fetchData();
        });

        // Clean-up function: Jab component hatega, toh connection band kar dein
        return () => {
            socket.disconnect();
        };
    }, [token, fetchData]); // Dependencies add ki hain


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
                        {/* YEH NUMBER AB REAL-TIME MEIN UPDATE HOGA */}
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
                         {/* YEH NUMBER BHI AB REAL-TIME MEIN UPDATE HOGA */}
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
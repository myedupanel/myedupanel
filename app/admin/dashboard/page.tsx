"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/backend/utils/api'; // Ensure correct path
import { io } from "socket.io-client";
import Header from '@/components/admin/Header/Header';
import StatCard from '@/components/admin/StatCard/StatCard';
import StudentAdmissionChart from '@/components/admin/StudentAdmissionChart/StudentAdmissionChart';
import StudentClassChart from '@/components/admin/academics/StudentClassChart'; // Ensure path is correct
import RecentPayments from '@/components/admin/RecentPayments/RecentPayments';
import { MdPeople, MdSchool, MdAttachMoney, MdFamilyRestroom, MdBadge, MdClass } from 'react-icons/md';
import styles from './AdminDashboard.module.scss';
import { useAuth, User } from '../../context/AuthContext'; 

// --- TYPE DEFINITIONS (No Change) ---
interface MonthlyAdmissionData {
  name: string;
  admissions: number;
  color: string;
}
interface ClassCountData {
    name: string;
    count: number;
    color: string;
}

interface BackendDashboardData {
  admissionsData: { name: string; admissions: number }[];
  classCounts: { name: string; count: number }[];
  recentStudents: any[];
  recentTeachers: any[];
  recentParents: any[];
  recentStaff: any[];
  recentFees: { id: string; student: string; amount: string; date: string }[];
  totalStudents?: number;
  totalTeachers?: number;
  totalParents?: number;
  totalClasses?: number;
  totalStaff?: number;
  currentMonthRevenue?: number;
  currentMonthName?: string;
}

interface FormattedDashboardData {
  stats: { title: string; value: string; monthName?: string }[];
  monthlyAdmissions: MonthlyAdmissionData[];
  classCounts: ClassCountData[];
  recentPayments: { id: string; student: string; amount: string; date: string }[];
}

// --- COLOR PALETTES (No Change) ---
const classColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#D97706'];
const admissionColors = {
    high: '#22c55e',
    medium: '#8b5cf6',
    low: '#ef4444'
};

// --- CARD DETAILS (No Change) ---
const cardDetails = {
  "Total Students": { icon: <MdPeople />, theme: "blue" },
  "Total Teachers": { icon: <MdSchool />, theme: "teal" },
  "Monthly Revenue": { icon: <MdAttachMoney />, theme: "green" }, 
  "Total Parents": { icon: <MdFamilyRestroom />, theme: "purple" },
  "Total Staff": { icon: <MdBadge />, theme: "orange" },
  "Total Classes": { icon: <MdClass />, theme: "sky" }
} as const;

// --- CARD LINKS (No Change) ---
const cardLinks: { [key: string]: string } = {
  "Total Students": "/admin/students",
  "Total Teachers": "/admin/teachers",
  "Total Staff": "/admin/staff",
  "Total Parents": "/admin/parents",
  "Monthly Revenue": "/admin/fee-counter",
  "Total Classes": "/admin/school/classes"
};
// --- END CARD LINKS ---

// --- HELPER FUNCTION (No Change) ---
const getAdmissionColor = (value: number, min: number, max: number): string => {
    if (value <= 0) return '#9ca3af';
    if (max === min && value > 0) return admissionColors.medium;
    if (value === max) return admissionColors.high;
    if (value === min) return admissionColors.low;
    const mid = (max + min) / 2;
    return value >= mid ? admissionColors.medium : admissionColors.low;
};


const AdminDashboardPage = () => {
  const { user, token } = useAuth() as { user: User | null; token: string | null; login: (token: string) => Promise<any> };
  const [dashboardData, setDashboardData] = useState<FormattedDashboardData | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  
  // --- fetchDashboardData (No Change in core logic) ---
  const fetchDashboardData = useCallback(async () => {
    if (!token) {
        console.log("fetchDashboardData: No token found, skipping fetch.");
        return;
    }
    console.log("fetchDashboardData: Fetching data...");
    try {
      const response = await api.get<BackendDashboardData>('/admin/dashboard-data');
      const data = response.data;
      console.log("fetchDashboardData: Data received from backend:", data);

      // Processing Logic (No Change)
      const monthlyDataFromApi = data.admissionsData || [];
      let coloredMonthlyData: MonthlyAdmissionData[] = [];
      if (monthlyDataFromApi.length > 0) {
          const admissionValues = monthlyDataFromApi.map(d => d.admissions).filter(v => v > 0);
          const maxVal = admissionValues.length > 0 ? Math.max(...admissionValues) : 0;
          const minVal = admissionValues.length > 0 ? Math.min(...admissionValues) : 0;

          coloredMonthlyData = monthlyDataFromApi.map(item => ({
              name: item.name,
              admissions: item.admissions,
              color: getAdmissionColor(item.admissions, minVal, maxVal)
          }));
      } else {
           console.log("fetchDashboardData: No monthly admissions data found.");
      }

      const classDataFromApi = data.classCounts || [];
      let coloredClassData: ClassCountData[] = [];
      if (classDataFromApi.length > 0) {
          coloredClassData = classDataFromApi.map((item, index) => ({
              name: item.name,
              count: item.count,
              color: classColors[index % classColors.length]
          }));
      } else {
            console.log("fetchDashboardData: No class count data found.");
      }

      const revenueAmount = data.currentMonthRevenue || 0;
      const formattedRevenue = `₹${revenueAmount.toLocaleString('en-IN')}`;
      const monthName = data.currentMonthName || 'Monthly';
      const revenueTitle = `${monthName.substring(0, 3)} Revenue`; 

      const formattedStats = [
        { title: "Total Students", value: (data.totalStudents || 0).toString() },
        { title: "Total Teachers", value: (data.totalTeachers || 0).toString() },
        { title: revenueTitle, value: formattedRevenue, monthName: monthName }, 
        { title: "Total Parents", value: (data.totalParents || 0).toString() },
        { title: "Total Staff", value: (data.totalStaff || 0).toString() },
        { title: "Total Classes", value: (classDataFromApi.length || 0).toString() }
      ];

      const formattedData: FormattedDashboardData = {
        stats: formattedStats,
        monthlyAdmissions: coloredMonthlyData,
        classCounts: coloredClassData,
        recentPayments: data.recentFees || []
      };

      setDashboardData(formattedData);
      console.log("fetchDashboardData: Dashboard state updated.");

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setDashboardData({ stats: [], monthlyAdmissions: [], classCounts: [], recentPayments: [] });
    }
  }, [token]);
  // --- END fetchDashboardData ---

  // --- loadProfileData (No Change) ---
  const loadProfileData = useCallback(() => {
    if (user) {
      let profileData: AdminProfile = {
        id: user.id,
        email: user.email,
        adminName: user.name,
        schoolName: user.schoolName || 'Your School', // Yeh fallback (Trust Name) hai
        profileImageUrl: ''
      };
      const savedProfile = localStorage.getItem(`adminProfile_${user.id}`);
      if (savedProfile) {
        try {
            const savedData = JSON.parse(savedProfile);
            if (savedData.adminName) profileData.adminName = savedData.adminName;
            if (savedData.profileImageUrl && savedData.profileImageUrl.startsWith('data:image')) {
              profileData.profileImageUrl = savedData.profileImageUrl;
            }
        } catch (e) { console.error("Failed to parse saved profile data:", e); }
      }
      setAdminProfile(profileData);
    } else { setAdminProfile(null); }
  }, [user]);

  // --- useEffect (UPDATED) ---
  useEffect(() => {
    if (token) {
        fetchDashboardData();
    }
    loadProfileData(); 

    // --- YAHAN FIX KIYA GAYA HAI ---
    // School profile ko fetch karke Header ke title ko update kiya
    const fetchSchoolProfileForHeader = async () => {
      try {
        const res = await api.get('/api/school/profile');
        if (res.data && res.data.name2) {
          // Admin profile state ko 'name2' (Certificate Name) se update kiya
          setAdminProfile(prevProfile => {
            if (prevProfile) {
              return { ...prevProfile, schoolName: res.data.name2 };
            }
            // Agar profile state abhi set nahi hua hai, toh use user data se banaya
            return {
              id: user!.id,
              email: user!.email,
              adminName: user!.name,
              schoolName: res.data.name2, // The correct name
              profileImageUrl: res.data.logoUrl || ''
            };
          });
        }
      } catch (error) {
        console.error("Failed to fetch school profile for header:", error);
        // Agar yeh fail hota hai, toh token waala (Trust Name) hi dikhega
      }
    };

    if (user) { // User load hone ke baad hi profile fetch karein
      fetchSchoolProfileForHeader();
    }
    // --- FIX ENDS HERE ---

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://myedupanel.onrender.com";
    const socket = io(socketUrl);

    socket.on('connect', () => {
        console.log('Socket.IO: Connected!');
        console.log('Socket.IO: Connected to URL:', socketUrl);
    });
    socket.on('updateDashboard', () => {
      console.log('Socket.IO: Update event received! Refreshing dashboard data...');
      fetchDashboardData();
    });
    socket.on('connect_error', (err) => console.error('Socket.IO: Connection Error!', err.message, err.cause));
    window.addEventListener('focus', loadProfileData);

    return () => {
      window.removeEventListener('focus', loadProfileData);
      socket.disconnect();
      console.log('Socket.IO: Disconnected');
    };
  }, [fetchDashboardData, loadProfileData, token, user]); // 'user' ko dependency mein add kiya

  // --- Loading state (No Change) ---
  if (!adminProfile || !dashboardData) {
    return <div className={styles.loading}>Loading Dashboard...</div>;
  }
  
  // --- Error Handling/Empty State (No Change) ---
  if (dashboardData.stats.length === 0) {
      return (
          <div className={styles.dashboardContainer}>
              <Header admin={adminProfile} />
              <div className={styles.emptyState}>
                  <h2>Dashboard Data Unavailable</h2>
                  <p>Could not fetch dashboard data. Please check the backend server and try logging in again.</p>
              </div>
          </div>
      );
  }


  // --- JSX (No Change) ---
  return (
    <div className={styles.dashboardContainer}>
      <Header admin={adminProfile} />
      
      <div className={styles.statsGrid}>
        {dashboardData.stats.map((stat) => {
          const baseTitle = stat.title.includes('Revenue') ? "Monthly Revenue" : stat.title; 
          const href = cardLinks[baseTitle as keyof typeof cardLinks];
          
          const cardComponent = (
            <StatCard
              // Use the full title (Nov Revenue) for display
              title={stat.title}
              value={stat.value}
              
              // Icon/Theme ke liye 'baseTitle' (dynamic) use karna padega
              icon={cardDetails[baseTitle as keyof typeof cardDetails]?.icon}
              theme={cardDetails[baseTitle as keyof typeof cardDetails]?.theme}
            />
          );

          // Link check base title par hi karna padega
          if (href) {
            return (
              <Link href={href} key={stat.title} className={styles.statLink}>
                {cardComponent}
              </Link>
            );
          }

          return (
            <div key={stat.title}>
              {cardComponent}
            </div>
          );
        })}
      </div>
      
      <div className={styles.chartsRow}>
          <div className={styles.chartContainer}>
            <StudentAdmissionChart data={dashboardData.monthlyAdmissions} />
          </div>
          <div className={styles.chartContainer}>
            <StudentClassChart data={dashboardData.classCounts} />
          </div>
      </div>
      
      <div className={styles.paymentsContainer}>
        <RecentPayments payments={dashboardData.recentPayments} />
      </div>
    </div>
  );
};

export default AdminDashboardPage;

// --- AdminProfile Interface (No Change) ---
interface AdminProfile {
  id: number;
  adminName: string;
  email: string;
  profileImageUrl: string;
  schoolName: string;
} 
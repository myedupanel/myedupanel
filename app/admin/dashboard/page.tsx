"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // --- BADLAAV YAHAN --- (Link component import kiya)
import api from '@/backend/utils/api'; // Ensure correct path
import { io } from "socket.io-client";
import Header from '@/components/admin/Header/Header';
import StatCard from '@/components/admin/StatCard/StatCard';
import StudentAdmissionChart from '@/components/admin/StudentAdmissionChart/StudentAdmissionChart';
import StudentClassChart from '@/components/admin/academics/StudentClassChart'; // Ensure path is correct
import RecentPayments from '@/components/admin/RecentPayments/RecentPayments';
import { MdPeople, MdSchool, MdAttachMoney, MdFamilyRestroom, MdBadge, MdClass } from 'react-icons/md';
import styles from './AdminDashboard.module.scss';
import { useAuth, User } from '../../context/AuthContext'; // Import User type

// --- TYPE DEFINITIONS ---
// (Yahaan koi badlaav nahi)
// ... (saare interfaces waise hi rahenge) ...
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
}
interface FormattedDashboardData {
  stats: { title: string; value: string }[];
  monthlyAdmissions: MonthlyAdmissionData[];
  classCounts: ClassCountData[];
  recentPayments: { id: string; student: string; amount: string; date: string }[];
}

// --- COLOR PALETTES ---
// (Yahaan koi badlaav nahi)
const classColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#D97706'];
const admissionColors = {
    high: '#22c55e',
    medium: '#8b5cf6',
    low: '#ef4444'
};

// --- CARD DETAILS ---
// (Yahaan koi badlaav nahi)
const cardDetails = {
  "Total Students": { icon: <MdPeople />, theme: "blue" },
  "Total Teachers": { icon: <MdSchool />, theme: "teal" },
  "Monthly Revenue": { icon: <MdAttachMoney />, theme: "green" },
  "Total Parents": { icon: <MdFamilyRestroom />, theme: "purple" },
  "Total Staff": { icon: <MdBadge />, theme: "orange" },
  "Total Classes": { icon: <MdClass />, theme: "sky" }
} as const;

// --- HELPER FUNCTION ---
// (Yahaan koi badlaav nahi)
const getAdmissionColor = (value: number, min: number, max: number): string => {
    if (value <= 0) return '#9ca3af';
    if (max === min && value > 0) return admissionColors.medium;
    if (value === max) return admissionColors.high;
    if (value === min) return admissionColors.low;
    const mid = (max + min) / 2;
    return value >= mid ? admissionColors.medium : admissionColors.low;
};


// --- BADLAAV YAHAN ---
// Humne card titles ko unke respective links se map kiya hai
const cardLinks: { [key: string]: string } = {
  "Total Students": "/admin/students",
  "Total Teachers": "/admin/teachers",
  "Total Staff": "/admin/staff",
  "Total Parents": "/admin/parents",
  "Monthly Revenue": "/admin/feecounter"
  // "Total Classes" ka link nahi hai, isliye woh add nahi kiya
};
// --- END BADLAAV ---


const AdminDashboardPage = () => {
  const { user, token } = useAuth() as { user: User | null; token: string | null; login: (token: string) => Promise<any> };
  const [dashboardData, setDashboardData] = useState<FormattedDashboardData | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  // --- fetchDashboardData ---
  // (Yahaan koi badlaav nahi)
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

      // Process Monthly Admissions
      const monthlyDataFromApi = data.admissionsData || [];
      let coloredMonthlyData: MonthlyAdmissionData[] = [];
      if (monthlyDataFromApi.length > 0) {
          const admissionValues = monthlyDataFromApi.map(d => d.admissions).filter(v => v > 0);
          const maxVal = admissionValues.length > 0 ? Math.max(...admissionValues) : 0;
          const minVal = admissionValues.length > 0 ? Math.min(...admissionValues) : 0;
          console.log(`Monthly Admissions Min: ${minVal}, Max: ${maxVal}`);

          coloredMonthlyData = monthlyDataFromApi.map(item => ({
              name: item.name,
              admissions: item.admissions,
              color: getAdmissionColor(item.admissions, minVal, maxVal)
          }));
      } else {
           console.log("fetchDashboardData: No monthly admissions data found.");
      }
      console.log("fetchDashboardData: Processed Monthly Admissions:", coloredMonthlyData);

      // Process Class Counts
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
      console.log("fetchDashboardData: Processed Class Counts:", coloredClassData);

      // Format Stats
      const formattedStats = [
        { title: "Total Students", value: (data.totalStudents || 0).toString() },
        { title: "Total Teachers", value: (data.totalTeachers || 0).toString() },
        { title: "Monthly Revenue", value: "₹0" }, // Static
        { title: "Total Parents", value: (data.totalParents || 0).toString() },
        { title: "Total Staff", value: (data.totalStaff || 0).toString() },
        { title: "Total Classes", value: (classDataFromApi.length || 0).toString() }
      ];

      // Set final formatted data
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

  // --- loadProfileData ---
  // (Yahaan koi badlaav nahi)
  const loadProfileData = useCallback(() => {
    if (user) {
      let profileData: AdminProfile = {
        id: user.id,
        email: user.email,
        adminName: user.name,
        schoolName: user.schoolName || 'Your School',
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

  // --- useEffect ---
  // (Yahaan koi badlaav nahi)
  useEffect(() => {
    if (token) {
        fetchDashboardData();
    }
    loadProfileData(); 

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
  }, [fetchDashboardData, loadProfileData, token]);

  // --- Loading state ---
  if (!adminProfile || !dashboardData) {
    return <div className={styles.loading}>Loading Dashboard...</div>;
  }

  // --- JSX (UPDATED) ---
  return (
    <div className={styles.dashboardContainer}>
      <Header admin={adminProfile} />
      
      <div className={styles.statsGrid}>
        {/* --- BADLAAV YAHAN --- */}
        {/* Ab hum .map() ke andar check karenge ki link hai ya nahi */}
        {dashboardData.stats.map((stat) => {
          const href = cardLinks[stat.title as keyof typeof cardLinks];
          
          const cardComponent = (
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={cardDetails[stat.title as keyof typeof cardDetails]?.icon}
              theme={cardDetails[stat.title as keyof typeof cardDetails]?.theme}
            />
          );

          // Agar 'href' (link) hai, toh card ko <Link> se wrap karo
          if (href) {
            return (
              <Link href={href} key={stat.title} className={styles.statLink}>
                {cardComponent}
              </Link>
            );
          }

          // Agar link nahi hai, toh sirf card dikhao (jaise "Total Classes")
          return (
            <div key={stat.title}> {/* Key ko wrapper par rakha */}
              {cardComponent}
            </div>
          );
        })}
        {/* --- END BADLAAV --- */}
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

// --- AdminProfile Interface ---
// (Yahaan koi badlaav nahi)
interface AdminProfile {
  id: number;
  adminName: string;
  email: string;
  profileImageUrl: string;
  schoolName: string;
}
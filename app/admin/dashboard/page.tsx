"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api'; 
import { io } from "socket.io-client";
import Header from '@/components/admin/Header/Header';
import StatCard from '@/components/admin/StatCard/StatCard';
import StudentAdmissionChart from '@/components/admin/StudentAdmissionChart/StudentAdmissionChart';
import RecentPayments from '@/components/admin/RecentPayments/RecentPayments';
import { MdPeople, MdSchool, MdAttachMoney, MdFamilyRestroom, MdBadge, MdClass } from 'react-icons/md';
import styles from './AdminDashboard.module.scss';
import { useAuth } from '../../context/AuthContext';

// --- TYPE DEFINITIONS ---
interface ChartData {
  name: string;
  admissions: number;
  color: string;
}

interface AdminProfile {
  _id: string;
  adminName: string;
  email: string;
  profileImageUrl: string;
}

// ===== BADLAAV 2: Naye Professional Colours =====
const cardDetails = {
  "Total Students": { icon: <MdPeople />, theme: "blue" },
  "Total Teachers": { icon: <MdSchool />, theme: "teal" },
  "Monthly Revenue": { icon: <MdAttachMoney />, theme: "green" },
  "Total Parents": { icon: <MdFamilyRestroom />, theme: "purple" },
  "Total Staff": { icon: <MdBadge />, theme: "orange" },
  "Total Classes": { icon: <MdClass />, theme: "sky" }
} as const;
// ===== END BADLAAV 2 =====

interface BackendDashboardData {
  admissionsData: { month: string; admissions: number }[];
  recentStudents: any[];
  recentTeachers: any[];
  recentParents: any[];
  recentStaff: any[];
  recentFees: any[];
  totalStudents?: number;
  totalTeachers?: number;
  totalParents?: number;
  totalClasses?: number;
  totalStaff?: number; // Backend yeh bhej raha hai, humein iska type add karna chahiye
}

interface FormattedDashboardData {
  stats: { title: string; value: string }[];
  admissionData: ChartData[]; 
  recentPayments: any[];
}

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<FormattedDashboardData | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get<BackendDashboardData>('/admin/dashboard-data');
      const data = response.data;

      const chartDataFromApi = data.admissionsData || [];
      let coloredChartData: ChartData[] = [];

      if (chartDataFromApi.length > 0) {
        const values = chartDataFromApi.map(d => d.admissions);
        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);

        coloredChartData = chartDataFromApi.map(item => {
            let color: string;
            if (item.admissions === maxVal) color = "#22c55e";
            else if (item.admissions === minVal) color = "#ef4444";
            else color = "#8b5cf6";
            return { name: item.month, admissions: item.admissions, color };
        });
      }

      // ===== BADLAAV 1: "0" Bug Fix Yahaan Hai =====
      const formattedStats = [
        { title: "Total Students", value: (data.totalStudents || 0).toString() },
        { title: "Total Teachers", value: (data.totalTeachers || 0).toString() },
        { title: "Monthly Revenue", value: "₹0" }, // Yeh abhi static hai
        { title: "Total Parents", value: (data.totalParents || 0).toString() },
        // Humne data.recentStaff.length ko data.totalStaff se badal diya
        { title: "Total Staff", value: (data.totalStaff || 0).toString() }, 
        { title: "Total Classes", value: (data.totalClasses || 0).toString() }
      ];
      // ===== END BADLAAV 1 =====

      const formattedData: FormattedDashboardData = {
        stats: formattedStats,
        admissionData: coloredChartData,
        recentPayments: data.recentFees || []
      };

      setDashboardData(formattedData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setDashboardData({ stats: [], admissionData: [], recentPayments: [] });
    }
  }, []);

  const loadProfileData = useCallback(() => {
    if (user) {
      let profileData: AdminProfile = { 
        ...user, 
        adminName: user.adminName, 
        profileImageUrl: '' 
      };
      
      const savedProfile = localStorage.getItem(`adminProfile_${user._id}`);
      if (savedProfile) {
        const savedData = JSON.parse(savedProfile);
        if (savedData.profileImageUrl && savedData.profileImageUrl.startsWith('data:image')) {
          profileData.profileImageUrl = savedData.profileImageUrl;
        }
        if (savedData.adminName) {
            profileData.adminName = savedData.adminName;
        }
      }
      setAdminProfile(profileData);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
    loadProfileData();

    const socket = io("https://myedupanel.onrender.com");
    socket.on('connect', () => console.log('Socket.IO: Connected'));
    
    // Yahi magic hai real-time updates ka
    socket.on('updateDashboard', () => { 
      console.log('Socket.IO: Update event mila! Data refresh ho raha hai...');
      fetchDashboardData(); 
    });

    socket.on('connect_error', (err) => console.error('Socket.IO: Connection Error!', err.message));
    
    window.addEventListener('focus', loadProfileData); 

    return () => {
      window.removeEventListener('focus', loadProfileData);
      socket.disconnect();
    };
  }, [fetchDashboardData, loadProfileData]);

  if (!adminProfile || !dashboardData) {
    return <div className={styles.loading}>Loading Dashboard...</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <Header admin={adminProfile} />
      
      <div className={styles.statsGrid}>
        {dashboardData.stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            // Icon aur naye colours ab yahaan se aa rahe hain
            icon={cardDetails[stat.title as keyof typeof cardDetails]?.icon}
            theme={cardDetails[stat.title as keyof typeof cardDetails]?.theme}
          />
        ))}
      </div>
      <div className={styles.chartContainer}>
        <StudentAdmissionChart data={dashboardData.admissionData} />
      </div>
      <div className={styles.paymentsContainer}>
        <RecentPayments payments={dashboardData.recentPayments} />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
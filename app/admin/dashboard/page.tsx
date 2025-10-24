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

// Interface for the data expected by the Header component
interface AdminProfile {
  _id: string;
  adminName: string; // Header component expects adminName
  email: string;
  profileImageUrl: string;
}

const cardDetails = {
  "Total Students": { icon: <MdPeople />, theme: "blue" },
  "Total Teachers": { icon: <MdSchool />, theme: "teal" },
  "Monthly Revenue": { icon: <MdAttachMoney />, theme: "green" },
  "Total Parents": { icon: <MdFamilyRestroom />, theme: "purple" },
  "Total Staff": { icon: <MdBadge />, theme: "orange" },
  "Total Classes": { icon: <MdClass />, theme: "sky" }
} as const;

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
  totalStaff?: number;
}

interface FormattedDashboardData {
  stats: { title: string; value: string }[];
  admissionData: ChartData[];
  recentPayments: any[];
}

const AdminDashboardPage = () => {
  const { user } = useAuth(); // 'user' now likely has 'name', not 'adminName'
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

      const formattedStats = [
        { title: "Total Students", value: (data.totalStudents || 0).toString() },
        { title: "Total Teachers", value: (data.totalTeachers || 0).toString() },
        { title: "Monthly Revenue", value: "₹0" }, // Static for now
        { title: "Total Parents", value: (data.totalParents || 0).toString() },
        { title: "Total Staff", value: (data.totalStaff || 0).toString() },
        { title: "Total Classes", value: (data.totalClasses || 0).toString() } // Assuming backend sends this
      ];

      const formattedData: FormattedDashboardData = {
        stats: formattedStats,
        admissionData: coloredChartData,
        recentPayments: data.recentFees || []
      };

      setDashboardData(formattedData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Provide default structure on error to prevent crashes
      setDashboardData({
         stats: [
            { title: "Total Students", value: "0" }, { title: "Total Teachers", value: "0" },
            { title: "Monthly Revenue", value: "₹0" }, { title: "Total Parents", value: "0" },
            { title: "Total Staff", value: "0" }, { title: "Total Classes", value: "0" }
         ],
         admissionData: [],
         recentPayments: []
      });
    }
  }, []);

  const loadProfileData = useCallback(() => {
    if (user) {
      // --- FIX IS HERE: Use user.name instead of user.adminName ---
      // We map user.name (from AuthContext) to adminName (expected by Header prop)
      let profileData: AdminProfile = {
        _id: user._id,           // Make sure _id is included
        email: user.email,       // Make sure email is included
        adminName: user.name,    // Map user.name to adminName
        profileImageUrl: ''      // Initialize profileImageUrl
      };
      // --- End of FIX ---

      // Load profile image and potentially updated name from localStorage
      const savedProfile = localStorage.getItem(`adminProfile_${user._id}`);
      if (savedProfile) {
        try {
            const savedData = JSON.parse(savedProfile);
            // Prioritize localStorage name if available (from profile edit page)
            if (savedData.adminName) {
                profileData.adminName = savedData.adminName;
            }
            // Load saved image if it looks valid
            if (savedData.profileImageUrl && savedData.profileImageUrl.startsWith('data:image')) {
              profileData.profileImageUrl = savedData.profileImageUrl;
            }
        } catch (e) {
            console.error("Failed to parse saved profile data:", e);
            // Optionally clear corrupted localStorage data
            // localStorage.removeItem(`adminProfile_${user._id}`);
        }
      }
      setAdminProfile(profileData);
    } else {
        // Handle case where user is not logged in or data is not yet available
        setAdminProfile(null);
    }
  }, [user]); // Dependency on user object

  useEffect(() => {
    fetchDashboardData();
    loadProfileData(); // Load profile data on initial mount and when user changes

    const socket = io("https://myedupanel.onrender.com"); // Ensure correct backend URL
    socket.on('connect', () => console.log('Socket.IO: Connected'));

    socket.on('updateDashboard', () => {
      console.log('Socket.IO: Update event received! Refreshing data...');
      fetchDashboardData();
    });

    socket.on('connect_error', (err) => console.error('Socket.IO: Connection Error!', err.message));

    // Refresh profile data when window gains focus (e.g., after editing profile in another tab)
    window.addEventListener('focus', loadProfileData);

    // Cleanup function: remove listener and disconnect socket when component unmounts
    return () => {
      window.removeEventListener('focus', loadProfileData);
      socket.disconnect();
      console.log('Socket.IO: Disconnected');
    };
  }, [fetchDashboardData, loadProfileData]); // Dependencies for useEffect

  // Loading state
  if (!adminProfile || !dashboardData) {
    return <div className={styles.loading}>Loading Dashboard...</div>;
  }

  // Render the dashboard
  return (
    <div className={styles.dashboardContainer}>
      {/* Pass the correctly formatted adminProfile to Header */}
      <Header admin={adminProfile} />

      <div className={styles.statsGrid}>
        {dashboardData.stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
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
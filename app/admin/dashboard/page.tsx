"use client";
import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios'; // <-- Isko hatayein
import api from '@/backend/utils/api'; // <-- Apna configured Axios instance import karein
import { io } from "socket.io-client";
import Header from '@/components/admin/Header/Header';
import StatCard from '@/components/admin/StatCard/StatCard';
import StudentAdmissionChart from '@/components/admin/StudentAdmissionChart/StudentAdmissionChart';
import RecentPayments from '@/components/admin/RecentPayments/RecentPayments'; // <-- Component ka naam RecentPayments assume kar rahe hain
import { MdPeople, MdSchool, MdAttachMoney, MdFamilyRestroom, MdBadge, MdClass } from 'react-icons/md';
import styles from './AdminDashboard.module.scss';
import { useAuth } from '../../context/AuthContext';

// Helper to map icon names and themes to components
const cardDetails = {
  "Total Students": { icon: <MdPeople />, theme: "blue" },
  "Total Teachers": { icon: <MdSchool />, theme: "orange" },
  "Monthly Revenue": { icon: <MdAttachMoney />, theme: "green" }, // Placeholder
  "Total Parents": { icon: <MdFamilyRestroom />, theme: "purple" },
  "Total Staff": { icon: <MdBadge />, theme: "red" }, // Placeholder for Staff if needed
  "Total Classes": { icon: <MdClass />, theme: "teal" } // Placeholder for Classes
};

// Interface for the data expected from the backend
interface BackendDashboardData {
  admissionsData: { month: string; admissions: number }[];
  recentStudents: { name: string; details?: { class: string } }[];
  recentTeachers: { name: string; details?: { subject: string } }[];
  recentParents: { name: string }[];
  recentStaff: { name: string; details?: { role: string } }[];
  recentFees: { _id: string; student: string; amount: string }[];
  totalStudents?: number; // Add other totals if backend provides them
  totalTeachers?: number;
  totalParents?: number;
  totalClasses?: number; // Example
}

// Interface for the formatted data used by the component
interface FormattedDashboardData {
  stats: { title: string; value: string }[];
  admissionData: { name: string; admissions: number; color?: string }[];
  recentPayments: { _id: string; student: string; amount: string }[]; // Assuming recentPayments matches recentFees
}

const AdminDashboardPage = () => {
  const { user } = useAuth();

  // Initialize state with a structure matching FormattedDashboardData or null
  const [dashboardData, setDashboardData] = useState<FormattedDashboardData | null>(null);
  const [adminProfile, setAdminProfile] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      // --- CHANGE 1: Use apiClient and the correct URL ---
      const response = await api.get<BackendDashboardData>('/admin/dashboard-data');
      const data = response.data;

      // --- CHANGE 2: Adjust data formatting to match the new backend response ---

      // Format chart data (assuming backend returns admissionsData in the right format)
      // If backend returns data like [{ name: 'Class A', count: 10 }], map it here.
      // For now, using the static data from backend example.
      const chartDataFromApi = data.admissionsData || [];
      let coloredChartData = [];

      if (chartDataFromApi.length > 0) {
        const values = chartDataFromApi.map(d => d.admissions);
        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);

        coloredChartData = chartDataFromApi.map(item => {
            // --- FIX: 'color' ko explicitly 'string' type diya taki error na aaye ---
            let color: string; 
            
            // Assuming 'month' is the category name for the chart
            if (item.admissions === maxVal) color = "#22c55e"; // Green for max
            else if (item.admissions === minVal) color = "#ef4444"; // Red for min
            else color = "#8b5cf6"; // Purple for others
            return { name: item.month, admissions: item.admissions, color }; // Use month as name
        });
      }


      // Format stats cards using data from the new endpoint
      const formattedStats = [
        { title: "Total Students", value: (data.totalStudents || data.recentStudents?.length || 0).toString() }, // Example: Use total or count recent
        { title: "Total Teachers", value: (data.totalTeachers || data.recentTeachers?.length || 0).toString() },
        { title: "Monthly Revenue", value: "₹0" }, // Placeholder
        { title: "Total Parents", value: (data.totalParents || data.recentParents?.length || 0).toString() },
        { title: "Total Staff", value: (data.recentStaff?.length || 0).toString() }, // Example
        { title: "Total Classes", value: (data.totalClasses || 0).toString() } // Example
      ];

      // Combine into the final state object
      const formattedData: FormattedDashboardData = {
        stats: formattedStats,
        admissionData: coloredChartData,
        recentPayments: data.recentFees || [] // Use recentFees from backend
      };

      console.log("Data being passed to chart:", formattedData.admissionData); // Keep console log for checking
      setDashboardData(formattedData);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Set empty state on error to prevent crashes
      setDashboardData({ stats: [], admissionData: [], recentPayments: [] });
    }
  }, []); // Removed dependency on user if not directly used in fetch logic

  const loadProfileData = useCallback(() => {
    if (user) {
      // Logic to load profile image from local storage
      let profileData = { ...user, profileImageUrl: null }; // Start with user data from context
      const savedProfile = localStorage.getItem(`adminProfile_${user._id}`);
      if (savedProfile) {
        const savedData = JSON.parse(savedProfile);
        // Ensure the saved data is a valid base64 image string
        if (savedData.profileImageUrl && savedData.profileImageUrl.startsWith('data:image')) {
          profileData.profileImageUrl = savedData.profileImageUrl;
        }
      }
      setAdminProfile(profileData);
    }
  }, [user]); // Depends on user from context

  useEffect(() => {
    // Initial data fetch and profile load
    fetchDashboardData();
    loadProfileData();

    // Setup Socket.IO connection
    const socket = io("http://localhost:5000"); // Your backend URL
    socket.on('connect', () => console.log('Socket.IO: Connected to real-time server!'));

    // Listen for dashboard updates from the server
    socket.on('updateDashboard', (updateInfo) => { // Optional: Pass specific info
      console.log('Socket.IO: Update signal received!', updateInfo);
      fetchDashboardData(); // Refetch data when update signal comes
    });

    // Handle connection errors
    socket.on('connect_error', (err) => {
        console.error('Socket.IO: Connection Error!', err.message);
    });

    // Reload profile image if window gains focus (e.g., after editing profile)
    window.addEventListener('focus', loadProfileData);

    // Cleanup function: Disconnect socket and remove listener on component unmount
    return () => {
      console.log('Socket.IO: Disconnecting...');
      window.removeEventListener('focus', loadProfileData);
      socket.disconnect();
    };
  }, [fetchDashboardData, loadProfileData]); // Dependencies for useEffect

  // Loading state check
  if (!adminProfile || !dashboardData) {
    return <div className={styles.loading}>Loading Dashboard...</div>;
  }

  // Render the dashboard UI
  return (
    <div className={styles.dashboardContainer}>
      <Header admin={adminProfile} />

      {/* Stats Cards Grid */}
      <div className={styles.statsGrid}>
        {dashboardData.stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={cardDetails[stat.title]?.icon}
            theme={cardDetails[stat.title]?.theme}
          />
        ))}
      </div>

      {/* Chart Section */}
      <div className={styles.chartContainer}>
        {/* Pass the formatted admissionData to the chart component */}
        <StudentAdmissionChart data={dashboardData.admissionData} />
      </div>

      {/* Recent Payments Section */}
      <div className={styles.paymentsContainer}>
        {/* Pass the recentPayments data to the payments component */}
        <RecentPayments payments={dashboardData.recentPayments} />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api'; // Ensure correct path
import { io } from "socket.io-client";
import Header from '@/components/admin/Header/Header';
import StatCard from '@/components/admin/StatCard/StatCard';
import StudentAdmissionChart from '@/components/admin/StudentAdmissionChart/StudentAdmissionChart';
// --- NEW: Import the new chart component ---
import StudentClassChart from '@/components/admin/academics/StudentClassChart'; // Ensure path is correct
import RecentPayments from '@/components/admin/RecentPayments/RecentPayments';
import { MdPeople, MdSchool, MdAttachMoney, MdFamilyRestroom, MdBadge, MdClass } from 'react-icons/md';
import styles from './AdminDashboard.module.scss';
import { useAuth, User } from '../../context/AuthContext'; // Import User type

// --- TYPE DEFINITIONS ---

// For Monthly Admissions Chart
interface MonthlyAdmissionData {
  name: string; // Month Name (e.g., "Jan")
  admissions: number;
  color: string; // Dynamic color
}

// --- NEW: For Class Counts Chart ---
interface ClassCountData {
    name: string; // Class Name (e.g., "Grade-1")
    count: number;
    color: string; // Dynamic color
}

// Matches the structure sent FROM the backend
interface BackendDashboardData {
  admissionsData: { name: string; admissions: number }[]; // Backend sends name/admissions
  classCounts: { name: string; count: number }[];       // Backend sends name/count
  recentStudents: any[];
  recentTeachers: any[];
  recentParents: any[];
  recentStaff: any[];
  recentFees: { id: string; student: string; amount: string; date: string }[]; // More specific type
  totalStudents?: number;
  totalTeachers?: number;
  totalParents?: number;
  totalClasses?: number; // Maybe use classCounts.length?
  totalStaff?: number;
}

// For storing formatted data in the component's state
interface FormattedDashboardData {
  stats: { title: string; value: string }[];
  monthlyAdmissions: MonthlyAdmissionData[]; // Use updated name
  classCounts: ClassCountData[];          // Use updated name
  recentPayments: { id: string; student: string; amount: string; date: string }[];
}

// --- NEW: Define color palettes ---
const classColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#D97706']; // Example palette
const admissionColors = {
    high: '#22c55e', // Green
    medium: '#8b5cf6', // Purple
    low: '#ef4444' // Red
};
// --- END NEW ---


// Card details (Use your existing cardDetails or update colors as needed)
const cardDetails = {
  "Total Students": { icon: <MdPeople />, theme: "blue" },
  "Total Teachers": { icon: <MdSchool />, theme: "teal" },
  "Monthly Revenue": { icon: <MdAttachMoney />, theme: "green" },
  "Total Parents": { icon: <MdFamilyRestroom />, theme: "purple" },
  "Total Staff": { icon: <MdBadge />, theme: "orange" },
  "Total Classes": { icon: <MdClass />, theme: "sky" }
} as const;


// --- Helper Function to get Color based on Value ---
const getAdmissionColor = (value: number, min: number, max: number): string => {
    if (value <= 0) return '#9ca3af'; // Grey for zero or negative (if possible)
    if (max === min && value > 0) return admissionColors.medium; // If only one value > 0, use medium
    if (value === max) return admissionColors.high;
    if (value === min) return admissionColors.low;
    // Simple logic for values in between (adjust as needed)
    const mid = (max + min) / 2;
    return value >= mid ? admissionColors.medium : admissionColors.low; // Lean towards medium/low for intermediate
};
// --- END HELPER ---


const AdminDashboardPage = () => {
  // --- UPDATED: Destructure token from useAuth ---
  const { user, token } = useAuth() as { user: User | null; token: string | null; login: (token: string) => Promise<any> };
  const [dashboardData, setDashboardData] = useState<FormattedDashboardData | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  // --- UPDATED fetchDashboardData ---
  const fetchDashboardData = useCallback(async () => {
    // Ensure we have a token before fetching
    if (!token) {
        console.log("fetchDashboardData: No token found, skipping fetch.");
        return; // Exit if no token
    }
    console.log("fetchDashboardData: Fetching data...");
    try {
      // Use the api instance (ensure it's configured correctly)
      const response = await api.get<BackendDashboardData>('/admin/dashboard-data'); // No need to pass token if api instance handles it
      const data = response.data;
      console.log("fetchDashboardData: Data received from backend:", data);

      // --- Process Monthly Admissions with Dynamic Colors ---
      const monthlyDataFromApi = data.admissionsData || [];
      let coloredMonthlyData: MonthlyAdmissionData[] = [];
      if (monthlyDataFromApi.length > 0) {
          const admissionValues = monthlyDataFromApi.map(d => d.admissions).filter(v => v > 0); // Consider only > 0 for min/max
          const maxVal = admissionValues.length > 0 ? Math.max(...admissionValues) : 0;
          const minVal = admissionValues.length > 0 ? Math.min(...admissionValues) : 0;
          console.log(`Monthly Admissions Min: ${minVal}, Max: ${maxVal}`);

          coloredMonthlyData = monthlyDataFromApi.map(item => ({
              name: item.name,
              admissions: item.admissions,
              color: getAdmissionColor(item.admissions, minVal, maxVal) // Use helper function
          }));
      } else {
           console.log("fetchDashboardData: No monthly admissions data found.");
      }
      console.log("fetchDashboardData: Processed Monthly Admissions:", coloredMonthlyData);


      // --- Process Class Counts with Dynamic Colors ---
      const classDataFromApi = data.classCounts || [];
      let coloredClassData: ClassCountData[] = [];
      if (classDataFromApi.length > 0) {
          coloredClassData = classDataFromApi.map((item, index) => ({
              name: item.name,
              count: item.count,
              color: classColors[index % classColors.length] // Cycle through palette
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
        // Use length of class data for total classes
        { title: "Total Classes", value: (classDataFromApi.length || 0).toString() }
      ];

      // Set the final formatted data to state
      const formattedData: FormattedDashboardData = {
        stats: formattedStats,
        monthlyAdmissions: coloredMonthlyData, // Pass colored data
        classCounts: coloredClassData,       // Pass colored data
        recentPayments: data.recentFees || [] // Use recentFees directly
      };

      setDashboardData(formattedData);
      console.log("fetchDashboardData: Dashboard state updated.");

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Set empty state on error to prevent crashes
      setDashboardData({ stats: [], monthlyAdmissions: [], classCounts: [], recentPayments: [] });
    }
  }, [token]); // Add token as a dependency

  // --- loadProfileData (UPDATED) ---
  const loadProfileData = useCallback(() => {
    if (user) {
      let profileData: AdminProfile = {
        id: user.id,
        email: user.email,
        adminName: user.name, // Map user.name to adminName
        schoolName: user.schoolName || 'Your School', // <-- YEH LINE ADD KI GAYI HAI
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

  useEffect(() => {
    // Fetch data immediately if token exists, AuthContext effect might be slightly delayed
    if (token) {
        fetchDashboardData();
    }
    loadProfileData(); // Load profile data

    // --- Socket.IO setup ---
    // Use an environment variable for the socket URL for flexibility
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://myedupanel.onrender.com"; // Store URL in variable
    const socket = io(socketUrl);

    // --- FIX IS HERE: Removed .io.uri ---
    socket.on('connect', () => {
        console.log('Socket.IO: Connected!');
        console.log('Socket.IO: Connected to URL:', socketUrl); // Log the variable instead
    });
    // --- END FIX ---

    socket.on('updateDashboard', () => {
      console.log('Socket.IO: Update event received! Refreshing dashboard data...');
      fetchDashboardData(); // Refetch data on update event
    });
    socket.on('connect_error', (err) => console.error('Socket.IO: Connection Error!', err.message, err.cause));
    window.addEventListener('focus', loadProfileData); // Refresh profile on focus

    return () => { // Cleanup
      window.removeEventListener('focus', loadProfileData);
      socket.disconnect();
      console.log('Socket.IO: Disconnected');
    };
    // fetchDashboardData is stable due to useCallback, loadProfileData depends on user, token added
  }, [fetchDashboardData, loadProfileData, token]);

  // Loading state
  if (!adminProfile || !dashboardData) {
    return <div className={styles.loading}>Loading Dashboard...</div>;
  }

  // --- UPDATED JSX TO INCLUDE NEW CHART ---
  return (
    <div className={styles.dashboardContainer}>
      {/* adminProfile ab updated hai aur schoolName bhej raha hai */}
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
      {/* --- Charts Side-by-Side --- */}
      {/* Add a wrapper div with appropriate styling (e.g., grid or flex) */}
      <div className={styles.chartsRow}>
          {/* Container for the first chart */}
          <div className={styles.chartContainer}>
            {/* Existing chart now receives updated monthly data */}
            <StudentAdmissionChart data={dashboardData.monthlyAdmissions} />
          </div>
          {/* --- NEW: Container and Render the Class Count Chart --- */}
          <div className={styles.chartContainer}>
            <StudentClassChart data={dashboardData.classCounts} />
          </div>
          {/* --- END NEW --- */}
      </div>
      <div className={styles.paymentsContainer}>
        <RecentPayments payments={dashboardData.recentPayments} />
      </div>
    </div>
  );
  // --- END UPDATED JSX ---
};

export default AdminDashboardPage;

// --- AdminProfile (UPDATED) ---
interface AdminProfile {
  id: number;
  adminName: string;
  email: string;
  profileImageUrl: string;
  schoolName: string; // <-- YAHAN PEHLE SE ADDED HAI
}
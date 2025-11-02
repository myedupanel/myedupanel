"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/backend/utils/api'; 
import { io } from "socket.io-client";
import Header from '@/components/admin/Header/Header';
import StatCard from '@/components/admin/StatCard/StatCard';
import StudentAdmissionChart from '@/components/admin/StudentAdmissionChart/StudentAdmissionChart';
import StudentClassChart from '@/components/admin/academics/StudentClassChart'; 
import RecentPayments from '@/components/admin/RecentPayments/RecentPayments';
import { MdPeople, MdSchool, MdAttachMoney, MdFamilyRestroom, MdBadge, MdClass } from 'react-icons/md';
import styles from './AdminDashboard.module.scss';
import { useAuth, User } from '../../context/AuthContext'; 
import Link from 'next/link';

// --- TYPE DEFINITIONS ---
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

// --- NAYA ---
// Academic Year ke liye interface
interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}
// --- END NAYA ---

// --- FIX 1: Backend Interface Update ---
// (Ismein koi change nahi)
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
  stats: { title: string; value: string }[];
  monthlyAdmissions: MonthlyAdmissionData[]; 
  classCounts: ClassCountData[];          
  recentPayments: { id: string; student: string; amount: string; date: string }[];
}
// --- END TYPE DEFINITIONS ---

// ... (Color Palettes, Card details, Card Links, Helper Function mein koi change nahi) ...
const classColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#D97706'];
const admissionColors = {
    high: '#22c55e', 
    medium: '#8b5cf6', 
    low: '#ef4444' 
};
const cardDetails = {
  "Total Students": { icon: <MdPeople />, theme: "blue" },
  "Total Teachers": { icon: <MdSchool />, theme: "teal" },
  "Monthly Revenue": { icon: <MdAttachMoney />, theme: "green" },
  "Total Parents": { icon: <MdFamilyRestroom />, theme: "purple" },
  "Total Staff": { icon: <MdBadge />, theme: "orange" },
  "Total Classes": { icon: <MdClass />, theme: "sky" }
} as const;
const cardLinks: { [key: string]: string } = {
  "Total Students": "/admin/students",
  "Total Teachers": "/admin/teachers",
  "Total Staff": "/admin/staff",
  "Monthly Revenue": "/admin/fee-counter",
  "Total Parents": "/admin/parents", 
  "Total Classes": "/admin/school/classes"  
};
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
  
  // --- NAYA ---
  // Naye state academic year ke liye
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  // --- END NAYA ---


  // --- NAYA ---
  // Function jo saare academic years fetch karega
  const fetchAcademicYears = useCallback(async () => {
    if (!token) {
        console.log("fetchAcademicYears: No token, skipping.");
        return;
    }
    console.log("Fetching academic years...");
    try {
      // Yeh 'GET' route humne pehle banaya tha
      const response = await api.get('/api/school/academic-year');
      const years: AcademicYear[] = response.data;
      setAcademicYears(years);

      if (years.length > 0) {
        // Automatically current saal select karein
        const currentYear = years.find(y => y.isCurrent);
        if (currentYear) {
          setSelectedYearId(currentYear.id);
          console.log(`Current academic year set: ${currentYear.id}`);
        } else {
          // Ya fir list ka pehla saal
          setSelectedYearId(years[0].id);
          console.log(`Fallback academic year set: ${years[0].id}`);
        }
      } else {
        console.warn("Koi academic year nahi mila.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch academic years:", error);
    }
  }, [token]);
  // --- END NAYA ---


  // --- UPDATE ---
  // fetchDashboardData ko 'yearId' accept karne ke liye update kiya
  const fetchDashboardData = useCallback(async (yearId: string) => {
    if (!token) {
        console.log("fetchDashboardData: No token found, skipping fetch.");
        return; 
    }
    console.log(`fetchDashboardData: Fetching data for year ${yearId}...`);
    try {
      // --- UPDATE ---
      // API call mein 'yearId' as a query parameter bheja
      const response = await api.get<BackendDashboardData>(`/admin/dashboard-data?yearId=${yearId}`); 
      // NOTE: Aapko apne backend route '/admin/dashboard-data' ko update karna hoga
      // taaki woh 'yearId' parameter ko handle kare.
      // --- END UPDATE ---
      
      const data = response.data;
      console.log("fetchDashboardData: Data received from backend:", data);

      // ... (Aapka baaki ka data processing logic same rahega) ...
      // Process Monthly Admissions
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
      }
      
      // Process Class Counts
      const classDataFromApi = data.classCounts || [];
      let coloredClassData: ClassCountData[] = [];
      if (classDataFromApi.length > 0) {
          coloredClassData = classDataFromApi.map((item, index) => ({
              name: item.name,
              count: item.count,
              color: classColors[index % classColors.length] 
          }));
      }

      // Revenue Logic
      const revenueAmount = data.currentMonthRevenue || 0;
      const revenueMonth = data.currentMonthName || 'Monthly';
      const formattedRevenue = `₹${revenueAmount.toLocaleString('en-IN')}`;
      const revenueDisplay = revenueAmount > 0 
          ? `${formattedRevenue} (${revenueMonth})`
          : `${formattedRevenue} (No Revenue)`;

      // Format Stats
      const formattedStats = [
        { title: "Total Students", value: (data.totalStudents || 0).toString() },
        { title: "Total Teachers", value: (data.totalTeachers || 0).toString() },
        { title: "Monthly Revenue", value: revenueDisplay },
        { title: "Total Parents", value: (data.totalParents || 0).toString() },
        { title: "Total Staff", value: (data.totalStaff || 0).toString() },
        { title: "Total Classes", value: (classDataFromApi.length || 0).toString() }
      ];

      // Set state
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
    } finally {
        setIsLoading(false); // Data load hone ke baad loading false karein
    }
  }, [token]); // --- UPDATE --- token dependency rakhein, check upar hai
  // --- END fetchDashboardData Update ---

  
  // ... (loadProfileData mein koi change nahi) ...
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


  // --- UPDATE ---
  // useEffect ko do alag parts mein manage karenge
  
  // 1. Profile aur Academic Years ko load karne ke liye
  useEffect(() => {
    loadProfileData();
    if (token) {
      fetchAcademicYears(); // Pehle saal fetch karein
    }
    window.addEventListener('focus', loadProfileData); 
    
    return () => {
        window.removeEventListener('focus', loadProfileData);
    }
  }, [token, loadProfileData, fetchAcademicYears]);

  // 2. Dashboard Data aur Sockets ko manage karne ke liye
  useEffect(() => {
    // Jab selectedYearId aur token ho, tabhi data fetch karein
    if (selectedYearId && token) {
      setIsLoading(true);
      fetchDashboardData(selectedYearId);
    }

    // Socket setup
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://myedupanel.onrender.com"; 
    const socket = io(socketUrl);

    socket.on('connect', () => console.log('Socket.IO: Connected!'));
    
    // Socket update aane par data dobara fetch karein
    socket.on('updateDashboard', () => {
      console.log('Socket.IO: Update event received! Refreshing dashboard data...');
      if (selectedYearId && token) { // Check karein ki yearId abhi bhi hai
          fetchDashboardData(selectedYearId); 
      }
    });
    
    socket.on('connect_error', (err) => console.error('Socket.IO: Connection Error!', err.message));
    
    return () => { 
      socket.disconnect();
      console.log('Socket.IO: Disconnected');
    };
  }, [selectedYearId, token, fetchDashboardData]); // Yeh 'chain' hai
  // --- END UPDATE ---


  // --- UPDATE ---
  // Loading state ko behtar tareeke se handle karein
  if (!adminProfile || isLoading || !dashboardData) {
    return <div className={styles.loading}>Loading Dashboard...</div>;
  }
  // --- END UPDATE ---

  
  return (
    <div className={styles.dashboardContainer}>
      <Header admin={adminProfile} />
      
      {/* --- NAYA --- */}
      {/* Year Selector Dropdown */}
      <div className={styles.controlsContainer}>
        <div className={styles.yearSelector}>
          <label htmlFor="yearSelect">Academic Year: </label>
          <select 
            id="yearSelect"
            value={selectedYearId || ''}
            onChange={(e) => setSelectedYearId(e.target.value)}
            disabled={academicYears.length === 0 || isLoading}
          >
            {academicYears.length === 0 ? (
              <option>Loading years...</option>
            ) : (
              academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.isCurrent ? "(Current)" : ""}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
      {/* --- END NAYA --- */}
      
      <div className={styles.statsGrid}>
        {dashboardData.stats.map((stat) => {
          const linkPath = cardLinks[stat.title as keyof typeof cardLinks];
          const card = (
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={cardDetails[stat.title as keyof typeof cardDetails]?.icon}
              theme={cardDetails[stat.title as keyof typeof cardDetails]?.theme}
            />
          );

          if (linkPath) {
            return (
              <Link href={linkPath} key={stat.title} className={styles.statCardLink}>
                {card}
              </Link>
            );
          }
          return (<div key={stat.title}>{card}</div>);
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

// --- AdminProfile (No Change) ---
interface AdminProfile {
  id: number;
  adminName: string;
  email: string;
  profileImageUrl: string;
  schoolName: string; 
}
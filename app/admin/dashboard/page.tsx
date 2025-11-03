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
// --- NAYA IMPORT ---
// FIX: useSession import हटा दिया गया
// import { useSession } from '@/app/context/SessionContext';

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
  
  // FIX: useSession hook हटा दिया गया
  // const { viewingSession } = useSession(); 
  
  const [dashboardData, setDashboardData] = useState<FormattedDashboardData | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Loading state control

  // --- fetchDashboardData (NOW NON-SESSION AWARE) ---
  const fetchDashboardData = useCallback(async () => {
    if (!token) {
        throw new Error("Missing token");
    }
    
    console.log("fetchDashboardData: Fetching data...");
    
    // FIX: API call से sessionId param हटा दिया गया
    const response = await api.get<BackendDashboardData>('/admin/dashboard-data');
    
    const data = response.data;
    console.log("fetchDashboardData: Data received from backend:", data);

    // --- Processing Logic (No Change) ---
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

    const classDataFromApi = data.classCounts || [];
    let coloredClassData: ClassCountData[] = [];
    if (classDataFromApi.length > 0) {
        coloredClassData = classDataFromApi.map((item, index) => ({
            name: item.name,
            count: item.count,
            color: classColors[index % classColors.length]
        }));
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
    
    return formattedData; // Data को Promise के रूप में लौटाएं
  }, [token]); // FIX: viewingSession dependency हटा दी गई
  // --- END fetchDashboardData ---

  // --- loadProfileData (No Change) ---
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

  // --- useEffect (Fixed with Timeout) ---
  useEffect(() => {
    if (!token) {
      // FIX: Session check हटा दिया गया
      if (adminProfile && dashboardData) setIsDataLoaded(true); 
      return; 
    }
    
    const dataFetchPromise = fetchDashboardData();

    // 💡 2-सेकंड का Timeout Promise
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Dashboard Load Timeout")), 2000)
    );

    const loadData = async () => {
      try {
        // डेटा फ़ेच करने और Timeout के बीच रेस लगाएं
        const result = await Promise.race([dataFetchPromise, timeoutPromise]);
        
        // यदि डेटा पहले आता है
        setDashboardData(result as FormattedDashboardData);
        console.log("Dashboard data fetched successfully.");
        
      } catch (error) {
        // यदि Timeout जीतता है या कोई और error आता है
        console.error("Dashboard data load failed or timed out:", error);
        
        // Fallback: Empty data सेट करें ताकि UX स्टक न हो
        setDashboardData({ 
            stats: [], 
            monthlyAdmissions: [], 
            classCounts: [], 
            recentPayments: [] 
        });
      } finally {
        loadProfileData();
        setIsDataLoaded(true); // Loading state समाप्त
      }
    };
    
    loadData();

    // --- Socket.IO setup (No Change) ---
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://myedupanel.onrender.com";
    const socket = io(socketUrl);

    socket.on('updateDashboard', () => {
      // Timeout के बाद भी, अपडेट आने पर फिर से फ़ेच करने का प्रयास करें
      console.log('Socket.IO: Update event received! Retrying fetch...');
      fetchDashboardData().then(setDashboardData).catch(err => console.error("Socket fetch failed:", err));
    });
    socket.on('connect_error', (err) => console.error('Socket.IO: Connection Error!', err.message, err.cause));
    window.addEventListener('focus', loadProfileData);

    return () => {
      window.removeEventListener('focus', loadProfileData);
      socket.disconnect();
    };
  }, [fetchDashboardData, token]); // FIX: viewingSession dependency हटा दी गई


  // --- Loading state (Now checks new isDataLoaded state) ---
  if (!adminProfile || !isDataLoaded) {
    return <div className={styles.loading}>Loading Dashboard...</div>;
  }

  // --- JSX (UPDATED) ---
  // Fallback data के लिए null check
  if (!dashboardData || dashboardData.stats.length === 0) {
      return (
          <div className={styles.dashboardContainer}>
              <Header admin={adminProfile} />
              <div className={styles.emptyState}>
                  <h2>Connection Error/Timeout</h2>
                  <p>Dashboard data could not be loaded within 2 seconds. Please check your backend server connection (Render logs).</p>
              </div>
          </div>
      );
  }

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
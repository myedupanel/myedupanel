"use client"; 

// === NAYE IMPORTS ===
import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar/Sidebar'; // Path check kar lein
import styles from './layout.module.scss';
import { useAuth } from '@/app/context/AuthContext'; 
// Icons (Aapke screenshot ke hisaab se)
// --- FIX: 'FiRocket' ko 'FiZap' se badal diya ---
import { FiGrid, FiUsers, FiFileText, FiBarChart2, FiCalendar, FiClock, FiBookOpen, FiSettings, FiZap } from 'react-icons/fi'; 
import { MdDashboard, MdSchool } from 'react-icons/md'; // Aapke puraane icons

// === NAYA CONTEXT (MODAL KE LIYE) ===
interface AdminLayoutContextType {
  showUpcomingFeatureModal: () => void;
}
const AdminLayoutContext = createContext<AdminLayoutContextType | undefined>(undefined);
export const useAdminLayout = () => {
  const context = useContext(AdminLayoutContext);
  if (!context) {
    throw new Error('useAdminLayout must be used within AdminLayout');
  }
  return context;
};
// === END NAYA CONTEXT ===

// === NAYA MENU ITEMS ARRAY (Aapke screenshot + logic ke saath) ===
// Humne features ko 3 types mein baant diya hai
const menuItems = [
  // --- Free Features (Starter plan mein included) ---
  { title: 'Main Dashboard', path: '/admin/dashboard', icon: <MdDashboard />, type: 'free' },
  { title: 'School', path: '/admin/school', icon: <MdSchool />, type: 'free' },
  { title: 'Staff', path: '/admin/staff', icon: <FiUsers />, type: 'free' },
  { title: 'Manage Classes', path: '/admin/classes', icon: <FiFileText />, type: 'free' },
  // (Aap 'Students' bhi yahaan add kar sakte hain, type: 'free' ke saath)

  // --- Premium Features (Payment ke liye locked) ---
  { title: 'Fee Counter', path: '/admin/fees', icon: <FiBarChart2 />, type: 'premium' },
  
  // --- Upcoming Features (Jaldi aa rahe hain) ---
  { title: 'Attendance', path: '/admin/attendance', icon: <FiCalendar />, type: 'upcoming' },
  { title: 'Timetable', path: '/admin/timetable', icon: <FiClock />, type: 'upcoming' },
  { title: 'Timetable Settings', path: '/admin/timetable-settings', icon: <FiClock />, type: 'upcoming' },
  { title: 'Academics', path: '/admin/academics', icon: <FiBookOpen />, type: 'upcoming' },
  { title: 'Settings', path: '/admin/settings', icon: <FiSettings />, type: 'upcoming' },
] as const; // <--- === YAHI HAI FIX! ===

// =============================

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  
  // --- NAYA MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showUpcomingFeatureModal = () => setIsModalOpen(true);
  const hideModal = () => setIsModalOpen(false);
  // -------------------------

  useEffect(() => {
    if (!isLoading) {
      // --- SUPERADMIN FIX ---
      // Ab: Dono (Admin aur SuperAdmin) ko allow karega
      const isAdminOrSuperAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';

      if (!isAuthenticated) {
        router.push('/login');
      } 
      else if (!isAdminOrSuperAdmin) { 
         console.warn(`User is authenticated but role is "${user?.role}". Redirecting.`);
         router.push('/login'); 
      }
      // --- END FIX ---
    }
  }, [isLoading, isAuthenticated, router, user]);

  if (isLoading) {
    return <div className={styles.loadingState}>Loading Admin Area...</div>; 
  }

  // --- SUPERADMIN FIX ---
  const isAdminOrSuperAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
  if (!isAuthenticated || !isAdminOrSuperAdmin) {
     return <div className={styles.loadingState}>Redirecting...</div>;
  }
  
  return (
    // --- NAYA CONTEXT PROVIDER ---
    <AdminLayoutContext.Provider value={{ showUpcomingFeatureModal }}>
      <div className={styles.container}>
        {/* 'menuItems' ko prop ke through bhej rahe hain */}
        <Sidebar menuItems={[...menuItems]} />
        <main className={styles.content}>
          {children}
        </main>
      </div>

      {/* === YEH HAI AAPKA NAYA "UPCOMING FEATURE" MODAL === */}
      {isModalOpen && (
        <div className={styles.upcomingModalOverlay} onClick={hideModal}>
          <div className={styles.upcomingModalBox} onClick={(e) => e.stopPropagation()}>
            <button onClick={hideModal} className={styles.closeButton}>&times;</button>
            <div className={styles.iconWrapper}>
              {/* --- FIX: 'FiZap' icon istemaal kiya --- */}
              <FiZap />
            </div>
            <h3>Upcoming Feature!</h3>
            <p>This feature is under construction and will be available soon.</p>
          </div>
        </div>
      )}
      {/* === MODAL ENDS HERE === */}

    </AdminLayoutContext.Provider>
    // --- END CONTEXT PROVIDER ---
  );
}
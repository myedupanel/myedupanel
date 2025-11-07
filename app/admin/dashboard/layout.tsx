"use client";

import React, { useEffect } from 'react'; // useState, createContext, useContext hata diye
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar/Sidebar'; // Path check kar lein
import styles from './layout.module.scss';
import { useAuth } from '@/app/context/AuthContext';
// Naye Provider ko import karein
import { AdminLayoutProvider } from '@/app/context/AdminLayoutContext'; 

// Icons
import { FiUsers, FiFileText, FiBarChart2, FiCalendar, FiClock, FiBookOpen, FiSettings } from 'react-icons/fi';
import { MdDashboard, MdSchool } from 'react-icons/md';

// === FIX: 'title' ko 'name' se badal diya ===
const menuItems = [
  { name: 'Main Dashboard', path: '/admin/dashboard', icon: <MdDashboard />, type: 'free' },
  { name: 'School', path: '/admin/school', icon: <MdSchool />, type: 'free' },
  { name: 'Staff', path: '/admin/staff', icon: <FiUsers />, type: 'free' },
  { name: 'Manage Classes', path: '/admin/classes', icon: <FiFileText />, type: 'free' },
  { name: 'Fee Counter', path: '/admin/fees', icon: <FiBarChart2 />, type: 'premium' },
  { name: 'Attendance', path: '/admin/attendance', icon: <FiCalendar />, type: 'upcoming' },
  { name: 'Timetable', path: '/admin/timetable', icon: <FiClock />, type: 'upcoming' },
  { name: 'Timetable Settings', path: '/admin/timetable-settings', icon: <FiClock />, type: 'upcoming' },
  { name: 'Academics', path: '/admin/academics', icon: <FiBookOpen />, type: 'upcoming' },
  { name: 'Settings', path: '/admin/settings', icon: <FiSettings />, type: 'upcoming' },
] as const;
// ===========================================

// === 'useAdminLayout' aur Context yahaan se hata diya gaya hai ===

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  
  // --- Modal state yahaan se hata diya gaya hai ---

  useEffect(() => {
    if (!isLoading) {
      const isAdminOrSuperAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';

      if (!isAuthenticated) {
        router.push('/login');
      } 
      else if (!isAdminOrSuperAdmin) { 
         console.warn(`User is authenticated but role is "${user?.role}". Redirecting.`);
         router.push('/login'); 
      }
    }
  }, [isLoading, isAuthenticated, router, user]);

  if (isLoading) {
    return <div className={styles.loadingState}>Loading Admin Area...</div>; 
  }

  const isAdminOrSuperAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
  if (!isAuthenticated || !isAdminOrSuperAdmin) {
     return <div className={styles.loadingState}>Redirecting...</div>;
  }
  
  return (
    // --- NAYA PROVIDER yahaan wrap karega ---
    <AdminLayoutProvider>
      <div className={styles.container}>
        {/* Ab yeh 'name' property ke saath pass hoga aur error nahi aayega */}
        <Sidebar menuItems={[...menuItems]} />
        <main className={styles.content}>
          {children}
        </main>
      </div>
      {/* Modal ab AdminLayoutProvider ke andar chala gaya hai */}
    </AdminLayoutProvider>
  );
}
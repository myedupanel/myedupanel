"use client";
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // usePathname import kiya
import Sidebar, { NavItem } from '@/components/layout/Sidebar/Sidebar'; // NavItem interface bhi import kiya
import styles from './layout.module.scss';
import { useAuth } from '@/app/context/AuthContext';
import { AdminLayoutProvider } from '@/app/context/AdminLayoutContext'; 
// Icons for both menus
import { 
  MdGridView, MdSchool, MdPublic, MdAttachMoney, MdPeople, 
  MdFamilyRestroom, MdBadge, MdClass, MdEventAvailable, 
  MdSchedule, MdSettings, MdAssessment 
} from 'react-icons/md';

// === MENU 1: DASHBOARD MAIN MENU (Chota Menu) ===
const mainMenuItems: NavItem[] = [
  { 
    name: 'Main Dashboard', 
    path: '/admin/dashboard', 
    icon: <MdGridView style={{ color: '#3b82f6' }} />, 
    type: 'free' 
  },
  { 
    name: 'School', 
    path: '/admin/school', 
    icon: <MdSchool style={{ color: '#8b5cf6' }} />, 
    type: 'free' 
  },
  { 
    name: 'Gov Schemes', 
    path: '/admin/schemes',
    icon: <MdPublic style={{ color: '#10b981' }} />, 
    type: 'upcoming' 
  },
  { 
    name: 'Expense', 
    path: '/admin/expense', 
    icon: <MdAttachMoney style={{ color: '#f97316' }} />, 
    type: 'upcoming' 
  },
];

// === MENU 2: SCHOOL CONTROL CENTER MENU (Bada Menu + Locking) ===
const schoolMenuItems: NavItem[] = [
    // Free Features
    { name: 'Students', path: '/admin/students', icon: <MdPeople />, type: 'free' },
    { name: 'Teachers', path: '/admin/teachers', icon: <MdSchool />, type: 'free' },
    { name: 'Parents', path: '/admin/parents', icon: <MdFamilyRestroom />, type: 'free' },
    { name: 'Staff', path: '/admin/staff', icon: <MdBadge />, type: 'free' },
    { name: 'Manage Classes', path: '/admin/school/classes', icon: <MdClass />, type: 'free' },
    { name: 'Settings', path: '/admin/settings', icon: <MdSettings />, type: 'free' },
    
    // --- LOCKED FEATURES ---
    // Premium Lock: User को PRO Tag दिखेगा (अगर useAuth में plan/trial logic है)
    { name: 'Fee Counter', path: '/admin/fee-counter', icon: <MdAttachMoney />, type: 'premium' }, 
    
    // Upcoming Lock: User को 'SOON' Tag दिखेगा और Modal open होगा 
    { name: 'Attendance', path: '/admin/attendance', icon: <MdEventAvailable />, type: 'upcoming' }, 
    { name: 'Timetable', path: '/admin/timetable', icon: <MdSchedule />, type: 'upcoming' },
    { name: 'Academics', path: '/admin/academics', icon: <MdAssessment />, type: 'upcoming' }, 
];


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Current Pathname

  // Auth and Redirect Logic (Same as before)
  useEffect(() => {
    if (!isLoading) {
      const isAdminOrSuperAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
      if (!isAuthenticated) { router.push('/login'); } 
      else if (!isAdminOrSuperAdmin) { router.push('/login'); }
    }
  }, [isLoading, isAuthenticated, router, user]);

  if (isLoading || !user) {
    return <div className={styles.loadingState}>Loading Admin Area...</div>; 
  }

  // === DYNAMIC MENU LOGIC ===
  // Decide karta hai ki kaunsa menu dikhana hai:
  // Agar path '/admin/school/' या School-related किसी भी पेज से शुरू हो रहा है,
  // तो schoolMenuItems दिखाओ, वरना mainMenuItems.
  const isSchoolFeatureRoute = pathname.startsWith('/admin/school') || 
                               pathname.startsWith('/admin/students') || 
                               pathname.startsWith('/admin/teachers') || 
                               pathname.startsWith('/admin/parents') || 
                               pathname.startsWith('/admin/staff');

  const currentMenuItems = isSchoolFeatureRoute
      ? schoolMenuItems
      : mainMenuItems;
  // ==========================
  
  return (
    <AdminLayoutProvider>
      <div className={styles.container}>
        {/* Sidebar को dynamic menu items pass kiye */}
        <Sidebar menuItems={currentMenuItems} /> 
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </AdminLayoutProvider>
  );
}
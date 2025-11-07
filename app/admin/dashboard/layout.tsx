"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar/Sidebar'; 
import styles from './layout.module.scss';
import { useAuth } from '@/app/context/AuthContext';
import { AdminLayoutProvider } from '@/app/context/AdminLayoutContext'; 

// === YEH HAIN AAPKE NAYE ICONS ===
import { MdGridView, MdSchool } from 'react-icons/md';
import { FaLandmark } from 'react-icons/fa';
import { GiReceiveMoney } from 'react-icons/gi';

// === YEH HAI AAPKA NAYA DASHBOARD MENU ===
const mainMenuItems = [
  { 
    name: 'Main Dashboard', 
    path: '/admin/dashboard', 
    icon: <MdGridView style={{ color: '#3b82f6' }} />, // Blue
    type: 'free' 
  },
  { 
    name: 'School', 
    path: '/admin/school', 
    icon: <MdSchool style={{ color: '#8b5cf6' }} />, // Purple
    type: 'free' 
  },
  { 
    name: 'Gov Schemes', 
    path: '/admin/schemes', // Path kuch bhi ho sakta hai, yeh locked rahega
    icon: <FaLandmark style={{ color: '#10b981' }} />, // Green
    type: 'upcoming' // Admin ke liye locked
  },
  { 
    name: 'Expense', 
    path: '/admin/expense', // Path kuch bhi ho sakta hai, yeh locked rahega
    icon: <GiReceiveMoney style={{ color: '#f97316' }} />, // Orange
    type: 'upcoming' // Admin ke liye locked
  },
] as const;
// ===================================

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

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
    <AdminLayoutProvider>
      <div className={styles.container}>
        {/* Sidebar ko ab dashboard waale items bhej rahe hain */}
        <Sidebar menuItems={[...mainMenuItems]} />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </AdminLayoutProvider>
  );
}
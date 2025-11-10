"use client";
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import Sidebar from '@/components/layout/Sidebar/Sidebar'; 
import styles from './layout.module.scss';
import sidebarStyles from '@/components/layout/Sidebar/Sidebar.module.scss'; 
import { useAuth } from '@/app/context/AuthContext';
import { AdminLayoutProvider, useAdminLayout } from '@/app/context/AdminLayoutContext';

// --- AdminContent Component ---
const AdminContent = ({ children }: { children: React.ReactNode }) => {
  const { isSidebarOpen, toggleSidebar } = useAdminLayout();
  const pathname = usePathname(); 
  
  // FIX: Conditional Rendering
  const isSchoolOrFeeRoute = 
        pathname.startsWith('/admin/school') ||
        pathname.startsWith('/admin/students') || 
        pathname.startsWith('/admin/teachers') ||
        pathname.startsWith('/admin/parents') ||
        pathname.startsWith('/admin/staff') ||
        pathname.startsWith('/admin/settings') ||
        pathname.startsWith('/admin/attendance') ||
        pathname.startsWith('/admin/academics') ||
        pathname.startsWith('/admin/timetable') ||
        pathname.startsWith('/admin/fee-counter');
                        
  const shouldRenderMainSidebar = !isSchoolOrFeeRoute;

  return (
    <div className={styles.container}>
      {/* 1. Sidebar */}
      {shouldRenderMainSidebar && <Sidebar />} 
      
      {/* 2. Mobile Overlay */}
      {isSidebarOpen && <div className={sidebarStyles.sidebarOverlay} onClick={toggleSidebar} />}
      
      {/* 3. Content Area */}
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
};
// --- END AdminContent Component ---


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Auth Logic (Same)
    if (!isLoading) {
      const isAdminOrSuperAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
      if (!isAuthenticated) { router.push('/login'); } 
      else if (!isAdminOrSuperAdmin) { router.push('/login'); }
    }
  }, [isLoading, isAuthenticated, router, user]);

  if (isLoading || !user) {
    return <div className={styles.loadingState}>Loading Admin Area...</div>; 
  }

  const isAdminOrSuperAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';
  if (!isAuthenticated || !isAdminOrSuperAdmin) {
     return <div className={styles.loadingState}>Redirecting...</div>;
  }
  
  return (
    <AdminLayoutProvider>
      <AdminContent>{children}</AdminContent>
    </AdminLayoutProvider>
  );
}
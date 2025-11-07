// File: app/admin/layout.tsx (CLEANED UP)
"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar/Sidebar'; // Ab isse NavItem ya menuItems ki zarurat nahi
import styles from './layout.module.scss';
import { useAuth } from '@/app/context/AuthContext';
import { AdminLayoutProvider } from '@/app/context/AdminLayoutContext'; 

// NOTE: Ab yahaan Main/School menu arrays ki zaroorat nahi hai.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Auth Logic (Remains the same)
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

  const isAdminOrSuperAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';
  if (!isAuthenticated || !isAdminOrSuperAdmin) {
     return <div className={styles.loadingState}>Redirecting...</div>;
  }
  
  return (
    <AdminLayoutProvider>
      <div className={styles.container}>
        {/* FIX: Sidebar ko ab koi prop nahi chahiye */}
        <Sidebar /> 
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </AdminLayoutProvider>
  );
}
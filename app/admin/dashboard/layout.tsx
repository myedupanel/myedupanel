// File: app/admin/layout.tsx (FINAL CLEANED UP & IMPORT CHECKED)
"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar/Sidebar'; 
import styles from './layout.module.scss';
import { useAuth } from '@/app/context/AuthContext';
// FIX: AdminLayoutProvider को सही path से इंपोर्ट किया गया
import { AdminLayoutProvider } from '@/app/context/AdminLayoutContext'; 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Auth Logic (Remains the same)
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
    // AdminLayoutProvider का उपयोग किया गया
    <AdminLayoutProvider>
      <div className={styles.container}>
        <Sidebar /> 
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </AdminLayoutProvider>
  );
}
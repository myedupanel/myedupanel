// File: app/admin/layout.tsx (CLEANED UP - FINAL)
"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar/Sidebar'; // Sidebar ab prop nahi lega
import styles from './layout.module.scss';
import { useAuth } from '@/app/context/AuthContext';
import { AdminLayoutProvider } from '@/app/context/AdminLayoutContext'; 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Auth Logic (Remains the same)

  if (isLoading || !user) {
    return <div className={styles.loadingState}>Loading Admin Area...</div>; 
  }

  const isAdminOrSuperAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';
  if (!isAuthenticated || !isAdminOrSuperAdmin) {
     return <div className={styles.loadingState}>Redirecting...</div>;
  }
  
  return (
    // FIX: AdminLayoutProvider aur AuthProvider Sidebar ke upar hona chahiye
    <AdminLayoutProvider>
      <div className={styles.container}>
        {/* FIX: Sidebar ko koi prop nahi chahiye */}
        <Sidebar /> 
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </AdminLayoutProvider>
  );
}
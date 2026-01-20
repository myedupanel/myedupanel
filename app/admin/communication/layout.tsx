"use client";

import React, { useEffect } from 'react';
import styles from './CommunicationLayout.module.scss';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import CommunicationSidebar from './CommunicationSidebar';

// Layout for the communication section
export default function CommunicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Check if user has premium access hddgfg iygyfgysd
  useEffect(() => {
    if (!isLoading && user) {
      // Logic: Agar plan free hai (aur demo mode nahi hai), to upgrade page par bhej do
      // Note: Maine yahan user?.role check nahi lagaya, bas plan check kiya hai jaisa aapne diya tha
      if (user.plan === 'free') {
        router.push('/upgrade');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        {/* Spinner style agar CSS me defined hai to thik hai, nahi to simple text dikhega */}
        <div className={styles.spinner}></div>
        <p>Loading communication hub...</p>
      </div>
    );
  }

  // Agar user free plan wala hai, to content mat dikhao (redirect hone ka wait karo)
  if (user?.plan === 'free') {
    return null; 
  }

  return (
    <div className={styles.communicationLayout}>
      <CommunicationSidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
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

  // No premium access check - all users can access communication hub
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading communication hub...</p>
      </div>
    );
  }

  // Allow all users to access the communication hub
  if (!user) {
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
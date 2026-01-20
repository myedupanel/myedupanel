import React from 'react';
import styles from './CommunicationLayout.module.scss';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Layout for the communication section
export default function CommunicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Check if user has premium access
  useEffect(() => {
    if (!isLoading && user) {
      if (user.plan === 'free') {
        router.push('/upgrade');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading communication hub...</p>
      </div>
    );
  }

  if (user?.plan === 'free') {
    return null; // Redirect effect will handle this in useEffect
  }

  return (
    <div className={styles.communicationLayout}>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
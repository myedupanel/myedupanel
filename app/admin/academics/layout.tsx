import React from 'react';
import AcademicsSidebar from '@/components/admin/AcademicsSidebar/AcademicsSidebar';
import styles from './AcademicsLayout.module.scss';

export default function AcademicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.academicsLayoutContainer}>
      <AcademicsSidebar />
      <main className={styles.academicsMainContent}>
        {children}
      </main>
    </div>
  );
}

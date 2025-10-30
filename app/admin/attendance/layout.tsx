import React from 'react';
import AttendanceSidebar from '@/components/admin/AttendanceSidebar/AttendanceSidebar';
import styles from './AttendanceLayout.module.scss';

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <AttendanceSidebar />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
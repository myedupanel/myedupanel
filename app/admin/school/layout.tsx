// File: app/admin/school/layout.tsx

import React from 'react';
// मौजूदा AdminLayout के styles को import करें (जहां .container और .content define हैं)
import styles from './SchoolPage.module.scss';

// SchoolSidebar कंपोनेंट को import करें
import SchoolSidebar from '@/app/admin/school/SchoolSidebar'; 

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    // हम वही flex container structure दोहरा रहे हैं
    <div className={styles.container}>
      
      {/* 1. नया School Sidebar (position: fixed के साथ) */}
      <SchoolSidebar /> 
      
      {/* 2. Content Area (यह styles.content से 260px margin-left लेगा) */}
      <main className={styles.content}>
        {children}
      </main>
      
    </div>
  );
}
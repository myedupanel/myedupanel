// File: app/admin/fee-counter/FeesSidebar.tsx

"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Hum aapke purane sidebar ki styling hi yahan istemal karenge
import styles from '@/components/layout/Sidebar/Sidebar.module.scss'; // Assuming this module defines styles
import { 
  MdDashboard, 
  MdReceipt,
  MdFileUpload,
  MdPayment,
  MdArrowBack,
  MdListAlt,
  MdHistory, 
} from 'react-icons/md';

// === PREMIUM COLOR PALETTE (Finance/Management Theme) ===
const Colors = {
    Dashboard: '#6366F1',   // Indigo/Primary
    AssignFee: '#F59E0B',   // Amber/Gold (Action)
    Templates: '#0EA5E9',   // Sky Blue (Organization)
    FeeRecords: '#10B981',  // Emerald Green (Data/History)
    ImportExport: '#64748B',// Slate Gray (Utility)
    Collection: '#EF4444',  // Vibrant Red (Transaction/Critical)
    GoBack: '#5B21B6',      // Dark Violet (System/Navigation)
};

const feeMenuItems = [
  {
    title: 'Fee Dashboard',
    path: '/admin/fee-counter/fee-dashboard',
    icon: <MdDashboard style={{ color: Colors.Dashboard }} />,
  },
  {
    title: 'Assign Fee',
    path: '/admin/fee-counter/assign',
    icon: <MdReceipt style={{ color: Colors.AssignFee }} />,
  },
  {
    title: 'Fee Templates',
    path: '/admin/fee-counter/templates',
    icon: <MdListAlt style={{ color: Colors.Templates }} />,
  },
  
  {
    title: 'Fee Records',
    path: '/admin/fee-counter/fee-records',
    icon: <MdHistory style={{ color: Colors.FeeRecords }} />,
  },

  {
    title: 'Import/Export',
    path: '/admin/fee-counter/fee-import-export',
    icon: <MdFileUpload style={{ color: Colors.ImportExport }} />,
  },
  {
    title: 'Fee Collection',
    path: '/admin/fee-counter/collection',
    icon: <MdPayment style={{ color: Colors.Collection }} />,
  },
  {
    title: 'Go to Dashboard',
    path: '/admin/school', 
    icon: <MdArrowBack style={{ color: Colors.GoBack }} />,
    isExternal: true, 
  },
];

const FeesSidebar = () => {
  const pathname = usePathname();

  // Note: Yahan styles.module.scss se import kiye gaye classes ka upyog kiya gaya hai
  // Agar aapke class names global hain, toh aapko 'styles.' prefix hatana hoga.
  return (
    <aside className={styles.sidebarContainer}> 
      <div className={styles.logoSection}>
        <Link href="/admin/fee-counter/fee-dashboard">
          <h2>Fees Counter</h2>
        </Link>
      </div>
      <nav className={styles.menuSection}>
        <ul>
          {feeMenuItems.map((item) => (
            <li
              key={item.path}
              className={`${styles.menuItem} ${pathname.startsWith(item.path) && !item.isExternal ? styles.active : ''}`} 
            >
              <Link href={item.path}>
                <span className={styles.icon}>
                  {item.icon}
                </span>
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Go to Dashboard button ko footer ki tarah render karte hain */}
      <footer className={`${styles.sidebarFooter} ${styles.noBorder}`}> 
        {/* External item ko footer button ki tarah render kiya gaya hai */}
        <Link 
            href="/admin/school" 
            className={`${styles.footerButton} ${styles.backButton}`}
        >
            {feeMenuItems[feeMenuItems.length - 1].icon}
            <span>Go to School Dashboard</span>
        </Link>
      </footer>
    </aside>
  );
};

export default FeesSidebar;
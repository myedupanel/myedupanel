// File: app/admin/communication/CommunicationSidebar.tsx

"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '@/components/layout/Sidebar/Sidebar.module.scss'; 
import { useAuth } from '@/app/context/AuthContext'; 

import { 
  MdMail, 
  MdArrowBack,
  MdDashboard,
  MdNotifications
} from 'react-icons/md'; 

// NavItem Interface
export interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  type: 'free' | 'premium' | 'upcoming'; 
}

// Professional Color Palette
const Colors = {
  CommunicationHub: '#6366F1', 
  FeeReminders: '#F59E0B',      
  AttendanceAlerts: '#EF4444',      
  TeacherParentChat: '#10B981',        
  GoBack: '#64748B',
  Dashboard: '#8B5CF6'
};

// Communication Menu Items
const communicationMenuItems: NavItem[] = [
  { name: 'Communication Hub', path: '/admin/communication', icon: <MdNotifications style={{ color: Colors.CommunicationHub }} />, type: 'premium' },
  { name: 'Fee Reminders', path: '/admin/communication#fee-reminders', icon: <MdMail style={{ color: Colors.FeeReminders }} />, type: 'premium' },
  { name: 'Attendance Alerts', path: '/admin/communication#attendance-alerts', icon: <MdNotifications style={{ color: Colors.AttendanceAlerts }} />, type: 'premium' },
  { name: 'Teacher-Parent Chat', path: '/admin/communication#teacher-parent-chat', icon: <MdMail style={{ color: Colors.TeacherParentChat }} />, type: 'premium' },
];

const CommunicationSidebar = () => {
    const pathname = usePathname();
    const { user } = useAuth(); 

    const isSuperAdmin = user?.role === 'SuperAdmin';

    return (
        <aside className={styles.sidebarContainer}>
            
            <div className={styles.logoSection}>
                <Link href="/admin/communication">
                    <h2>Communications</h2>
                </Link>
            </div>

            <nav className={styles.menuSection}>
                <ul className={styles.menuList}>
                    {communicationMenuItems.map((item) => { 
                        const isActive = item.path === '/admin/communication' 
                            ? pathname === item.path 
                            : pathname.startsWith(item.path); 

                        return (
                            <li 
                                key={item.path} 
                                className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
                            >
                                <Link href={item.path}> 
                                    <span className={styles.icon}>{item.icon}</span>
                                    <span>{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            
            {/* FOOTER: Back Buttons */}
            <footer className={`${styles.sidebarFooter} ${styles.noBorder}`} style={{ borderTop: 'none' }}>
                <Link href="/admin/school" className={`${styles.footerButton} ${styles.backButton}`}>
                    <MdArrowBack />
                    <span>Go to School Dashboard</span>
                </Link>
                <Link href="/admin/dashboard" className={`${styles.footerButton} ${styles.backButton}`}>
                    <MdDashboard />
                    <span>Go to Main Dashboard</span>
                </Link>
            </footer>

        </aside>
    );
};

export default CommunicationSidebar;
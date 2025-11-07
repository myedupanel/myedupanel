// File: app/admin/school/SchoolSidebar.tsx (FINAL WITH PREMIUM ICONS)

"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '@/components/layout/Sidebar/Sidebar.module.scss'; 

import { 
  MdPeople, MdSchool, MdFamilyRestroom, MdBadge, MdClass, MdSettings, MdAttachMoney, 
  MdEventAvailable, MdSchedule, MdAssessment, MdArrowBack 
} from 'react-icons/md'; 

// --- NavItem Interface (Consistency ke liye) ---
export interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  type: 'free' | 'premium' | 'upcoming';
}

// --- School Control Center Menu Items (Updated with Premium Colors) ---
const schoolMenuItems: NavItem[] = [
    // Control Center - Main
    { name: 'Control Center', path: '/admin/school', icon: <MdSchool style={{ color: '#8b5cf6' }} />, type: 'free' },
    // Core Free Features - Unique Colors
    { name: 'Students', path: '/admin/students', icon: <MdPeople style={{ color: '#3B82F6' }} />, type: 'free' },
    { name: 'Teachers', path: '/admin/teachers', icon: <MdSchool style={{ color: '#10B981' }} />, type: 'free' },
    { name: 'Parents', path: '/admin/parents', icon: <MdFamilyRestroom style={{ color: '#F59E0B' }} />, type: 'free' },
    { name: 'Staff', path: '/admin/staff', icon: <MdBadge style={{ color: '#9333EA' }} />, type: 'free' },
    { name: 'Manage Classes', path: '/admin/school/classes', icon: <MdClass style={{ color: '#EC4899' }} />, type: 'free' },
    { name: 'Settings', path: '/admin/settings', icon: <MdSettings style={{ color: '#6B7280' }} />, type: 'free' },
    
    // Premium / Upcoming Features - Consistent Themed Colors
    { name: 'Fee Counter', path: '/admin/fee-counter', icon: <MdAttachMoney style={{ color: '#F59E0B' }} />, type: 'premium' }, 
    { name: 'Attendance', path: '/admin/attendance', icon: <MdEventAvailable style={{ color: '#10B981' }} />, type: 'upcoming' }, 
    { name: 'Timetable', path: '/admin/timetable', icon: <MdSchedule style={{ color: '#6366F1' }} />, type: 'upcoming' },
    { name: 'Academics', path: '/admin/academics', icon: <MdAssessment style={{ color: '#EF4444' }} />, type: 'upcoming' }, 
];
// ---

const SchoolSidebar = () => {
    const pathname = usePathname();
    
    const getTagClass = (type: NavItem['type']) => {
        if (type === 'premium') return styles.premium;
        if (type === 'upcoming') return styles.upcoming;
        return '';
    };

    return (
        <aside className={styles.sidebarContainer}>
            
            <div className={styles.logoSection}>
                <Link href="/admin/school">
                    <h2>School Center</h2>
                </Link>
            </div>

            <nav className={styles.menuSection}>
                <ul className={styles.menuList}>
                    {schoolMenuItems.map((item) => { 
                        const isActive = item.path === '/admin/school' 
                            ? pathname === item.path 
                            : pathname.startsWith(item.path); 

                        return (
                            <li 
                                key={item.path} 
                                className={`${styles.menuItem} ${isActive ? styles.active : ''} ${getTagClass(item.type)}`}
                            >
                                <Link href={item.path}>
                                    <span className={styles.icon}>{item.icon}</span>
                                    <span>{item.name}</span>
                                    {/* === TAGS === */}
                                    {item.type === 'premium' && (<span className={styles.proTag}>PRO</span>)}
                                    {item.type === 'upcoming' && (<span className={styles.upcomingTag}>SOON</span>)}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            
            {/* FOOTER: No Border Class Add Kiya Tha */}
            <footer className={`${styles.sidebarFooter} ${styles.noBorder}`}> 
                <Link href="/admin/dashboard" className={`${styles.footerButton} ${styles.backButton}`}>
                    <MdArrowBack />
                    <span>Go to Main Dashboard</span>
                </Link>
            </footer>

        </aside>
    );
};

export default SchoolSidebar;
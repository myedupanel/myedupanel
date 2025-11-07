// File: app/admin/school/SchoolSidebar.tsx
"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// FIX: Sidebar के styles को import करें ताकि visual consistency बनी रहे
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

// --- School Control Center Menu Items ---
const schoolMenuItems: NavItem[] = [
    { name: 'Control Center', path: '/admin/school', icon: <MdSchool />, type: 'free' },
    { name: 'Students', path: '/admin/students', icon: <MdPeople />, type: 'free' },
    { name: 'Teachers', path: '/admin/teachers', icon: <MdSchool />, type: 'free' },
    { name: 'Parents', path: '/admin/parents', icon: <MdFamilyRestroom />, type: 'free' },
    { name: 'Staff', path: '/admin/staff', icon: <MdBadge />, type: 'free' },
    { name: 'Manage Classes', path: '/admin/school/classes', icon: <MdClass />, type: 'free' },
    { name: 'Settings', path: '/admin/settings', icon: <MdSettings />, type: 'free' },
    { name: 'Fee Counter', path: '/admin/fee-counter', icon: <MdAttachMoney />, type: 'premium' }, 
    { name: 'Attendance', path: '/admin/attendance', icon: <MdEventAvailable />, type: 'upcoming' }, 
    { name: 'Timetable', path: '/admin/timetable', icon: <MdSchedule />, type: 'upcoming' },
    { name: 'Academics', path: '/admin/academics', icon: <MdAssessment />, type: 'upcoming' }, 
];
// ---

const SchoolSidebar = () => {
    const pathname = usePathname();
    
    // Simple lock/tag logic for display (no modal function needed)
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
                        // Active state check: current path, या उसका child path active हो
                        const isActive = item.path === '/admin/school' 
                            ? pathname === item.path // 'Control Center' के लिए exact match
                            : pathname.startsWith(item.path); // बाकी sections के लिए startswith check

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
            
            {/* === FOOTER: Main Dashboard पर वापस जाने का लिंक === */}
            <footer className={styles.sidebarFooter}>
                <Link href="/admin/dashboard" className={`${styles.footerButton}`}>
                    <MdArrowBack />
                    <span>Go to Main Dashboard</span>
                </Link>
            </footer>

        </aside>
    );
};

export default SchoolSidebar;
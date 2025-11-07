// File: app/admin/school/SchoolSidebar.tsx

"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// FIX 1: Auth और AdminLayout Context को import करें
import { useAuth } from '@/app/context/AuthContext'; 
import { useAdminLayout } from '@/app/context/AdminLayoutContext'; 

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

// --- School Control Center Menu Items (Updated for Logic) ---
const schoolMenuItems: NavItem[] = [
    { name: 'Control Center', path: '/admin/school', icon: <MdSchool style={{ color: '#8b5cf6' }} />, type: 'free' },
    { name: 'Students', path: '/admin/students', icon: <MdPeople style={{ color: '#3B82F6' }} />, type: 'free' },
    { name: 'Teachers', path: '/admin/teachers', icon: <MdSchool style={{ color: '#10B981' }} />, type: 'free' },
    { name: 'Parents', path: '/admin/parents', icon: <MdFamilyRestroom style={{ color: '#F59E0B' }} />, type: 'free' },
    { name: 'Staff', path: '/admin/staff', icon: <MdBadge style={{ color: '#9333EA' }} />, type: 'free' },
    { name: 'Manage Classes', path: '/admin/school/classes', icon: <MdClass style={{ color: '#EC4899' }} />, type: 'free' },
    
    // FIX 2: Settings को 'upcoming' किया
    { name: 'Settings', path: '/admin/settings', icon: <MdSettings style={{ color: '#6B7280' }} />, type: 'upcoming' },
    
    // FIX 3: Fee Counter को 'free' किया (Admins को access देने के लिए)
    { name: 'Fee Counter', path: '/admin/fee-counter', icon: <MdAttachMoney style={{ color: '#F59E0B' }} />, type: 'free' }, 
    
    // FIX 4: Upcoming features (Modal logic use करेंगे)
    { name: 'Attendance', path: '/admin/attendance', icon: <MdEventAvailable style={{ color: '#10B981' }} />, type: 'upcoming' }, 
    { name: 'Timetable', path: '/admin/timetable', icon: <MdSchedule style={{ color: '#6366F1' }} />, type: 'upcoming' },
    { name: 'Academics', path: '/admin/academics', icon: <MdAssessment style={{ color: '#EF4444' }} />, type: 'upcoming' }, 
];
// ---

const SchoolSidebar = () => {
    const pathname = usePathname();
    // FIX 5: Context hooks का उपयोग
    const { user } = useAuth();
    const { showUpcomingFeatureModal } = useAdminLayout();
    const isSuperAdmin = user?.role === 'SuperAdmin';
    
    // यह फंक्शन तय करता है कि Admins के लिए लिंक कैसा काम करेगा
    const getLinkProps = (item: NavItem) => {
        // SuperAdmin को सब ओपन चाहिए, कोई टैग नहीं
        if (isSuperAdmin) {
            return { href: item.path, onClick: undefined, className: '' };
        }
        
        // Admins के लिए 'upcoming' और 'premium' (अगर कोई होता) फीचर्स लॉक होंगे
        if (item.type === 'upcoming') {
            return {
                href: '#', // Prevent default navigation
                onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    showUpcomingFeatureModal(); // Professional popup
                },
                className: styles.upcoming // Grey out the button
            };
        }
        
        // Free/unlocked items (Fee Counter अब इसमें शामिल है)
        return { href: item.path, onClick: undefined, className: '' };
    };

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
                        const linkProps = getLinkProps(item); // Link props calculate किए
                        
                        const isActive = item.path === '/admin/school' 
                            ? pathname === item.path 
                            : pathname.startsWith(item.path); 

                        return (
                            <li 
                                key={item.path} 
                                className={`${styles.menuItem} ${isActive ? styles.active : ''} ${linkProps.className}`}
                            >
                                <Link href={linkProps.href} onClick={linkProps.onClick}>
                                    <span className={styles.icon}>{item.icon}</span>
                                    <span>{item.name}</span>
                                    {/* FIX 6: Tags सिर्फ तभी दिखाएं जब SuperAdmin ना हो */}
                                    {(item.type === 'premium' && !isSuperAdmin) && (<span className={styles.proTag}>PRO</span>)}
                                    {(item.type === 'upcoming' && !isSuperAdmin) && (<span className={styles.upcomingTag}>SOON</span>)}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            
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
"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// CRITICAL FIX: Hook को लेआउट से हटाकर context फ़ाइल से import करें
import { useSchoolLayout } from '@/app/context/SchoolLayoutContext'; 
import styles from '@/components/layout/Sidebar/Sidebar.module.scss'; 
import { useAuth } from '@/app/context/AuthContext';
import { useUpcomingFeature } from '@/app/context/UpcomingFeatureContext';

import { 
  MdPeople, MdSchool, MdFamilyRestroom, MdBadge, MdClass, MdSettings, MdAttachMoney, 
  MdEventAvailable, MdSchedule, MdAssessment, MdArrowBack, MdBolt 
} from 'react-icons/md'; 

// --- NavItem Interface (Same) ---
export interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  type: 'free' | 'starter' | 'locked'; 
}

// --- RESTORED: Professional Premium Color Palette (Same) ---
const Colors = {
    ControlCenter: '#6366F1', 
    Students: '#0EA5E9',     
    Teachers: '#10B981',     
    Parents: '#F59E0B',      
    Staff: '#EC4899',       
    Classes: '#8B5CF6',     
    Settings: '#64748B',    
    FeeCounter: '#F59E0B',    
    Attendance: '#EF4444',    
    Timetable: '#F97316',     
    Academics: '#3B82F6',     
};
// ---

// --- FIX 2: School Control Center Menu Items (Array Restored) ---
const schoolMenuItems: NavItem[] = [
    // Control Center - Main
    { name: 'Control Center', path: '/admin/school', icon: <MdSchool style={{ color: Colors.ControlCenter }} />, type: 'free' },
    // Core Free Features - Fully Unlocked
    { name: 'Students', path: '/admin/students', icon: <MdPeople style={{ color: Colors.Students }} />, type: 'free' },
    { name: 'Teachers', path: '/admin/teachers', icon: <MdSchool style={{ color: Colors.Teachers }} />, type: 'free' },
    { name: 'Parents', path: '/admin/parents', icon: <MdFamilyRestroom style={{ color: Colors.Parents }} />, type: 'free' },
    { name: 'Staff', path: '/admin/staff', icon: <MdBadge style={{ color: Colors.Staff }} />, type: 'free' },
    { name: 'Manage Classes', path: '/admin/classes', icon: <MdClass style={{ color: Colors.Classes }} />, type: 'free' },
    
    // Starter Plan Features (Fee Counter is Starter/Trial)
    { name: 'Fee Counter', path: '/admin/fee-counter', icon: <MdAttachMoney style={{ color: Colors.FeeCounter }} />, type: 'starter' }, 
    
    // Locked/Upcoming Features 
    { name: 'Settings', path: '/admin/settings', icon: <MdSettings style={{ color: Colors.Settings }} />, type: 'locked' }, 
    { name: 'Attendance', path: '/admin/attendance', icon: <MdEventAvailable style={{ color: Colors.Attendance }} />, type: 'locked' }, 
    { name: 'Timetable', path: '/admin/timetable', icon: <MdSchedule style={{ color: Colors.Timetable }} />, type: 'locked' },
    { name: 'Academics', path: '/admin/academics', icon: <MdAssessment style={{ color: Colors.Academics }} />, type: 'locked' }, 
];
// ---

const SchoolSidebar = () => {
    const pathname = usePathname();
    const { user } = useAuth();
    const { triggerModal } = useUpcomingFeature();
    // Hook call is now safe because the correct file is imported
    const { isSidebarOpen, toggleSidebar } = useSchoolLayout(); 

    const isSuperAdmin = user?.role === 'SuperAdmin';
    const showUpcomingFeatureAlert = (e: React.MouseEvent) => {
        e.preventDefault();
        triggerModal();
    };

    const getTag = (itemType: NavItem['type']) => {
        if (isSuperAdmin) return null;
        if (itemType === 'starter') return null;
        if (itemType === 'locked') {
            return (
                <span className={styles.upcomingTag}>
                    <MdBolt size={14} style={{ marginRight: '4px' }}/> SOON
                </span>
            );
        }
        return null;
    };

    const getItemProps = (item: NavItem) => {
        const props: { href: string, onClick?: (e: React.MouseEvent) => void } = { href: item.path };
        
        const clickHandler = (e: React.MouseEvent) => {
             // Mobile par hi toggle karein (1024px)
            if (window.innerWidth <= 1024) toggleSidebar(); 
            if (item.type === 'locked' && !isSuperAdmin) {
                showUpcomingFeatureAlert(e);
            }
        };

        if (item.type === 'locked' && !isSuperAdmin) {
            props.href = pathname;
            props.onClick = clickHandler;
        } else {
            props.onClick = clickHandler;
        }

        return props;
    }


    return (
        <aside className={`${styles.sidebarContainer} ${isSidebarOpen ? styles.mobileOpen : ''}`}>
            
            <div className={styles.logoSection}>
                <Link href="/admin/school" onClick={e => { if (window.innerWidth <= 1024) toggleSidebar(); }}>
                    <h2>School Center</h2>
                </Link>
            </div>

            <nav className={styles.menuSection}>
                <ul className={styles.menuList}>
                    {schoolMenuItems.map((item) => { 
                        const isActive = item.path === '/admin/school' 
                            ? pathname === item.path 
                            : pathname.startsWith(item.path); 

                        const itemProps = getItemProps(item); 
                        const tag = getTag(item.type);

                        return (
                            <li 
                                key={item.path} 
                                className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
                            >
                                <Link {...itemProps}> 
                                    <span className={styles.icon}>{item.icon}</span>
                                    <span>{item.name}</span>
                                    {tag}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            
            <footer className={`${styles.sidebarFooter} ${styles.noBorder}`} style={{ borderTop: 'none' }}>
                <Link href="/admin/dashboard" className={`${styles.footerButton} ${styles.backButton}`}>
                    <MdArrowBack />
                    <span>Go to Main Dashboard</span>
                </Link>
            </footer>

        </aside>
    );
};

export default SchoolSidebar;
// File: app/admin/school/SchoolSidebar.tsx (FINAL WITH PROFESSIONAL LOCKING & STYLES)

"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '@/components/layout/Sidebar/Sidebar.module.scss'; 
import { useAuth } from '@/app/context/AuthContext'; // <--- useAuth import kiya

import { 
  MdPeople, MdSchool, MdFamilyRestroom, MdBadge, MdClass, MdSettings, MdAttachMoney, 
  MdEventAvailable, MdSchedule, MdAssessment, MdArrowBack, MdBolt 
} from 'react-icons/md'; 

// --- NavItem Interface (Consistency ke liye) ---
export interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  // 'free' = Unlocked, 'starter' = Starter/Trial, 'locked' = Requires Upgrade/Not Ready
  type: 'free' | 'starter' | 'locked'; 
}

// --- Professional Premium Color Palette ---
const Colors = {
    // Core (Blue/Purple)
    ControlCenter: '#6366F1', // Indigo
    Students: '#0EA5E9',      // Sky Blue
    Teachers: '#10B981',      // Emerald Green
    Parents: '#F59E0B',        // Amber Yellow
    Staff: '#EC4899',         // Pink
    Classes: '#8B5CF6',       // Violet
    Settings: '#64748B',      // Slate Gray
    // Revenue/Premium (Gold/Vibrant)
    FeeCounter: '#F59E0B',    // Amber Gold
    Attendance: '#EF4444',    // Red (Upcoming/Warning)
    Timetable: '#F97316',     // Orange (Upcoming/Schedule)
    Academics: '#3B82F6',     // Blue (Analytics/Core)
};
// ---

// --- School Control Center Menu Items (Updated Types and Colors) ---
const schoolMenuItems: NavItem[] = [
    // Control Center - Main
    { name: 'Control Center', path: '/admin/school', icon: <MdSchool style={{ color: Colors.ControlCenter }} />, type: 'free' },
    // Core Free Features - Fully Unlocked
    { name: 'Students', path: '/admin/students', icon: <MdPeople style={{ color: Colors.Students }} />, type: 'free' },
    { name: 'Teachers', path: '/admin/teachers', icon: <MdSchool style={{ color: Colors.Teachers }} />, type: 'free' },
    { name: 'Parents', path: '/admin/parents', icon: <MdFamilyRestroom style={{ color: Colors.Parents }} />, type: 'free' },
    { name: 'Staff', path: '/admin/staff', icon: <MdBadge style={{ color: Colors.Staff }} />, type: 'free' },
    { name: 'Manage Classes', path: '/admin/school/classes', icon: <MdClass style={{ color: Colors.Classes }} />, type: 'free' },
    
    // Starter Plan Features (Unlocked by Starter/Trial)
    // Fee Counter is a core revenue feature, available in Starter/Trial
    { name: 'Fee Counter', path: '/admin/fee-counter', icon: <MdAttachMoney style={{ color: Colors.FeeCounter }} />, type: 'starter' }, 
    
    // Locked/Upcoming Features (Admin must subscribe to PRO or wait)
    { name: 'Settings', path: '/admin/settings', icon: <MdSettings style={{ color: Colors.Settings }} />, type: 'locked' }, 
    { name: 'Attendance', path: '/admin/attendance', icon: <MdEventAvailable style={{ color: Colors.Attendance }} />, type: 'locked' }, 
    { name: 'Timetable', path: '/admin/timetable', icon: <MdSchedule style={{ color: Colors.Timetable }} />, type: 'locked' },
    { name: 'Academics', path: '/admin/academics', icon: <MdAssessment style={{ color: Colors.Academics }} />, type: 'locked' }, 
];
// ---

const SchoolSidebar = () => {
    const pathname = usePathname();
    const { user } = useAuth(); // <--- User data fetch kiya

    // --- LOGIC 1: SuperAdmin Bypass ---
    const isSuperAdmin = user?.role === 'SuperAdmin';
    
    // --- LOGIC 2: Upcoming Feature Modal ---
    const showUpcomingFeatureAlert = (e: React.MouseEvent) => {
        // Navigation roko
        e.preventDefault(); 
        
        // Custom Pop-up Logic: 
        // NOTE: Yahaan aapko apne main component se state setter pass karna hoga. 
        // Abhi ke liye, hum ek simple alert ka use kar rahe hain jo user ko alert karega
        // aur isse aapki requirement poori hogi ki naya page na khule.
        alert("Upcoming Feature!\nThis feature is under construction and will be available soon.");
    };

    const getTag = (itemType: NavItem['type']) => {
        // SuperAdmin ke liye koi tag nahi
        if (isSuperAdmin) return null; 

        // Fee Counter (Starter) par koi tag nahi lagana hai, yeh available hai
        if (itemType === 'starter') return null; 
        
        // Locked features par SOON tag lagao
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
        
        // Agar feature locked hai AUR user SuperAdmin nahi hai, toh onClick handler add karo
        if (item.type === 'locked' && !isSuperAdmin) {
            props.href = pathname; // Current path par hi rakho
            props.onClick = showUpcomingFeatureAlert;
        }

        return props;
    }


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

                        const itemProps = getItemProps(item); // Props nikalo

                        // Fee Counter item par, agar item 'starter' hai aur SuperAdmin nahi hai, toh 'PRO' badge nahi dikhana hai.
                        const tag = getTag(item.type);

                        return (
                            <li 
                                key={item.path} 
                                className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
                            >
                                <Link {...itemProps}> {/* Dynamic props use karein */}
                                    <span className={styles.icon}>{item.icon}</span>
                                    <span>{item.name}</span>
                                    {/* Tag Render */}
                                    {tag}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            
            {/* FOOTER: Back Button */}
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
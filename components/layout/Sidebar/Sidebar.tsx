// File: components/layout/Sidebar/Sidebar.tsx (SUPER INTELLIGENT VERSION)
"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext'; 
import { useAdminLayout } from '@/app/context/AdminLayoutContext'; 
import styles from './Sidebar.module.scss'; 
import { FiTag } from 'react-icons/fi'; 
import { MdLogout, MdPeople, MdSchool, MdFamilyRestroom, MdBadge, MdClass, MdEventAvailable, MdSchedule, MdSettings, MdAssessment, MdGridView, MdPublic, MdAttachMoney } from 'react-icons/md'; 
import { FaLandmark } from 'react-icons/fa';
import { GiReceiveMoney } from 'react-icons/gi';

// Interface definition (ab yeh internal hai)
export interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  type: 'free' | 'premium' | 'upcoming';
}

// === MENU 1: DASHBOARD MAIN MENU (Chota Menu) ===
const mainMenuItems: NavItem[] = [
  { 
    name: 'Main Dashboard', 
    path: '/admin/dashboard', 
    icon: <MdGridView style={{ color: '#3b82f6' }} />, 
    type: 'free' 
  },
  { 
    name: 'School', 
    path: '/admin/school', 
    icon: <MdSchool style={{ color: '#8b5cf6' }} />, 
    type: 'free' 
  },
  { 
    name: 'Gov Schemes', 
    path: '/admin/schemes',
    icon: <FaLandmark style={{ color: '#10b981' }} />, 
    type: 'upcoming' 
  },
  { 
    name: 'Expense', 
    path: '/admin/expense', 
    icon: <GiReceiveMoney style={{ color: '#f97316' }} />, 
    type: 'upcoming' 
  },
];

// === MENU 2: SCHOOL CONTROL CENTER MENU (Bada Menu + Locking) ===
const schoolMenuItems: NavItem[] = [
    // Free Features
    { name: 'Students', path: '/admin/students', icon: <MdPeople />, type: 'free' },
    { name: 'Teachers', path: '/admin/teachers', icon: <MdSchool />, type: 'free' },
    { name: 'Parents', path: '/admin/parents', icon: <MdFamilyRestroom />, type: 'free' },
    { name: 'Staff', path: '/admin/staff', icon: <MdBadge />, type: 'free' },
    { name: 'Manage Classes', path: '/admin/school/classes', icon: <MdClass />, type: 'free' },
    { name: 'Settings', path: '/admin/settings', icon: <MdSettings />, type: 'free' },
    
    // --- LOCKED FEATURES ---
    // Premium Lock
    { name: 'Fee Counter', path: '/admin/fee-counter', icon: <MdAttachMoney />, type: 'premium' }, 
    
    // Upcoming Locks (Popup open hoga)
    { name: 'Attendance', path: '/admin/attendance', icon: <MdEventAvailable />, type: 'upcoming' }, 
    { name: 'Timetable', path: '/admin/timetable', icon: <MdSchedule />, type: 'upcoming' },
    { name: 'Academics', path: '/admin/academics', icon: <MdAssessment />, type: 'upcoming' }, 
];

// Sidebar Component - No 'menuItems' prop now!
const Sidebar = () => { // Removed { menuItems }: SidebarProps
  const pathname = usePathname();
  const { user, logout } = useAuth(); 
  const { showUpcomingFeatureModal } = useAdminLayout(); 

  const isSuperAdmin = user?.role === 'SuperAdmin';
  
  // === DYNAMIC MENU SELECTION LOGIC ===
  const isSchoolFeatureRoute = pathname.startsWith('/admin/school') || 
                               pathname.startsWith('/admin/students') || 
                               pathname.startsWith('/admin/teachers') || 
                               pathname.startsWith('/admin/parents') || 
                               pathname.startsWith('/admin/staff') ||
                               pathname.startsWith('/admin/settings'); // Settings school area mein bhi hai
                               
  const currentMenuItems = isSchoolFeatureRoute ? schoolMenuItems : mainMenuItems;
  // ===================================


  const getLinkProps = (item: NavItem) => {
    // Logic remains the same (handles locking/unlocked states)
    if (isSuperAdmin || item.type === 'free') {
      return { href: item.path, onClick: undefined, className: '' };
    }
    if (item.type === 'premium') {
      return { href: item.path, onClick: undefined, className: styles.premium };
    }
    if (item.type === 'upcoming') {
      return {
        href: '#',
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          showUpcomingFeatureModal();
        },
        className: styles.upcoming
      };
    }
    return { href: item.path, onClick: undefined, className: '' };
  };

  return (
    <aside className={styles.sidebarContainer}>
      <div className={styles.logoSection}>
        <Link href="/admin/dashboard">
          <h2>My EduPanel</h2>
        </Link>
      </div>

      <nav className={styles.menuSection}>
        <ul className={styles.menuList}>
          {currentMenuItems.map((item) => { // currentMenuItems ko map kiya
            const linkProps = getLinkProps(item);

            return (
              <li key={item.path} className={`${styles.menuItem} ${
                  (pathname === item.path && item.path) ? styles.active : ''
                } ${linkProps.className}`}
              >
                <Link
                  href={linkProps.href}
                  onClick={linkProps.onClick}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span>{item.name}</span>
                  {/* === TAGS === */}
                  {(item.type === 'premium' && !isSuperAdmin) && (
                    <span className={styles.proTag}>PRO</span>
                  )}
                  {(item.type === 'upcoming' && !isSuperAdmin) && (
                    <span className={styles.upcomingTag}>SOON</span>
                  )}
                </Link>
              </li>
            );
          })}
          
          {/* === COUPON BUTTON (SIRF SUPERADMIN KE LIYE) === */}
          {isSuperAdmin && (
            <li className={`${styles.menuItem} ${styles.superAdminLink} ${
                pathname === '/superadmin/coupons' ? styles.active : ''
              }`}
            >
              <Link href="/superadmin/coupons">
                <span className={styles.icon}><FiTag /></span>
                <span>Manage Coupons</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* --- FOOTER (LOGOUT BUTTON) --- */}
      <footer className={styles.sidebarFooter}>
        <button onClick={logout} className={`${styles.footerButton} ${styles.logoutButton}`}>
          <MdLogout />
          <span>Logout</span>
        </button>
      </footer>
    </aside>
  );
};
export default Sidebar;
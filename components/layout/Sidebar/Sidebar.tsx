// File: components/layout/Sidebar/Sidebar.tsx
"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext'; 
import { useAdminLayout } from '@/app/context/AdminLayoutContext'; 
import styles from './Sidebar.module.scss'; 
import { FiTag } from 'react-icons/fi'; // Coupon icon
import { MdLogout } from 'react-icons/md'; // Logout icon

// Interface definition
export interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  type: 'free' | 'premium' | 'upcoming';
}
interface SidebarProps {
  menuItems: NavItem[];
}

const Sidebar = ({ menuItems }: SidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuth(); // FIX: 'logout' function ko liya
  const { showUpcomingFeatureModal } = useAdminLayout(); 

  const isSuperAdmin = user?.role === 'SuperAdmin';

  const getLinkProps = (item: NavItem) => {
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
          {menuItems.map((item) => {
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
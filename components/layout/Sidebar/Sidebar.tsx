"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // useRouter import kiya
import { useAuth } from '@/app/context/AuthContext'; 
import { useAdminLayout } from '@/app/context/AdminLayoutContext'; 
import styles from './Sidebar.module.scss'; // Iske liye SCSS neeche hai
import { FiTag } from 'react-icons/fi'; // Coupon icon
import { MdLogout } from 'react-icons/md'; // Logout icon

// Interface batata hai ki 'menuItems' array kaisa dikhega
export interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  type: 'free' | 'premium' | 'upcoming';
}

// Sidebar ab 'menuItems' prop lega
interface SidebarProps {
  menuItems: NavItem[];
}

const Sidebar = ({ menuItems }: SidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuth(); // 'logout' function ko useAuth se liya
  const { showUpcomingFeatureModal } = useAdminLayout(); 

  const isSuperAdmin = user?.role === 'SuperAdmin';

  // Har item ke liye link properties generate karne ka function
  const getLinkProps = (item: NavItem) => {
    // 1. Agar SuperAdmin hai, toh sab kuch allowed hai
    if (isSuperAdmin) {
      return { href: item.path, onClick: undefined, className: '' };
    }

    // 2. Agar feature 'free' hai, toh allowed hai
    if (item.type === 'free') {
      return { href: item.path, onClick: undefined, className: '' };
    }

    // 3. Agar feature 'premium' hai (jaise Fee Counter)
    // Link ko active rakhein. Backend 403 bhejega aur api.ts
    // user ko /upgrade page par redirect kar dega.
    if (item.type === 'premium') {
      return { href: item.path, onClick: undefined, className: styles.premium };
    }

    // 4. Agar feature 'upcoming' hai (jaise Academics)
    // Link ko dead karein (href="#") aur onClick par modal dikhayein.
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

    // Fallback
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
          {/* 'menuItems' prop se map karein */}
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
                  {/* === NAYE TAGS === */}
                  {(item.type === 'premium' && !isSuperAdmin) && (
                    <span className={styles.proTag}>PRO</span>
                  )}
                  {(item.type === 'upcoming' && !isSuperAdmin) && (
                    <span className={styles.upcomingTag}>SOON</span>
                  )}
                  {/* === END TAGS === */}
                </Link>
              </li>
            );
          })}
          
          {/* === NAYA COUPON BUTTON (SIRF SUPERADMIN KE LIYE) === */}
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
          {/* === END COUPON BUTTON === */}
        </ul>
      </nav>

      {/* --- FOOTER (Aapke original design ke hisaab se) --- */}
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
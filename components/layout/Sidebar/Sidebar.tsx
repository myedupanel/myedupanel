"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext'; 
import { useAdminLayout } from '@/app/context/AdminLayoutContext'; 
// --- YAHI HAI FIX ---
import styles from './Sidebar.module.scss'; // Path theek kar diya gaya hai
// --------------------
import { FiTag } from 'react-icons/fi'; // Coupon icon

// Sidebar ko `menuItems` prop ke through data milega
interface NavItem {
  name: string; 
  path: string;
  icon: React.ReactNode;
  type: 'free' | 'premium' | 'upcoming';
}

// SidebarProps interface (jismein 'menuItems' array hai)
interface SidebarProps {
  menuItems: NavItem[];
}

const Sidebar = ({ menuItems }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuth(); 
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
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        My EduPanel
      </div>

      <nav className={styles.nav}>
        <ul>
          {/* 'menuItems' prop se map karein */}
          {menuItems.map((item) => {
            const linkProps = getLinkProps(item);

            return (
              <li key={item.path}>
                <Link
                  href={linkProps.href}
                  onClick={linkProps.onClick}
                  className={`${styles.navLink} ${pathname === item.path ? styles.active : ''} ${linkProps.className}`}
                >
                  {item.icon}
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
            <li>
              <Link
                href="/superadmin/coupons"
                className={`${styles.navLink} ${pathname === '/superadmin/coupons' ? styles.active : ''} ${styles.superAdminLink}`}
              >
                <FiTag />
                <span>Manage Coupons</span>
              </Link>
            </li>
          )}
          {/* === END COUPON BUTTON === */}

        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
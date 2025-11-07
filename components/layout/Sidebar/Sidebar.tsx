// File: components/layout/Sidebar/Sidebar.tsx

"use client";

import React from 'react'; // useState hata diya
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './Sidebar.scss';
import { useAuth } from '@/app/context/AuthContext';
import { useAdminLayout } from '@/app/admin/dashboard/layout'; // !! Naya AdminLayout hook
import { MdGridView, MdLogout } from 'react-icons/md';
import { FiTag } from 'react-icons/fi'; // Coupon icon

// Sidebar ko `menuItems` prop ke through data milega
interface NavItem {
  title: string; // 'title' istemaal ho raha hai
  path: string;
  icon: React.ReactNode;
  type: 'free' | 'premium' | 'upcoming'; // type property
}

interface SidebarProps {
  menuItems: NavItem[];
}

const Sidebar = ({ menuItems }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth(); // User ka data (role) aur logout function
  const { showUpcomingFeatureModal } = useAdminLayout(); // Naya hook modal ke liye

  const isSuperAdmin = user?.role === 'SuperAdmin';

  // Contextual menus (Aapka puraana logic, aage zaroorat pad sakti hai)
  const isStudentPage = pathname === '/admin/students';
  const isTeacherPage = pathname.startsWith('/admin/teachers');

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
      return { href: item.path, onClick: undefined, className: 'premium' }; // 'premium' class
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
        className: 'upcoming' // 'upcoming' class
      };
    }

    // Fallback
    return { href: item.path, onClick: undefined, className: '' };
  };

  return (
    <aside className="sidebar-container">
      {/* Modal ko yahaan se hata diya gaya hai, yeh ab layout.tsx mein hai */}

      <div className="logo-section">
        <Link href="/admin/dashboard">
          <h2>My EduPanel</h2>
        </Link>
      </div>

      <nav className="menu-section">
        <ul className="menu-list">
          {/* --- .map() LOGIC UPDATE KIYA GAYA --- */}
          {/* Ab 'menuItems' prop se map karein (processedMenuItems ki zaroorat nahi) */}
          {menuItems.map((item) => {
            const linkProps = getLinkProps(item);

            return (
              <li
                key={item.path}
                className={`menu-item ${
                  pathname.startsWith(item.path) ? 'active' : ''
                } ${linkProps.className}`} // Nayi class yahaan add ki
              >
                <Link href={linkProps.href} onClick={linkProps.onClick}>
                  <span className="icon">
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                  
                  {/* --- NAYE TAGS --- */}
                  {(item.type === 'premium' && !isSuperAdmin) && (
                    <span className="proTag">PRO</span>
                  )}
                  {(item.type === 'upcoming' && !isSuperAdmin) && (
                    <span className="upcomingTag">SOON</span>
                  )}
                  {/* --- END TAGS --- */}
                </Link>
              </li>
            );
          })}
          
          {/* === NAYA COUPON BUTTON (SIRF SUPERADMIN KE LIYE) === */}
          {isSuperAdmin && (
            <li className={`menu-item superAdminLink ${pathname === '/superadmin/coupons' ? 'active' : ''}`}>
              <Link href="/superadmin/coupons">
                <span className="icon"><FiTag /></span>
                <span>Manage Coupons</span>
              </Link>
            </li>
          )}
          {/* === END COUPON BUTTON === */}

        </ul>

        {/* Naya Teacher Menu (Aapka puraana logic) */}
        {isTeacherPage && (
          <div className="contextual-menu">
            {/* ... (aapka teacher menu) ... */}
          </div>
        )}

        {isStudentPage && (
          <div className="contextual-menu">
            {/* ... (aapka student menu) ... */}
          </div>
        )}
      </nav>

      <footer className="sidebar-footer">
        {/* Logout button ko hamesha dikhayein */}
        <button onClick={logout} className="footer-button logout-button">
          <MdLogout />
          <span>Logout</span>
        </button>
      </footer>
    </aside>
  );
};

export default Sidebar;
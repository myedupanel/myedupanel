"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './Sidebar.scss';
import { useAuth } from '@/app/context/AuthContext'; // Import useAuth to get the logout function
import { FiFileText, FiDownload, FiUpload, FiPlus } from 'react-icons/fi';
import { MdGridView, MdLogout } from 'react-icons/md'; // Import the Logout icon

// Prop Types (no changes)
interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  color?: string;
}
interface SidebarProps {
  menuItems: MenuItem[];
}

const Sidebar = ({ menuItems }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth(); // Get the logout function from your context

  const isStudentPage = pathname === '/admin/students';

  const openStudentModal = (modalName: string) => {
    router.push(`/admin/students?modal=${modalName}`);
  };

  return (
    <aside className="sidebar-container">
      <div className="logo-section">
        <Link href="/admin/dashboard">
          <h2>My Edupanel</h2>
        </Link>
      </div>
      
      <nav className="menu-section">
        <ul className="menu-list">
          {menuItems.map((item, index) => (
            <li
              key={item.path}
              className={`menu-item item-${index + 1} ${
                (pathname.startsWith(item.path) && item.path !== '/') || (pathname === '/' && item.path === '/') 
                ? 'active' 
                : ''
              }`}
            >
              <Link href={item.path}>
                <span className="icon" style={{ color: item.color }}>
                  {item.icon}
                </span>
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
        
        {isStudentPage && (
          <div className="contextual-menu">
            {/* (Your contextual menu code remains the same) */}
          </div>
        )}
      </nav>

      {/* === UPDATED SECTION: Conditional Footer Buttons === */}
      <footer className="sidebar-footer">
        {/* Show this button ONLY on the /admin/school page */}
        {pathname === '/admin/school' && (
            <Link href="/admin/dashboard" className="footer-button">
              <MdGridView /> 
              <span>Main Dashboard</span>
            </Link>
        )}

        {/* Show this button ONLY on the main /admin/dashboard page */}
        {pathname === '/admin/dashboard' && (
            <button onClick={logout} className="footer-button logout-button">
                <MdLogout />
                <span>Logout</span>
            </button>
        )}
      </footer>
    </aside>
  );
};

export default Sidebar;
"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './Sidebar.scss';
import { useAuth } from '@/app/context/AuthContext';
// --- FIX: Icons for Plus, Download, Upload, Briefcase, X, and LOCK added ---
import { FiFileText, FiDownload, FiUpload, FiPlus, FiBriefcase, FiX, FiLock } from 'react-icons/fi'; 
import { MdGridView, MdLogout, MdAttachMoney } from 'react-icons/md'; // MdAttachMoney for Expense

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
  const { logout } = useAuth();

  // Popup state for Gov Schemes
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const isStudentPage = pathname === '/admin/students';
  const isTeacherPage = pathname.startsWith('/admin/teachers');

  const openStudentModal = (modalName: string) => {
    router.push(`/admin/students?modal=${modalName}`);
  };

  const handleTeacherExport = () => {
    router.push('/admin/teachers?modal=export');
  };
  const handleTeacherImport = () => {
    router.push('/admin/teachers?modal=import');
  };
  const handleAddNewTeacher = () => {
    router.push('/admin/teachers?modal=add');
  };
  
  // --- FIX: New handler for the locked Expense feature ---
  const handleExpenseClick = () => {
    alert("Expense tracking is an upcoming feature and is currently locked.");
  };
  
  return (
    <>
      <aside className="sidebar-container">
        <div className="logo-section">
          <Link href="/admin/dashboard">
            <h2>My EduPanel</h2>
          </Link>
        </div>

        <nav className="menu-section">
          <ul className="menu-list">
            {menuItems.map((item, index) => {
              const isActive = (pathname.startsWith(item.path) && item.path !== '/') || (pathname === '/' && item.path === '/');
              return (
                <li
                  key={item.path}
                  className={`menu-item item-${index + 1} ${isActive ? 'active' : ''}`}
                >
                  <Link href={item.path}>
                    <span className="icon" style={{ color: item.color }}>
                      {item.icon}
                    </span>
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}

            {/* Gov Schemes Button (Opens Popup) */}
            <li className="menu-item item-3">
              <button onClick={() => setIsPopupOpen(true)} className="menu-button-link">
                <span className="icon" style={{ color: '#ff6b6b' }}>
                  <FiBriefcase />
                </span>
                <span>Gov Schemes</span>
              </button>
            </li>

            {/* --- FIX: New Expense Button (Locked Feature) --- */}
            <li className="menu-item item-4 disabled-feature">
              {/* Note: Yeh Link nahi hai, yeh ek button hai jo alert trigger karta hai */}
              <button onClick={handleExpenseClick} className="menu-button-link">
                <span className="icon" style={{ color: '#10b981' }}>
                  <MdAttachMoney /> 
                </span>
                <span>Expense</span>
                <FiLock className="lock-icon" /> {/* Lock Icon */}
              </button>
            </li>
            {/* --- END FIX --- */}
            
          </ul>

          {isTeacherPage && (
            <div className="contextual-menu">
              <p className="contextual-title">Teacher Options</p>
              <button onClick={handleTeacherExport} className="contextual-button">
                <FiDownload />
                <span>Export</span>
              </button>
              <button onClick={handleTeacherImport} className="contextual-button">
                <FiUpload />
                <span>Import Teachers</span>
              </button>
              <button onClick={handleAddNewTeacher} className="contextual-button add-new">
                <FiPlus />
                <span>Add New Teacher</span>
              </button>
            </div>
          )}

          {isStudentPage && (
            <div className="contextual-menu">
              {/* ... (student menu) ... */}
            </div>
          )}
        </nav>

        <footer className="sidebar-footer">
          {pathname === '/admin/school' && (
            <Link href="/admin/dashboard" className="footer-button">
              <MdGridView />
              <span>Main Dashboard</span>
            </Link>
          )}
          {pathname === '/admin/dashboard' && (
            <button onClick={logout} className="footer-button logout-button">
              <MdLogout />
              <span>Logout</span>
            </button>
          )}
        </footer>
      </aside>

      {/* Gov Schemes Popup */}
      {isPopupOpen && (
        <div className="popup-backdrop" onClick={() => setIsPopupOpen(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setIsPopupOpen(false)}>
              <FiX />
            </button>
            <h2>Gov Schemes</h2>
            <p>This feature is upcoming...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
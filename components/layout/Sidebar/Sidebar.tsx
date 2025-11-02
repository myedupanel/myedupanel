"use client";
// --- FIX 1: 'useState' ko React se import kiya ---
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './Sidebar.scss';
import { useAuth } from '@/app/context/AuthContext';
import { FiFileText, FiDownload, FiUpload, FiPlus, FiBriefcase, FiX } from 'react-icons/fi'; // --- FIX: Icons add kiye
import { MdGridView, MdLogout } from 'react-icons/md';

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

  // --- FIX 2: Popup ko control karne ke liye state banaya ---
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
  
  return (
    <> {/* --- FIX: Fragment add kiya taaki popup ko include kar sakein --- */}
      <aside className="sidebar-container">
        <div className="logo-section">
          <Link href="/admin/dashboard">
            <h2>My EduPanel</h2>
          </Link>
        </div>

        <nav className="menu-section">
          <ul className="menu-list">
            {menuItems.map((item, index) => {
              // Pehle ki tarah dynamic items render karein
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

            {/* --- FIX 3: Naya 'Gov Schemes' button yahan add kiya --- */}
            {/* Yeh 'School' ke baad dikhega (agar School item-2 hai) */}
            <li className="menu-item item-3">
              {/* Yeh ek button hai, Link nahi */}
              <button onClick={() => setIsPopupOpen(true)} className="menu-button-link">
                <span className="icon" style={{ color: '#ff6b6b' }}>
                  <FiBriefcase />
                </span>
                <span>Gov Schemes</span>
              </button>
            </li>
            {/* --- END FIX --- */}
            
          </ul>

          {/* Naya Teacher Menu (Ab functional hai) */}
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
              {/* ... (aapka student menu) ... */}
            </div>
          )}
        </nav>

        {/* ... (aapka footer code) ... */}
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

      {/* --- FIX 4: Naya "Upcoming" Popup --- */}
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
      {/* --- END FIX --- */}
    </>
  );
};

export default Sidebar;
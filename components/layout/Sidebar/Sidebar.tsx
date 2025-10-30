"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // useRouter pehle se tha
import './Sidebar.scss';
import { useAuth } from '@/app/context/AuthContext';
import { FiFileText, FiDownload, FiUpload, FiPlus } from 'react-icons/fi';
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
  const router = useRouter(); // Hum iska istemaal karenge
  const { logout } = useAuth();

  const isStudentPage = pathname === '/admin/students';
  const isTeacherPage = pathname.startsWith('/admin/teachers');

  const openStudentModal = (modalName: string) => {
    router.push(`/admin/students?modal=${modalName}`);
  };

  // --- YAHAN BADLAAV KIYA GAYA HAI ---
  // Ab yeh functions console.log ke bajaaye URL change karenge
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
    <aside className="sidebar-container">
      <div className="logo-section">
        <Link href="/admin/dashboard">
          <h2>My EduPanel</h2>
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
  );
};

export default Sidebar;
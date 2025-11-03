"use client";
import React, { useState } from 'react'; // <-- useState import kiya
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './Sidebar.scss';
import { useAuth } from '@/app/context/AuthContext';
import { FiFileText, FiDownload, FiUpload, FiPlus } from 'react-icons/fi';
import { MdGridView, MdLogout } from 'react-icons/md';
// --- In icons ko naye items ke liye istemaal karenge ---
import { FaLandmark } from 'react-icons/fa';
import { GiReceiveMoney } from 'react-icons/gi';

interface MenuItem {
  title: string;
  path?: string; // <-- Path ko optional banaya
  icon: React.ReactNode;
  color?: string;
  onClick?: () => void; // <-- Click handler add kiya
}
interface SidebarProps {
  menuItems: MenuItem[];
}

// --- YEH NAYA POPUP COMPONENT HAI ---
const UpcomingFeatureModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>🚀 Upcoming Feature</h3>
        <p>
          Yeh feature jald hi aa raha hai! Hum ispar tezi se kaam kar rahe hain
          taaki aapko behtareen experience de sakein.
        </p>
        <button onClick={onClose} className="modal-close-btn">
          Samajh Gaya
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ menuItems }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  // --- MODAL KE LIYE STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // --- NAYE MENU ITEMS KO ADD KARNE KA LOGIC ---
  const processedMenuItems = [...menuItems];
  const schoolIndex = processedMenuItems.findIndex(
    (item) => item.title === 'School'
  );

  if (schoolIndex !== -1) {
    processedMenuItems.splice(
      schoolIndex + 1,
      0,
      {
        title: 'Gov Schemes',
        icon: <FaLandmark />,
        onClick: () => setIsModalOpen(true), // <-- Modal kholega
      },
      {
        title: 'Expense',
        icon: <GiReceiveMoney />,
        onClick: () => setIsModalOpen(true), // <-- Modal kholega
      }
    );
  }

  return (
    <aside className="sidebar-container">
      {/* --- MODAL KO YAHAN RENDER KIYA --- */}
      {isModalOpen && <UpcomingFeatureModal onClose={() => setIsModalOpen(false)} />}

      <div className="logo-section">
        <Link href="/admin/dashboard">
          <h2>My EduPanel</h2>
        </Link>
      </div>

      <nav className="menu-section">
        <ul className="menu-list">
          {/* --- .map() LOGIC UPDATE KIYA GAYA --- */}
          {processedMenuItems.map((item, index) => (
            <li
              key={index} // Key ko index par set kiya kyunki path hamesha unique nahi hoga
              className={`menu-item item-${index + 1} ${
                item.path &&
                ((pathname.startsWith(item.path) && item.path !== '/') ||
                  (pathname === '/' && item.path === '/'))
                  ? 'active'
                  : ''
              }`}
            >
              {/* --- YAHAN CHECK KARTE HAIN KI LINK HAI YA BUTTON --- */}
              {item.path ? (
                <Link href={item.path}>
                  <span className="icon" style={{ color: item.color }}>
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </Link>
              ) : (
                <button onClick={item.onClick} className="menu-button-link">
                  <span className="icon" style={{ color: item.color }}>
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* Naya Teacher Menu (Ab functional hai) */}
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
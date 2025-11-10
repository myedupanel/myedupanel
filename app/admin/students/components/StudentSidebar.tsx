"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './StudentSidebar.module.scss';
import { FiFileText, FiDownload, FiUpload, FiPlus } from 'react-icons/fi';
import { MdArrowBack, MdPictureAsPdf } from 'react-icons/md';
import { useStudentLayout } from '../page';

// NAYA: Props interface
interface StudentSidebarProps {
    isMobileOpen: boolean;
}

const StudentSidebar = ({ isMobileOpen }: StudentSidebarProps) => { 
  const router = useRouter();
  const { toggleSidebar } = useStudentLayout();

  const openModal = (modalName: string) => {
    // Mobile par click hone par sidebar close karein
    if (window.innerWidth <= 1024) toggleSidebar(); 
    router.push(`/admin/students?modal=${modalName}`);
  };
  
  const handleLinkClick = (path: string) => {
    // Mobile par click hone par sidebar close karein
    if (window.innerWidth <= 1024) toggleSidebar(); 
    router.push(path);
  };

  return (
    // NAYA: isMobileOpen prop se class apply ki
    <aside className={`${styles.sidebarContainer} ${isMobileOpen ? styles.mobileOpen : ''}`}>
      <div className={styles.titleSection}>
        {/* NAYA: Mobile par close button (Sirf mobile par dikhega) */}
        <button className={styles.closeSidebarButton} onClick={toggleSidebar}>
            &times;
        </button>
        <h3>Student Actions</h3>
      </div>
      
      <nav className={styles.menuSection}>
        <ul>
          <li className={styles.menuItem} onClick={() => handleLinkClick('/admin/students/generate-leaving-certificate')}>
            <MdPictureAsPdf /> <span>Generate LC</span>
          </li>
          <li className={styles.menuItem} onClick={() => handleLinkClick('/admin/students/generate-bonafide')}>
            <FiFileText /> <span>Generate Bonafide</span>
          </li >
          <li className={styles.menuItem} onClick={() => openModal('export')}>
            <FiDownload /> <span>Export / Print</span>
          </li>
          <li className={styles.menuItem} onClick={() => openModal('import')}>
            <FiUpload /> <span>Import Students</span>
          </li>
          <li className={styles.menuItem} onClick={() => openModal('add')}>
            <FiPlus /> <span>Add New Student</span>
          </li>
        </ul>
      </nav>

      <div className={styles.footerSection}>
        <button className={styles.dashboardButton} onClick={() => handleLinkClick('/admin/school')}>
          <MdArrowBack />
          <span>Go to Dashboard</span>
        </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;
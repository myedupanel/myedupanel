"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './StudentSidebar.module.scss';
import { FiFileText, FiDownload, FiUpload, FiPlus } from 'react-icons/fi';
import { MdArrowBack, MdPictureAsPdf } from 'react-icons/md'; // Naya icon

const StudentSidebar = () => {
  const router = useRouter();

  const openModal = (modalName: string) => {
    router.push(`/admin/students?modal=${modalName}`);
  };

  return (
    <aside className={styles.sidebarContainer}>
      <div className={styles.titleSection}>
        <h3>Student Actions</h3>
      </div>
      
      <nav className={styles.menuSection}>
        <ul>
          {/* Naya Button Yahan Add Hua Hai */}
          <li className={styles.menuItem} onClick={() => router.push('/admin/students/generate-leaving-certificate')}>
            <MdPictureAsPdf /> <span>Generate LC</span>
          </li>
          <li className={styles.menuItem} onClick={() => router.push('/admin/students/generate-bonafide')}>
            <FiFileText /> <span>Generate Bonafide</span>
          </li>
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
        {/* --- YAHAN BADLAAV KIYA GAYA HAI --- */}
        <button className={styles.dashboardButton} onClick={() => router.push('/admin/school')}>
          <MdArrowBack />
          {/* Aap text bhi badal sakte hain agar chahein */}
          <span>Go to Dashboard</span>
        </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;
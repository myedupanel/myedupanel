"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AcademicsSidebar.module.scss';
import {
  MdSchedule, MdAssignment, MdBook, MdOndemandVideo, MdAnalytics,
  MdEmojiEvents, MdGrading, MdAssessment,
  MdWbIncandescent, // Naya icon (lightbulb)
  MdArrowBack
} from 'react-icons/md';

const menuItems = [
  { title: 'Exam Schedule', path: '/admin/academics/exam-schedule', icon: <MdSchedule /> },
  { title: 'Assignments', path: '/admin/academics/assignments', icon: <MdAssignment /> },
  { title: 'Study Material', path: '/admin/academics/study-material', icon: <MdBook /> },
  { title: 'Live Classes', path: '/admin/academics/live-classes', icon: <MdOndemandVideo /> },
  { title: 'Progress & Analytics', path: '/admin/academics/analytics', icon: <MdAnalytics /> },
  { title: 'Events & Competitions', path: '/admin/academics/events', icon: <MdEmojiEvents /> },
  { title: 'Results / Report Cards', path: '/admin/academics/results', icon: <MdAssessment /> },
  { title: 'Grading System', path: '/admin/academics/grading', icon: <MdGrading /> },
  // Naya 'Brain Spark' link
  { title: 'Brain Spark', path: '/admin/academics/brain-spark', icon: <MdWbIncandescent /> },
];

const AcademicsSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebarContainer}>
      <h2 className={styles.title}>Academics</h2>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {menuItems.map((item) => (
            <li key={item.path} className={`${styles.navItem} ${pathname.startsWith(item.path) ? styles.active : ''}`}>
              <Link href={item.path}>
                <span className={styles.icon}>{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* 'Go to Dashboard' button ab aakhir mein hai */}
        <div className={styles.footerNav}>
          <hr className={styles.separator} />
          <ul className={styles.navList}>
              <li className={styles.navItem}>
                  <Link href="/admin/school">
                      <span className={styles.icon}><MdArrowBack /></span>
                      <span>Go to Dashboard</span>
                  </Link>
              </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default AcademicsSidebar;
"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AttendanceSidebar.module.scss';
import { MdPeople, MdBadge, MdAssessment, MdArrowBack } from 'react-icons/md';

const attendanceLinks = [
  { title: 'Student Attendance', path: '/admin/attendance/student', icon: <MdPeople /> },
  { title: 'Staff Attendance', path: '/admin/attendance/staff', icon: <MdBadge /> },
  { title: 'Attendance Reports', path: '/admin/attendance/reports', icon: <MdAssessment /> },
];

const AttendanceSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div>
        <Link href="/admin/dashboard" className={styles.titleLink}>
          <h4 className={styles.title}>ATTENDANCE</h4>
        </Link>
        
        <nav>
          <ul>
            {attendanceLinks.map(link => (
              <li key={link.path}>
                <Link href={link.path} className={pathname.startsWith(link.path) ? styles.active : ''}>
                  {link.icon}
                  <span>{link.title}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* --- YEH HISSA UPDATE HUA HAI --- */}
          <hr className={styles.divider} />

          <ul>
            <li>
                {/* Link ko /admin/school par point kar diya hai */}
                <Link href="/admin/school" className={styles.backLink}>
                    <MdArrowBack />
                    <span>Back to Dashboard</span>
                </Link>
            </li>
          </ul>

        </nav>
      </div>
    </aside>
  );
};

export default AttendanceSidebar;
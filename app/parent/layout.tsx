// File: app/parent/layout.tsx
// Parent Dashboard Layout

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './ParentLayout.module.scss';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('parent_token');
    const userData = localStorage.getItem('parent_user');
    
    if (!token || !userData) {
      router.push('/parent/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('parent_token');
      localStorage.removeItem('parent_user');
      router.push('/parent/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('parent_token');
    localStorage.removeItem('parent_user');
    router.push('/parent/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.headerContent}>
          <button 
            className={styles.menuButton}
            onClick={toggleSidebar}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          
          <div className={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#6366F1"/>
              <path d="M10 12L16 9L22 12V20L16 23L10 20V12Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="16" cy="16" r="2" fill="white"/>
            </svg>
            <span>Parent Portal</span>
          </div>
          
          <div className={styles.userMenu}>
            <span className={styles.userName}>{user.name}</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.schoolInfo}>
            <h2>{user.schoolName}</h2>
            <p>Parent Dashboard</p>
          </div>
          <button 
            className={styles.closeButton}
            onClick={toggleSidebar}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav className={styles.navMenu}>
          <Link href="/parent/dashboard" className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 4C3 3.44772 3.44772 3 4 3H16C16.5523 3 17 3.44772 17 4V18L10 14L3 18V4Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Dashboard</span>
          </Link>

          <Link href="/parent/attendance" className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6C3 5.44772 3.44772 5 4 5H16C16.5523 5 17 5.44772 17 6V17C17 17.5523 16.5523 18 16 18H4C3.44772 18 3 17.5523 3 17V6Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 3V7M12 3V7M3 10H17" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Attendance</span>
          </Link>

          <Link href="/parent/academics" className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 12L11 14L15 10M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Academics</span>
          </Link>

          <Link href="/parent/fees" className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M17 6H3C1.89543 6 1 6.89543 1 8V14C1 15.1046 1.89543 16 3 16H17C18.1046 16 19 15.1046 19 14V8C19 6.89543 18.1046 6 17 6Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M1 10H19" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Fees</span>
          </Link>

          <Link href="/parent/assignments" className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V4C16 2.89543 15.1046 2 14 2Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6V14M6 10H14" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Assignments</span>
          </Link>

          <Link href="/parent/study-materials" className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V4C16 2.89543 15.1046 2 14 2Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 6H12M8 10H12M8 14H10" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Study Materials</span>
          </Link>

          <Link href="/parent/messages" className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 7C3 5.89543 3.89543 5 5 5H15C16.1046 5 17 5.89543 17 7V13C17 14.1046 16.1046 15 15 15H12L9 18V15H5C3.89543 15 3 14.1046 3 13V7Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Messages</span>
          </Link>

          <Link href="/parent/notifications" className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C6.68629 2 4 4.68629 4 8V16L6 14H14L16 16V8C16 4.68629 13.3137 2 10 2Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 18C11.1046 18 12 17.1046 12 16H8C8 17.1046 8.89543 18 10 18Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Notifications</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.studentInfo}>
            <h4>{user.student?.fullName}</h4>
            <p>{user.student?.class} • {user.student?.rollNumber}</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2L2 6L6 10M2 6H11C12.1046 6 13 6.89543 13 8V12C13 13.1046 12.1046 14 11 14H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className={styles.overlay}
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
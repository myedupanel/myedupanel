"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MdEdit, MdMenu } from 'react-icons/md';
import { FaGraduationCap } from 'react-icons/fa';
import styles from './Header.module.scss';
import { useAdminLayout } from '@/app/context/AdminLayoutContext';
import AcademicYearSwitcher from '../AcademicYearSwitcher/AcademicYearSwitcher'; 

// Helper functions (Same)
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};
const formatDate = (date: Date) => {
  return date.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

interface HeaderProps {
  admin: {
    adminName: string; 
    email: string;
    profileImageUrl: string;
    schoolName: string;
  };
}

const Header = ({ admin }: HeaderProps) => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [headerTitle, setHeaderTitle] = useState(`Welcome to ${admin.schoolName}`);
  const [titleAnimationClass, setTitleAnimationClass] = useState(styles.titleFadeIn);
  const [fontSizeClass, setFontSizeClass] = useState('');
  
  const { toggleSidebar } = useAdminLayout(); // Context Hook Use Kiya

  // Calculate font size class based on school name length
  useEffect(() => {
    const schoolNameLength = admin.schoolName.length;
    if (schoolNameLength > 30) {
      setFontSizeClass(styles.extraSmallTitle);
    } else if (schoolNameLength > 25) {
      setFontSizeClass(styles.smallTitle);
    } else if (schoolNameLength > 20) {
      setFontSizeClass(styles.mediumTitle);
    } else {
      setFontSizeClass('');
    }
  }, [admin.schoolName]);

  // Animation and Time logic (Same)
  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setTitleAnimationClass(styles.titleFadeOut);
    }, 2500); 

    const changeTextTimer = setTimeout(() => {
      setHeaderTitle(`${admin.schoolName} Dashboard`); 
      setTitleAnimationClass(styles.titleFadeIn); 
    }, 3000); 

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(changeTextTimer);
    };
  }, [admin.schoolName]);
  
  useEffect(() => {
    setCurrentTime(new Date()); 
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.headerWrapper}>
      <div className={styles.titleBar}>
        
        {/* Hamburger Button (Mobile Only) */}
        <button className={styles.menuButton} onClick={toggleSidebar}>
          <MdMenu />
        </button>
        
        {/* Title with dynamic font sizing */}
        <h1 className={`${styles.pageTitle} ${titleAnimationClass} ${fontSizeClass}`}>
          {headerTitle}
        </h1>
        
        {/* Academic Year Switcher */}
        <AcademicYearSwitcher />

        {/* Profile Section (Desktop Only) */}
        <div className={styles.profileSection}>
          <div className={styles.avatarContainer}>
            <div className={`${styles.defaultAvatar} ${styles.premiumIcon}`}>
              <FaGraduationCap size={24} color="white" />
            </div>
          </div>

          <div className={styles.profileInfo}>
            <span className={styles.profileName}>School Profile</span>
          </div>
          <Link href="/admin/profile" className={styles.editButton}>
            <MdEdit size={20} />
          </Link>
        </div>
      </div>

      {/* Subtitle Bar (Same) */}
      <div className={styles.subtitleBar}>
        <p className={styles.subtitle}>Here's what's happening at your school today.</p>
        
        {currentTime && (
          <div className={styles.timeSection}>
            <span className={styles.date}>{formatDate(currentTime)}</span>
            <span className={styles.time}>{formatTime(currentTime)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
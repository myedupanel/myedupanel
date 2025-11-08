"use client";
// --- useState aur useEffect ko React se import karein ---
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MdEdit } from 'react-icons/md';
import { FaGraduationCap } from 'react-icons/fa'; // School Icon
// === NAYE IMPORTS ===
import { useTheme } from '@/app/context/ThemeContext'; // Theme context hook
import { FiSun, FiMoon } from 'react-icons/fi'; // Theme icons
// === END NAYA IMPORT ===
import styles from './Header.module.scss';

// Helper functions to format date and time (koi badlaav nahi)
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};
const formatDate = (date: Date) => {
  return date.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

// HeaderProps (koi badlaav nahi)
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
  
  // === THEME HOOK USE KAREIN ===
  const { theme, toggleTheme } = useTheme();

  // Animation wala code (koi badlaav nahi)
  const [headerTitle, setHeaderTitle] = useState(`Welcome to ${admin.schoolName}`);
  const [titleAnimationClass, setTitleAnimationClass] = useState(styles.titleFadeIn);
  
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
  // --- END Animation Code ---

  // Time wala code (koi badlaav nahi)
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
        {/* Title (koi badlaav nahi) */}
        <h1 className={`${styles.pageTitle} ${titleAnimationClass}`}>
          {headerTitle}
        </h1>

        <div className={styles.profileSection}>
          
          {/* === FIX 1: THEME TOGGLE BUTTON (School Icon ke pehle) === */}
          <button 
            onClick={toggleTheme} 
            className={`${styles.themeToggleButton} ${styles.premiumIcon}`} 
            aria-label="Toggle dark mode"
          >
            {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
          </button>
          {/* === END FIX 1 === */}

          {/* School Icon (Bina Badlaav) */}
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

      <div className={styles.subtitleBar}>
        {/* Subtitle (koi badlaav nahi) */}
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
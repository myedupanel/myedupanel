"use client";
// --- useState aur useEffect ko React se import karein ---
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MdEdit } from 'react-icons/md';
import styles from './Header.module.scss';

// Helper functions to format date and time (koi badlaav nahi)
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};
const formatDate = (date: Date) => {
  return date.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

// getInitials helper function (koi badlaav nahi)
const getInitials = (name: string) => {
  if (!name) return '?'; 
  const names = name.split(' ');
  const firstInitial = names[0]?.[0] || '';
  const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] : '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
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

  // --- YEH NAYA CODE HAI (Animation ke liye) ---
  const [headerTitle, setHeaderTitle] = useState(`Welcome to ${admin.schoolName}`);
  const [titleAnimationClass, setTitleAnimationClass] = useState(styles.titleFadeIn);
  
  useEffect(() => {
    // 1. Pehla title (Welcome to...) state mein set hai
    // 2. Ek timer set karein jo title ko fade out karega
    const fadeOutTimer = setTimeout(() => {
      setTitleAnimationClass(styles.titleFadeOut);
    }, 2500); // 2.5 second rukne ke baad fade out shuru hoga

    // 3. Ek timer set karein jo naya text daalega aur fade in karega
    const changeTextTimer = setTimeout(() => {
      setHeaderTitle(`${admin.schoolName} Dashboard`); // Title badlein
      setTitleAnimationClass(styles.titleFadeIn); // Waapis fade-in class lagayein
    }, 3000); // (2.5s wait + 0.5s fade-out animation)

    // 4. Cleanup: Agar component unmount ho (page badle) toh timers clear karein
    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(changeTextTimer);
    };
  }, [admin.schoolName]); // Yeh effect sirf ek baar run hoga
  // --- END NAYA CODE ---


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
        {/* === YAHAN BADLAAV KIYA GAYA HAI === */}
        {/* Title ab state se aa raha hai aur uspar animation class lagi hai */}
        <h1 className={`${styles.pageTitle} ${titleAnimationClass}`}>
          {headerTitle}
        </h1>
        {/* === END BADLAAV === */}

        <div className={styles.profileSection}>
          {/* Avatar Logic (koi badlaav nahi) */}
          <div className={styles.avatarContainer}>
            {admin.profileImageUrl ? (
              <Image 
                src={admin.profileImageUrl}
                alt="Admin Profile Photo" 
                width={40} 
                height={40} 
                className={styles.profileImage}
              />
            ) : (
              <div className={styles.defaultAvatar}>
                <span>{getInitials(admin.adminName)}</span>
              </div>
            )}
          </div>

          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{admin.adminName}</span>
          </div>
          <Link href="/admin/profile" className={styles.editButton}>
            <MdEdit size={20} />
          </Link>
        </div>
      </div>

      <div className={styles.subtitleBar}>
        {/* Subtitle se "Dashboard" hata diya, kyunki woh ab main title mein hai */}
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
"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MdEdit } from 'react-icons/md';
import styles from './Header.module.scss';

// Helper functions to format date and time
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};
const formatDate = (date: Date) => {
  return date.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

// --- NAYA HELPER FUNCTION: Naam se Initials nikaalne ke liye ---
const getInitials = (name: string) => {
  if (!name) return '?'; // Agar naam na ho
  const names = name.split(' ');
  const firstInitial = names[0]?.[0] || '';
  const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] : '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};
// --- End Helper Function ---

interface HeaderProps {
  admin: {
    adminName: string; 
    email: string;
    profileImageUrl: string;
  };
}

const Header = ({ admin }: HeaderProps) => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

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
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <div className={styles.profileSection}>

          {/* --- BADLAV YAHAN HAI: Avatar Logic --- */}
          <div className={styles.avatarContainer}>
            {admin.profileImageUrl ? (
              // Agar profile photo hai, toh use dikhao
              <Image 
                src={admin.profileImageUrl}
                alt="Admin Profile Photo" 
                width={40} 
                height={40} 
                className={styles.profileImage}
              />
            ) : (
              // Agar photo nahi hai, toh initials waala default avatar dikhao
              <div className={styles.defaultAvatar}>
                <span>{getInitials(admin.adminName)}</span>
              </div>
            )}
          </div>
          {/* --- End Avatar Logic --- */}

          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{admin.adminName}</span>
          </div>
          <Link href="/admin/profile" className={styles.editButton}>
            <MdEdit size={20} />
          </Link>
        </div>
      </div>

      <div className={styles.subtitleBar}>
        <p className={styles.subtitle}>Here's what's happening with your school today.</p>
        
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
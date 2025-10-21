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

// --- BADLAV 1: Interface ko 'adminName' use karne ke liye update kiya ---
interface HeaderProps {
  admin: {
    adminName: string; // 'name' ki jagah 'adminName'
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
          <Image 
            src={admin.profileImageUrl || '/default-avatar.png'}
            alt="Admin Profile Photo" 
            width={40} 
            height={40} 
            className={styles.profileImage}
          />
          <div className={styles.profileInfo}>
            {/* --- BADLAV 2: 'admin.name' ki jagah 'admin.adminName' ka istemal kiya --- */}
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
"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MdEdit } from 'react-icons/md';
import styles from './WelcomeHeader.module.scss';

// The component now needs the full admin object
interface WelcomeHeaderProps {
  admin: {
    name: string;
    email: string;
    profileImageUrl: string;
  };
}

const WelcomeHeader = ({ admin }: WelcomeHeaderProps) => {
  return (
    <div className={styles.headerContainer}>
      {/* Left Side: Welcome Message */}
      <div className={styles.welcomeMessage}>
        <h1 className={styles.title}>Welcome Back, <strong>{admin.name}!</strong></h1>
        <p className={styles.subtitle}>Here's what's happening with your school today.</p>
      </div>

      {/* Right Side: Profile Section */}
      <div className={styles.profileSection}>
        <Image
          src={admin.profileImageUrl}
          alt="Admin Profile Photo"
          width={40}
          height={40}
          className={styles.profileImage}
        />
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>{admin.name}</span>
          <span className={styles.profileEmail}>{admin.email}</span>
        </div>
        <Link href="/admin/profile" className={styles.editButton}>
          <MdEdit size={20} />
        </Link>
      </div>
    </div>
  );
};

export default WelcomeHeader;
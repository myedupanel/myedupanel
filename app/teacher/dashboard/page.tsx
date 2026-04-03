// app/teacher/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import styles from './TeacherDashboard.module.scss';
import { FiUser, FiBook, FiCalendar, FiSettings, FiLogOut } from 'react-icons/fi';
import Link from 'next/link';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.welcomeSection}>
          <div className={styles.avatarContainer}>
            <FiUser className={styles.userIcon} />
          </div>
          <div className={styles.welcomeText}>
            <h1>Welcome, <span className={styles.userName}>{user?.name}</span></h1>
            <p className={styles.subtitle}>Teacher Dashboard</p>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.timeDisplay}>
            <span className={styles.date}>{formatDate(currentTime)}</span>
            <span className={styles.time}>{formatTime(currentTime)}</span>
          </div>
          <button className={styles.logoutButton} onClick={logout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.greetingCard}>
          <h2>Hello, {user?.name}!</h2>
          <p>Welcome to your personalized teacher dashboard. Here you can manage your classes, attendance, and other teaching activities.</p>
        </div>

        {/* Features Grid */}
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FiBook />
            </div>
            <h3>My Classes</h3>
            <p>View and manage your assigned classes and subjects.</p>
            <Link href="#" className={styles.featureLink}>View Classes</Link>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FiCalendar />
            </div>
            <h3>Attendance</h3>
            <p>Track and manage student attendance for your classes.</p>
            <Link href="#" className={styles.featureLink}>Take Attendance</Link>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FiSettings />
            </div>
            <h3>Profile Settings</h3>
            <p>Update your personal information and preferences.</p>
            <Link href="#" className={styles.featureLink}>Manage Profile</Link>
          </div>
        </div>

        {/* Upcoming Features Section */}
        <div className={styles.upcomingSection}>
          <div className={styles.sectionHeader}>
            <h2>Upcoming Features</h2>
            <span className={styles.badge}>Coming Soon</span>
          </div>
          
          <div className={styles.upcomingFeatures}>
            <div className={styles.upcomingFeature}>
              <div className={styles.featureIndicator}></div>
              <div className={styles.featureContent}>
                <h4>Grade Management</h4>
                <p>Easily assign and track student grades and performance.</p>
              </div>
            </div>
            
            <div className={styles.upcomingFeature}>
              <div className={styles.featureIndicator}></div>
              <div className={styles.featureContent}>
                <h4>Lesson Planning</h4>
                <p>Create and organize lesson plans with integrated resources.</p>
              </div>
            </div>
            
            <div className={styles.upcomingFeature}>
              <div className={styles.featureIndicator}></div>
              <div className={styles.featureContent}>
                <h4>Communication Portal</h4>
                <p>Connect with students, parents, and colleagues seamlessly.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} MyEduPanel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default TeacherDashboard;
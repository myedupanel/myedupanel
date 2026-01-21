// File: app/parent/dashboard/page.tsx
// Parent Dashboard Home Page

'use client';

import { useState, useEffect } from 'react';
import styles from './ParentDashboard.module.scss';

interface DashboardData {
  student: {
    id: number;
    name: string;
    rollNumber: string;
    class: string;
    admissionDate: string;
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    percentage: number;
    recentAttendance: any[];
  };
  academics: {
    averagePercentage: number;
    recentMarks: any[];
    totalSubjects: number;
  };
  fees: {
    totalAmount: number;
    totalPaid: number;
    totalBalance: number;
    pendingFees: number;
    recentTransactions: any[];
  };
  upcomingEvents: any[];
}

export default function ParentDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('parent_token');
      if (!token) {
        window.location.href = '/parent/login';
        return;
      }

      const response = await fetch('/api/parent-dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('parent_token');
          localStorage.removeItem('parent_user');
          window.location.href = '/parent/login';
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <div className={`${styles.statCard} ${styles[color]}`}>
      <div className={styles.cardIcon}>{icon}</div>
      <div className={styles.cardContent}>
        <h3>{title}</h3>
        <p className={styles.value}>{value}</p>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
          </svg>
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={styles.emptyContainer}>
        <p>No dashboard data available</p>
      </div>
    );
  }

  const { student, attendance, academics, fees, upcomingEvents } = dashboardData;

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Welcome back, {localStorage.getItem('parent_user') ? JSON.parse(localStorage.getItem('parent_user')!).name : 'Parent'}!</h1>
          <p>Here's your child's academic overview</p>
        </div>
        <div className={styles.refreshButton}>
          <button onClick={fetchDashboardData}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 6C14 3.79086 12.2091 2 10 2C8.5733 2 7.33799 2.83982 6.66432 4.05004M2 10C2 12.2091 3.79086 14 6 14C7.4267 14 8.66201 13.1602 9.33568 11.9499M4.33999 10H2V13.5M11.66 6H14V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Student Info Banner */}
      <div className={styles.studentBanner}>
        <div className={styles.studentInfo}>
          <div className={styles.avatar}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#6366F1"/>
              <path d="M16 32V28C16 25.7909 17.7909 24 20 24H28C30.2091 24 32 25.7909 32 28V32" stroke="white" strokeWidth="2"/>
              <circle cx="24" cy="18" r="6" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <div>
            <h2>{student.name}</h2>
            <p>Class {student.class} • Roll No: {student.rollNumber}</p>
            <span className={styles.admissionDate}>
              Admission: {new Date(student.admissionDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Attendance Rate"
          value={`${attendance.percentage}%`}
          subtitle={`${attendance.presentDays}/${attendance.totalDays} days present`}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          color="green"
        />

        <StatCard
          title="Academic Average"
          value={`${academics.averagePercentage}%`}
          subtitle={`Across ${academics.totalSubjects} subjects`}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 17L15 11M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          color="blue"
        />

        <StatCard
          title="Pending Fees"
          value={`₹${fees.totalBalance.toLocaleString()}`}
          subtitle={`${fees.pendingFees} pending records`}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          color="orange"
        />

        <StatCard
          title="Upcoming Events"
          value={upcomingEvents.length}
          subtitle="This month"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
          }
          color="purple"
        />
      </div>

      {/* Recent Activity Section */}
      <div className={styles.activitySection}>
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3>Recent Marks</h3>
            <button className={styles.viewAllButton}>View All</button>
          </div>
          <div className={styles.marksList}>
            {academics.recentMarks.slice(0, 5).map((mark: any, index: number) => (
              <div key={index} className={styles.markItem}>
                <div className={styles.markSubject}>{mark.subject}</div>
                <div className={styles.markDetails}>
                  <span className={styles.marks}>{mark.marksObtained}/{mark.maxMarks}</span>
                  <span className={`${styles.percentage} ${
                    mark.percentage >= 80 ? styles.excellent :
                    mark.percentage >= 60 ? styles.good :
                    mark.percentage >= 40 ? styles.average : styles.poor
                  }`}>
                    {mark.percentage}%
                  </span>
                  {mark.grade && <span className={styles.grade}>{mark.grade}</span>}
                </div>
                <div className={styles.examName}>{mark.examName}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3>Recent Transactions</h3>
            <button className={styles.viewAllButton}>View All</button>
          </div>
          <div className={styles.transactionsList}>
            {fees.recentTransactions.slice(0, 3).map((transaction: any, index: number) => (
              <div key={index} className={styles.transactionItem}>
                <div className={styles.transactionInfo}>
                  <span className={styles.amount}>₹{transaction.amountPaid.toLocaleString()}</span>
                  <span className={styles.date}>
                    {new Date(transaction.paymentDate).toLocaleDateString()}
                  </span>
                </div>
                <span className={`${styles.status} ${styles.paid}`}>Paid</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <button className={styles.actionButton}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M17 6H3C1.89543 6 1 6.89543 1 8V14C1 15.1046 1.89543 16 3 16H17C18.1046 16 19 15.1046 19 14V8C19 6.89543 18.1046 6 17 6Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M1 10H19" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Pay Fees
          </button>
          
          <button className={styles.actionButton}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V4C16 2.89543 15.1046 2 14 2Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6V14M6 10H14" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Submit Assignment
          </button>
          
          <button className={styles.actionButton}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 7C3 5.89543 3.89543 5 5 5H15C16.1046 5 17 5.89543 17 7V13C17 14.1046 16.1046 15 15 15H12L9 18V15H5C3.89543 15 3 14.1046 3 13V7Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Message Teacher
          </button>
          
          <button className={styles.actionButton}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C6.68629 2 4 4.68629 4 8V16L6 14H14L16 16V8C16 4.68629 13.3137 2 10 2Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 18C11.1046 18 12 17.1046 12 16H8C8 17.1046 8.89543 18 10 18Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            View Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
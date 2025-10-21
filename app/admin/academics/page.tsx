import React from 'react';
import styles from './AcademicsDashboard.module.scss';
import StatCard from '@/components/admin/academics/StatCard';
import PerformanceChart from '@/components/admin/academics/PerformanceChart';
import UpcomingExamsList from '@/components/admin/academics/UpcomingExamsList';
// Naya component import karein
import RecentAssignmentsList from '@/components/admin/academics/RecentAssignmentsList';
import { MdEventAvailable, MdAssignment, MdBook } from 'react-icons/md';

const AcademicsDashboardPage = () => {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.header}>
        <h1>Academics Dashboard</h1>
        <p>A summary of all academic activities in the school.</p>
      </div>

      <div className={styles.dashboardGrid}>
        {/* Row 1: Stat Cards */}
        <StatCard icon={<MdEventAvailable size={24} />} value="7" title="Upcoming Exams" theme="blue" />
        <StatCard icon={<MdAssignment size={24} />} value="15" title="Assignments to Grade" theme="orange" />
        <StatCard icon={<MdBook size={24} />} value="92%" title="Attendance Today" theme="green" />

        {/* Row 2, Left: Chart */}
        <div className={styles.mainChart}>
          <PerformanceChart />
        </div>

        {/* Row 2, Right Top: Upcoming Exams List */}
        <div className={styles.upcomingExams}>
          <UpcomingExamsList />
        </div>

        {/* Row 2, Right Bottom: Recent Assignments List */}
        <div className={styles.recentAssignments}>
          <RecentAssignmentsList />
        </div>
      </div>
    </div>
  );
};

export default AcademicsDashboardPage;
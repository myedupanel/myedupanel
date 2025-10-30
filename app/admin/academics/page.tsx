// page.tsx (ya jahaan bhi AcademicsDashboardPage hai)

"use client"; 

import React, { useState, useEffect } from 'react';
import styles from './AcademicsDashboard.module.scss';
import StatCard from '@/components/admin/academics/StatCard';
import PerformanceChart from '@/components/admin/academics/PerformanceChart';
import UpcomingExamsList from '@/components/admin/academics/UpcomingExamsList';
import RecentAssignmentsList from '@/components/admin/academics/RecentAssignmentsList';
import { MdEventAvailable, MdAssignment, MdBook } from 'react-icons/md';
import api from '@/backend/utils/api'; 

// Interfaces
interface Exam {
  id: string; name: string; subject: string;
  className: string; date: string; examType: string;
}
interface Assignment {
  id: string; title: string; classInfo: string;
  status: 'Pending' | 'Submitted' | 'Graded';
}
interface AttendanceSummary {
  percentage: number;
}
interface PerformanceData {
  subject: string;
  average: number;
}

const AcademicsDashboardPage = () => {

  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]); 

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // === FIX START: Promise.all ko Promise.allSettled se badla ===
        // Yeh sabhi calls ko try karega, bhale hi koi fail ho jaaye
        const [
          examsResult, 
          assignmentsResult, 
          attendanceResult,
          performanceResult
        ] = await Promise.allSettled([
          api.get('/academics/exams'),
          api.get('/academics/assignments'),
          api.get<AttendanceSummary>('/academics/attendance-summary'),
          api.get<PerformanceData[]>('/academics/performance')
        ]);
        // === END FIX ===

        const failedServices: string[] = []; // Kaunsi call fail hui, uska track rakhein

        // === FIX START: Har result ko alag-alag check karein ===
        if (examsResult.status === 'fulfilled') {
          setUpcomingExams(examsResult.value.data);
        } else {
          failedServices.push('Exams');
          console.error("Exams API failed:", examsResult.reason);
        }
        
        if (assignmentsResult.status === 'fulfilled') {
          setRecentAssignments(assignmentsResult.value.data);
        } else {
          failedServices.push('Assignments');
          console.error("Assignments API failed:", assignmentsResult.reason);
        }

        if (attendanceResult.status === 'fulfilled') {
          setAttendancePercent(attendanceResult.value.data.percentage);
        } else {
          failedServices.push('Attendance');
          console.error("Attendance API failed:", attendanceResult.reason);
        }

        if (performanceResult.status === 'fulfilled') {
          setPerformanceData(performanceResult.value.data);
        } else {
          failedServices.push('Performance');
          console.error("Performance API failed:", performanceResult.reason);
        }
        
        // Agar koi bhi service fail hui, toh specific error dikhayein
        if (failedServices.length > 0) {
            setError(`Could not load data for: ${failedServices.join(', ')}. Please try again.`);
        }
        // === END FIX ===
        
      } catch (err: any) {
        // Yeh catch ab sirf poore system ke fail hone par hi trigger hoga
        console.error("Failed to fetch dashboard data (unexpected error):", err);
        setError("Could not load academic data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []); 

  if (isLoading) {
    return <div className={styles.loadingMessage}>Loading Academics Dashboard...</div>;
  }
  
  // Hum error dikhayenge, lekin data (jo load hua) phir bhi render hoga
  // Isliye error check ko neeche move kar diya hai (optional, par behtar hai)
  
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.header}> 
        <h1>Academics Dashboard</h1>
        <p>A summary of all academic activities in the school.</p>
      </div>

      {/* Error ko page ke top par dikhayein */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.dashboardGrid}>
        
        <StatCard 
          icon={<MdEventAvailable size={24} />} 
          value={String(upcomingExams.length)} 
          title="Upcoming Exams" 
          theme="blue" 
        />
        
        <StatCard 
          icon={<MdAssignment size={24} />} 
          value={String(recentAssignments.length)}
          title="Assignments to Grade" 
          theme="orange" 
        />
        
        <StatCard 
          icon={<MdBook size={24} />} 
          value={`${attendancePercent.toFixed(0)}%`}
          title="Attendance Today" 
          theme="green" 
        />

        <div className={styles.mainChart}>
          <PerformanceChart data={performanceData} />
        </div>

        <div className={styles.upcomingExams}>
          <UpcomingExamsList exams={upcomingExams} />
        </div>

        <div className={styles.recentAssignments}>
          <RecentAssignmentsList assignments={recentAssignments} />
        </div>
        
      </div>
    </div>
  );
};

export default AcademicsDashboardPage;
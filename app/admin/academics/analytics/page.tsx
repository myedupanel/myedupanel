"use client";
import React, { useState, useEffect } from 'react'; // --- FIX: Imported useEffect ---
import styles from './AnalyticsPage.module.scss';
import { MdTrendingUp, MdTaskAlt, MdDonutLarge, MdPeople, MdCheckCircle } from 'react-icons/md';

// Import all necessary chart components
import ScoreTrendChart from '@/components/admin/academics/ScoreTrendChart';
import SubjectMasteryChart from '@/components/admin/academics/SubjectMasteryChart';
import ClassPerformers from '@/components/admin/academics/ClassPerformers';
import ClassSubjectChart from '@/components/admin/academics/ClassSubjectChart';
import ClassPerformanceChart from '@/components/admin/academics/ClassPerformanceChart';
import SubjectPerformanceChart from '@/components/admin/academics/SubjectPerformanceChart';

import api from '@/backend/utils/api'; // --- FIX: Import API utility ---

// --- FIX: Define interfaces for API data structures ---
// We'll define these based on what the backend will send

// For student dropdown
interface SimpleStudent {
  id: string;
  name: string;
}

// For student analytics data
interface StudentAnalyticsData {
  attendance: number;
  averageScore: number;
  assignmentsCount: number; // Renamed for clarity
  scoreTrend: { name: string; score: number }[]; // Assuming name is exam/test name
  subjectMastery: { subject: string; score: number }[];
}

// For class analytics data
interface ClassAnalyticsData {
  classAttendance: number;
  classAverageScore: number;
  totalAssignments: number;
  topPerformers: { name: string; averageScore: number }[];
  bottomPerformers: { name: string; averageScore: number }[];
  classSubjectAverages: { subject: string; score: number }[];
  // Include student list if needed for other parts, or assume fetched separately
}

// For overall analytics data
interface OverallAnalyticsData {
  totalStudents: number;
  overallAttendance: number;
  overallAverageScore: number;
  classPerformance: { name: string; averageScore: number }[];
  subjectPerformance: { subject: string; averageScore: number }[];
}

// Type for the state holding the result of the analytics API call
type AnalyticsResult = StudentAnalyticsData | ClassAnalyticsData | OverallAnalyticsData | null;


// --- REMOVED MOCK DATA and HELPER FUNCTION ---

const AnalyticsPage = () => {
  const [viewMode, setViewMode] = useState<'By Student' | 'By Class' | 'Overall School'>('By Student');
  
  // --- FIX: State for fetched data ---
  const [studentList, setStudentList] = useState<SimpleStudent[]>([]);
  const [classList, setClassList] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(''); // Store ID
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [analyticsResult, setAnalyticsResult] = useState<AnalyticsResult>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading for initial lists
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false); // Loading for analytics data
  const [error, setError] = useState<string | null>(null);

  // --- FIX: Fetch initial student and class lists ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [studentsRes, classesRes] = await Promise.allSettled([
          // Assuming an endpoint like this exists or will be created
          api.get('/students?fields=name,id&limit=1000'), // Fetch only name and ID, increase limit if needed
          api.get('/students/classes') // We created this endpoint
        ]);

        let initialStudentId = '';
        let initialClass = '';

        if (studentsRes.status === 'fulfilled' && studentsRes.value.data.length > 0) {
          setStudentList(studentsRes.value.data);
          initialStudentId = studentsRes.value.data[0].id; // Default to first student ID
          setSelectedStudentId(initialStudentId);
        } else {
          console.error("Failed to fetch student list:", studentsRes.status === 'rejected' ? studentsRes.reason : 'No data');
          // Handle error or empty state for student list if needed
        }

        if (classesRes.status === 'fulfilled' && classesRes.value.data.length > 0) {
          setClassList(classesRes.value.data);
          initialClass = classesRes.value.data[0]; // Default to first class
          setSelectedClass(initialClass);
        } else {
           console.error("Failed to fetch class list:", classesRes.status === 'rejected' ? classesRes.reason : 'No data');
           // Handle error or empty state for class list if needed
        }

        // Trigger analytics fetch for the default view and selections *after* setting initial state
        // We'll rely on the next useEffect to handle this based on state changes

      } catch (err) {
        console.error("Unexpected error fetching initial data:", err);
        setError("Could not load initial student/class data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []); // Run only once on mount

  // --- FIX: Fetch analytics data based on viewMode and selections ---
  useEffect(() => {
    // Don't fetch if initial lists haven't loaded yet or selections are missing
    if (isLoading || (viewMode === 'By Student' && !selectedStudentId) || (viewMode === 'By Class' && !selectedClass)) {
        // If loading initial data, or selections aren't ready, clear old results
        setAnalyticsResult(null);
        return;
    }

    const fetchAnalytics = async () => {
      setIsAnalyticsLoading(true);
      setError(null);
      setAnalyticsResult(null); // Clear previous results before fetching new ones
      let apiUrl = '';

      try {
        if (viewMode === 'By Student') {
          apiUrl = `/analytics/student/${selectedStudentId}`;
        } else if (viewMode === 'By Class') {
          // Ensure className is URL-encoded if it contains spaces or special characters
          apiUrl = `/analytics/class/${encodeURIComponent(selectedClass)}`;
        } else if (viewMode === 'Overall School') {
          apiUrl = `/analytics/overall`;
        } else {
            return; // Should not happen
        }

        const response = await api.get(apiUrl);
        setAnalyticsResult(response.data);

      } catch (err: any) {
        console.error(`Failed to fetch ${viewMode} analytics:`, err);
        setError(`Could not load analytics data for ${viewMode}. ${err.response?.data?.msg || err.message}`);
      } finally {
        setIsAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [viewMode, selectedStudentId, selectedClass, isLoading]); // Re-run when mode, selection, or initial loading state changes

  // --- FIX: Removed useMemo hook, data comes from analyticsResult state ---

  // --- FIX: Helper function to safely get student name from ID ---
  const getStudentNameById = (id: string): string => {
      return studentList.find(s => s.id === id)?.name || 'Loading...';
  }


  // --- FIX: Handle initial loading state ---
  if (isLoading) {
      return <div className={styles.loadingMessage}>Loading initial data...</div>;
  }

  return (
    <div className={styles.pageContainer}>
        {/* Header Section */}
        <div className={styles.header}>
            <div className={styles.titleSection}>
                <h1>Progress & Analytics</h1>
                <p>Detailed performance report of the school.</p>
            </div>
            <div className={styles.viewToggle}>
                <button className={viewMode === 'Overall School' ? styles.active : ''} onClick={() => setViewMode('Overall School')}>Overall School</button>
                <button className={viewMode === 'By Class' ? styles.active : ''} onClick={() => setViewMode('By Class')}>By Class</button>
                <button className={viewMode === 'By Student' ? styles.active : ''} onClick={() => setViewMode('By Student')}>By Student</button>
            </div>
        </div>

        {/* Filter Section - Populate from state */}
        <div className={styles.filterSection}>
            {viewMode === 'By Student' && (
                <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} disabled={studentList.length === 0}>
                    {studentList.length > 0 ? (
                        studentList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    ) : (
                        <option>No students found</option>
                    )}
                </select>
            )}
            {viewMode === 'By Class' && (
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} disabled={classList.length === 0}>
                     {classList.length > 0 ? (
                        classList.map(c => <option key={c} value={c}>{c}</option>)
                     ) : (
                         <option>No classes found</option>
                     )}
                </select>
            )}
            {/* No filter needed for Overall School view */}
        </div>

        {/* --- FIX: Display Loading/Error for Analytics --- */}
        {isAnalyticsLoading && <div className={styles.loadingMessage}>Loading analytics data...</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* --- FIX: Render views based on analyticsResult and viewMode --- */}

        {/* By Student View */}
        {!isAnalyticsLoading && !error && viewMode === 'By Student' && analyticsResult && (
             // Type guard to ensure analyticsResult is StudentAnalyticsData
             typeof (analyticsResult as StudentAnalyticsData).attendance !== 'undefined' &&
            <div className={styles.analyticsGrid}>
                {/* Stat Cards */}
                <div className={styles.statCard}><MdDonutLarge className={`${styles.icon} ${styles.blue}`} /><h4>{(analyticsResult as StudentAnalyticsData).attendance}%</h4><p>Attendance</p></div>
                <div className={styles.statCard}><MdTrendingUp className={`${styles.icon} ${styles.green}`} /><h4>{(analyticsResult as StudentAnalyticsData).averageScore}%</h4><p>Average Score</p></div>
                <div className={styles.statCard}><MdTaskAlt className={`${styles.icon} ${styles.orange}`} /><h4>{(analyticsResult as StudentAnalyticsData).assignmentsCount}</h4><p>Assignments</p></div>
                {/* Charts */}
                <div className={styles.chartContainer}><ScoreTrendChart data={(analyticsResult as StudentAnalyticsData).scoreTrend} /></div>
                <div className={styles.chartContainer}><SubjectMasteryChart data={(analyticsResult as StudentAnalyticsData).subjectMastery} /></div>
            </div>
        )}

        {/* By Class View */}
         {!isAnalyticsLoading && !error && viewMode === 'By Class' && analyticsResult && (
             // Type guard to ensure analyticsResult is ClassAnalyticsData
             typeof (analyticsResult as ClassAnalyticsData).classAttendance !== 'undefined' &&
            <div className={styles.analyticsGrid}>
                {/* Stat Cards */}
                <div className={styles.statCard}><MdDonutLarge className={`${styles.icon} ${styles.blue}`} /><h4>{(analyticsResult as ClassAnalyticsData).classAttendance}%</h4><p>Class Attendance</p></div>
                <div className={styles.statCard}><MdTrendingUp className={`${styles.icon} ${styles.green}`} /><h4>{(analyticsResult as ClassAnalyticsData).classAverageScore}%</h4><p>Class Avg. Score</p></div>
                <div className={styles.statCard}><MdTaskAlt className={`${styles.icon} ${styles.orange}`} /><h4>{(analyticsResult as ClassAnalyticsData).totalAssignments}</h4><p>Total Assignments</p></div>
                {/* Components */}
                <div className={styles.chartContainer}><ClassPerformers top={(analyticsResult as ClassAnalyticsData).topPerformers || []} bottom={(analyticsResult as ClassAnalyticsData).bottomPerformers || []} /></div>
                <div className={styles.chartContainer}><ClassSubjectChart data={(analyticsResult as ClassAnalyticsData).classSubjectAverages || []} /></div>
            </div>
        )}

        {/* Overall School View */}
        {!isAnalyticsLoading && !error && viewMode === 'Overall School' && analyticsResult && (
             // Type guard to ensure analyticsResult is OverallAnalyticsData
             typeof (analyticsResult as OverallAnalyticsData).totalStudents !== 'undefined' &&
            <div className={styles.analyticsGrid}>
                {/* Stat Cards */}
                <div className={styles.statCard}><MdPeople className={`${styles.icon} ${styles.blue}`} /><h4>{(analyticsResult as OverallAnalyticsData).totalStudents}</h4><p>Total Students</p></div>
                <div className={styles.statCard}><MdDonutLarge className={`${styles.icon} ${styles.green}`} /><h4>{(analyticsResult as OverallAnalyticsData).overallAttendance}%</h4><p>Overall Attendance</p></div>
                <div className={styles.statCard}><MdCheckCircle className={`${styles.icon} ${styles.orange}`} /><h4>{(analyticsResult as OverallAnalyticsData).overallAverageScore}%</h4><p>Overall Avg. Score</p></div>
                {/* Charts */}
                <div className={styles.chartContainer}><ClassPerformanceChart data={(analyticsResult as OverallAnalyticsData).classPerformance} /></div>
                <div className={styles.chartContainer}><SubjectPerformanceChart data={(analyticsResult as OverallAnalyticsData).subjectPerformance || []} /></div>
            </div>
        )}

        {/* --- FIX: Show message if no analytics data loaded --- */}
        {!isAnalyticsLoading && !error && !analyticsResult && (
             <p className={styles.loadingMessage}>Select options to view analytics.</p>
        )}

    </div>
  );
};

export default AnalyticsPage;
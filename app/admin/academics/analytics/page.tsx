"use client";
import React, { useState, useMemo } from 'react';
import styles from './AnalyticsPage.module.scss';
import { MdTrendingUp, MdTaskAlt, MdDonutLarge, MdPeople, MdCheckCircle } from 'react-icons/md';

// Import all necessary chart components
import ScoreTrendChart from '@/components/admin/academics/ScoreTrendChart';
import SubjectMasteryChart from '@/components/admin/academics/SubjectMasteryChart';
import ClassPerformers from '@/components/admin/academics/ClassPerformers';
import ClassSubjectChart from '@/components/admin/academics/ClassSubjectChart';
import ClassPerformanceChart from '@/components/admin/academics/ClassPerformanceChart';
import SubjectPerformanceChart from '@/components/admin/academics/SubjectPerformanceChart';

// Define the structure for student data
interface Score { name?: string; score: number; }
interface SubjectScore { subject: string; score: number; }
interface StudentData {
  name: string;
  class: string;
  attendance: number;
  assignmentsSubmitted: number;
  scoreTrend: Score[];
  subjectMastery: SubjectScore[];
}


// Helper function to calculate average score
const getAverageScore = (scores: Score[]): number => {
  if (!scores || scores.length === 0) return 0;
  // FIX 1: Explicitly typing all arguments
  return Math.round(scores.reduce((acc: number, cur: Score) => acc + Number(cur.score || 0), 0) / scores.length);
};

// Mock "Database" using the defined interface
const studentDatabase: StudentData[] = [
  { name: 'Aarav Sharma', class: 'Grade 10', attendance: 95, assignmentsSubmitted: 15, scoreTrend: [ { name: 'UT 1', score: 85 }, { name: 'Finals', score: 94 }, ], subjectMastery: [ { subject: 'Maths', score: 95 }, { subject: 'Science', score: 98 }, { subject: 'English', score: 88 } ], },
  { name: 'Priya Patel', class: 'Grade 10', attendance: 91, assignmentsSubmitted: 13, scoreTrend: [ { name: 'UT 1', score: 78 }, { name: 'Finals', score: 85 }, ], subjectMastery: [ { subject: 'Maths', score: 82 }, { subject: 'Science', score: 88 }, { subject: 'English', score: 90 } ], },
  { name: 'Rohan Mehta', class: 'Grade 9', attendance: 88, assignmentsSubmitted: 12, scoreTrend: [ { name: 'UT 1', score: 72 }, { name: 'Finals', score: 79 }, ], subjectMastery: [ { subject: 'Maths', score: 75 }, { subject: 'Science', score: 81 }, { subject: 'English', score: 77 } ], },
  { name: 'Sneha Gupta', class: 'Grade 9', attendance: 96, assignmentsSubmitted: 14, scoreTrend: [ { name: 'UT 1', score: 90 }, { name: 'Finals', score: 95 }, ], subjectMastery: [ { subject: 'Maths', score: 92 }, { subject: 'Science', score: 96 }, { subject: 'English', score: 94 } ], },
];


const AnalyticsPage = () => {
  const [viewMode, setViewMode] = useState<'By Student' | 'By Class' | 'Overall School'>('By Student');
  const [selectedStudentName, setSelectedStudentName] = useState('Aarav Sharma');
  const [selectedClass, setSelectedClass] = useState('Grade 10');

  const analyticsData = useMemo(() => {
    const classOptions = [...new Set(studentDatabase.map(s => s.class))];

    if (viewMode === 'By Student') {
      const student = studentDatabase.find(s => s.name === selectedStudentName);
      return { student };
    }

    if (viewMode === 'By Class') {
      const studentsInClass = studentDatabase.filter(s => s.class === selectedClass);
      if (studentsInClass.length === 0) return { studentsInClass: [] };

      const withAvg = studentsInClass.map(s => ({
          name: s.name,
          averageScore: getAverageScore(s.scoreTrend)
        })).sort((a, b) => b.averageScore - a.averageScore);

      const subjectScores: { [key: string]: number[] } = {};
      studentsInClass.forEach(s => {
        s.subjectMastery.forEach(sub => {
          (subjectScores[sub.subject] = subjectScores[sub.subject] || []).push(Number(sub.score || 0));
        });
      });
      const subjectAverages = Object.keys(subjectScores).map(subject => ({
          subject,
          score: Math.round(subjectScores[subject].reduce((a, b) => a + b, 0) / subjectScores[subject].length)
        }));

      return {
          studentsInClass,
          topPerformers: withAvg.slice(0, 3),
          bottomPerformers: withAvg.slice(-3).reverse(),
          classSubjectAverages: subjectAverages,
          classAverageScore: getAverageScore(studentsInClass.flatMap(s => s.scoreTrend)),
        };
    }

     if (viewMode === 'Overall School') {
        const classPerformance = classOptions.map(cls => {
            const studentsInClass = studentDatabase.filter(s => s.class === cls);
            return { name: cls, averageScore: getAverageScore(studentsInClass.flatMap(s => s.scoreTrend)) };
        });

        const subjectScores: { [key: string]: number[] } = {};
        studentDatabase.forEach(s => {
            s.subjectMastery.forEach(sub => {
                (subjectScores[sub.subject] = subjectScores[sub.subject] || []).push(Number(sub.score || 0));
            });
        });
        const subjectPerformance = Object.keys(subjectScores).map(subject => ({
            subject,
            averageScore: Math.round(subjectScores[subject].reduce((a, b) => a + b, 0) / subjectScores[subject].length)
        }));

        return {
            totalStudents: studentDatabase.length,
            // FIX 2: Explicitly typing all arguments
            overallAttendance: Math.round(studentDatabase.reduce((acc: number, s: StudentData) => acc + Number(s.attendance || 0), 0) / studentDatabase.length),
            classPerformance,
            subjectPerformance,
        };
    }
    return {}; // Default
  }, [viewMode, selectedStudentName, selectedClass]);

  const classOptions = [...new Set(studentDatabase.map(s => s.class))];

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

        {/* Filter Section */}
        <div className={styles.filterSection}>
            {viewMode === 'By Student' && (
                <select value={selectedStudentName} onChange={(e) => setSelectedStudentName(e.target.value)}>
                    {studentDatabase.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
            )}
            {viewMode === 'By Class' && (
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select> 
            )}
        </div>

        {/* By Student View */}
        {viewMode === 'By Student' && analyticsData.student && (
            <div className={styles.analyticsGrid}>
                {/* Stat Cards */}
                <div className={styles.statCard}><MdDonutLarge className={`${styles.icon} ${styles.blue}`} /><h4>{analyticsData.student.attendance}%</h4><p>Attendance</p></div>
                <div className={styles.statCard}><MdTrendingUp className={`${styles.icon} ${styles.green}`} /><h4>{getAverageScore(analyticsData.student.scoreTrend)}%</h4><p>Average Score</p></div>
                <div className={styles.statCard}><MdTaskAlt className={`${styles.icon} ${styles.orange}`} /><h4>{analyticsData.student.assignmentsSubmitted}</h4><p>Assignments</p></div>
                {/* Charts */}
                <div className={styles.chartContainer}><ScoreTrendChart data={analyticsData.student.scoreTrend} /></div>
                <div className={styles.chartContainer}><SubjectMasteryChart data={analyticsData.student.subjectMastery} /></div>
            </div>
        )}

        {/* By Class View */}
        {viewMode === 'By Class' && analyticsData.studentsInClass && analyticsData.studentsInClass.length > 0 && (
            <div className={styles.analyticsGrid}>
                {/* Stat Cards */}
                {/* ===== YEH HAI AAKHRI FIX (Line 161) ===== */}
                <div className={styles.statCard}><MdDonutLarge className={`${styles.icon} ${styles.blue}`} /><h4>{`${Math.round(analyticsData.studentsInClass.reduce((acc: number, s: StudentData) => acc + Number(s.attendance || 0), 0) / analyticsData.studentsInClass.length)}%`}</h4><p>Class Attendance</p></div>
                <div className={styles.statCard}><MdTrendingUp className={`${styles.icon} ${styles.green}`} /><h4>{analyticsData.classAverageScore}%</h4><p>Class Avg. Score</p></div>
                {/* ===== YEH HAI AAKHRI FIX (Line 163) ===== */}
                <div className={styles.statCard}><MdTaskAlt className={`${styles.icon} ${styles.orange}`} /><h4>{analyticsData.studentsInClass.reduce((acc: number, s: StudentData) => acc + Number(s.assignmentsSubmitted || 0), 0)}</h4><p>Total Assignments</p></div>
                {/* Components */}
                <div className={styles.chartContainer}><ClassPerformers top={analyticsData.topPerformers || []} bottom={analyticsData.bottomPerformers || []} /></div>
                <div className={styles.chartContainer}><ClassSubjectChart data={analyticsData.classSubjectAverages || []} /></div>
            </div>
        )}
        {/* Handle empty class */}
         {viewMode === 'By Class' && (!analyticsData.studentsInClass || analyticsData.studentsInClass.length === 0) && (
             <p>No student data available for {selectedClass}.</p>
         )}

        {/* Overall School View */}
        {viewMode === 'Overall School' && analyticsData.classPerformance && (
            <div className={styles.analyticsGrid}>
                {/* Stat Cards */}
                <div className={styles.statCard}><MdPeople className={`${styles.icon} ${styles.blue}`} /><h4>{analyticsData.totalStudents}</h4><p>Total Students</p></div>
                <div className={styles.statCard}><MdDonutLarge className={`${styles.icon} ${styles.green}`} /><h4>{analyticsData.overallAttendance}%</h4><p>Overall Attendance</p></div>
                <div className={styles.statCard}><MdCheckCircle className={`${styles.icon} ${styles.orange}`} /><h4>{getAverageScore(studentDatabase.flatMap(s => s.scoreTrend))}%</h4><p>Overall Avg. Score</p></div>
                {/* Charts */}
                <div className={styles.chartContainer}><ClassPerformanceChart data={analyticsData.classPerformance} /></div>
                <div className={styles.chartContainer}><SubjectPerformanceChart data={analyticsData.subjectPerformance || []} /></div>
            </div>
        )}
    </div>
  );
};

export default AnalyticsPage;
"use client";
import { useState, useEffect } from 'react';
import api from '@/backend/utils/api'; // Aapka API utility
import styles from './Reports.module.scss'; // Hum yeh file AAGE banayenge

// --- Data Types ---
interface ClassReportItem {
  classId: string;
  className: string;
  totalCollection: number;
}

interface StudentReportItem {
  studentId: string;
  studentName: string;
  studentClass: string;
  totalPaid: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ReportsPage() {
  const [classReport, setClassReport] = useState<ClassReportItem[]>([]);
  const [studentReport, setStudentReport] = useState<StudentReportItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassReportItem | null>(null);
  
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');

  // 1. Page load par Class-wise report fetch karein
  useEffect(() => {
    const fetchClassReport = async () => {
      setLoadingClasses(true);
      try {
        const res = await api.get('/fees/reports/classwise');
        setClassReport(res.data);
      } catch (err) {
        console.error("Error fetching class report:", err);
        setError('Failed to load class reports.');
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClassReport();
  }, []);

  // 2. Jab bhi 'selectedClass' badle, tab Student-wise report fetch karein
  useEffect(() => {
    if (!selectedClass) {
      setStudentReport([]); // Agar koi class selected nahi hai, toh student list khali karein
      return;
    }

    const fetchStudentReport = async () => {
      setLoadingStudents(true);
      setStudentReport([]); // Purani list clear karein
      try {
        // Yahan hamara naya dynamic API use hoga
        const res = await api.get(`/fees/reports/studentwise/${selectedClass.classId}`);
        setStudentReport(res.data);
      } catch (err) {
        console.error("Error fetching student report:", err);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudentReport();
  }, [selectedClass]); // Yeh effect tabhi run hoga jab 'selectedClass' state badlega

  if (loadingClasses) {
    return <div className={styles.loadingState}>Loading Reports...</div>;
  }

  if (error) {
    return <div className={styles.errorState}>{error}</div>;
  }

  return (
    <div className={styles.reportsContainer}>
      <h1 className={styles.pageTitle}>Fee Collection Reports</h1>
      
      <div className={styles.reportLayout}>
        
        {/* --- Column 1: Class-wise Report --- */}
        <div className={styles.reportCard}>
          <h2 className={styles.cardTitle}>Class-wise Collection</h2>
          <ul className={styles.classList}>
            {classReport.length > 0 ? classReport.map((classItem) => (
              <li 
                key={classItem.classId}
                className={`${styles.classItem} ${selectedClass?.classId === classItem.classId ? styles.active : ''}`}
                onClick={() => setSelectedClass(classItem)} // Class ko select karein
              >
                <span className={styles.className}>{classItem.className || 'Unnamed Class'}</span>
                <span className={styles.classTotal}>{formatCurrency(classItem.totalCollection)}</span>
              </li>
            )) : (
              <p>No collection data found for any class.</p>
            )}
          </ul>
        </div>

        {/* --- Column 2: Student-wise Report --- */}
        <div className={styles.reportCard}>
          <h2 className={styles.cardTitle}>
            {selectedClass ? `Students in ${selectedClass.className}` : 'Student Details'}
          </h2>
          
          {loadingStudents ? (
            <div className={styles.loadingState}>Loading students...</div>
          ) : !selectedClass ? (
            <p className={styles.placeholder}>Select a class from the left to see student details.</p>
          ) : studentReport.length === 0 ? (
             <p className={styles.placeholder}>No students found with payments in this class.</p>
          ) : (
            <table className={styles.studentTable}>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Total Paid</th>
                </tr>
              </thead>
              <tbody>
                {studentReport.map((student) => (
                  <tr key={student.studentId}>
                    <td>{student.studentName}</td>
                    <td>{formatCurrency(student.totalPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
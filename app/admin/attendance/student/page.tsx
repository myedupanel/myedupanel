"use client";
import React, { useState, useEffect } from 'react';
import styles from './StudentAttendancePage.module.scss';

// Sample Data
const classOptions = ["Nursery", "LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];
const allStudentsData = [
  { id: 'S001', name: 'Aarav Sharma', class: 'Grade 4' },
  { id: 'S002', name: 'Priya Patel', class: 'Grade 2' },
  { id: 'S003', name: 'Rohan Mehta', class: 'Grade 4' },
  { id: 'S004', name: 'Sneha Gupta', class: 'Grade 2' },
  { id: 'S005', name: 'Vikram Singh', class: 'Grade 4' },
  { id: 'S006', name: 'Anjali Verma', class: 'Nursery' },
  { id: 'S007', name: 'Kunal Shah', class: 'Nursery' },
];

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Unmarked';
const statusOptions: AttendanceStatus[] = ['Present', 'Absent', 'Leave', 'Unmarked'];

const AttendancePage = () => {
  const [selectedClass, setSelectedClass] = useState(classOptions[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'All'>('All');
  const [showAllClasses, setShowAllClasses] = useState(false);

  useEffect(() => {
    let studentsToDisplay = [];
    if (showAllClasses) {
      studentsToDisplay = allStudentsData;
      setAttendanceData({});
    } else {
      studentsToDisplay = allStudentsData.filter(student => student.class === selectedClass);
      
      const attendanceKey = `attendance_${selectedClass}_${selectedDate}`;
      const savedAttendance = localStorage.getItem(attendanceKey);

      if (savedAttendance) {
        setAttendanceData(JSON.parse(savedAttendance));
      } else {
        const initialAttendance: Record<string, AttendanceStatus> = {};
        studentsToDisplay.forEach(student => {
          initialAttendance[student.id] = 'Unmarked';
        });
        setAttendanceData(initialAttendance);
      }
    }
    setStudentList(studentsToDisplay);
  }, [selectedClass, selectedDate, showAllClasses]);

  const handleMarkAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prevData => ({ ...prevData, [studentId]: status }));
  };
  
  const handleSubmitAttendance = () => {
    if (showAllClasses) return; // Prevent submit in all classes view
    const attendanceKey = `attendance_${selectedClass}_${selectedDate}`;
    localStorage.setItem(attendanceKey, JSON.stringify(attendanceData));
    alert(`Attendance for ${selectedClass} on ${selectedDate} has been submitted!`);
  };

  const displayedStudents = studentList.filter(student => {
    if (showAllClasses || filterStatus === 'All') {
      return true;
    }
    return attendanceData[student.id] === filterStatus;
  });

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Student Attendance</h1>
      <div className={styles.attendanceCard}>
        <div className={styles.controls}>
          {/* Class Selector */}
          <div className={styles.formGroup}>
            <label htmlFor="class-select">Class</label>
            <select 
              id="class-select" 
              value={selectedClass} 
              onChange={(e) => {
                setShowAllClasses(false); // Jab class select karein, toh 'All Classes' view band kar dein
                setSelectedClass(e.target.value);
              }}
              disabled={showAllClasses} // 'All Classes' view mein disable kar dein
            >
              {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>

          {/* Date Selector */}
          <div className={styles.formGroup}>
            <label htmlFor="date-select">Date</label>
            <input 
              type="date" 
              id="date-select" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              disabled={showAllClasses} // 'All Classes' view mein disable kar dein
            />
          </div>

          {/* Filter by Status */}
          <div className={styles.formGroup}>
            <label htmlFor="status-filter">Filter by Status</label>
            <select 
              id="status-filter" 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AttendanceStatus | 'All')}
              disabled={showAllClasses} // 'All Classes' view mein disable kar dein
            >
              <option value="All">All Statuses</option>
              {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>

          {/* Show All Students Button */}
          <button 
            className={`${styles.showAllClassesButton} ${showAllClasses ? styles.activeFilter : ''}`} 
            onClick={() => setShowAllClasses(!showAllClasses)}
          >
            {showAllClasses ? 'Back to Class View' : 'Show All Students'}
          </button>
        </div>

        <div className={styles.studentList}>
          {studentList.length > 0 ? (
            <>
              <div className={styles.listHeader}>
                <span>{showAllClasses ? `All Students (${displayedStudents.length})` : `Students in ${selectedClass} (${displayedStudents.length})`}</span>
                {!showAllClasses && (
                  <button className={styles.markAllButton} onClick={() => {/* Logic to mark all present */}}>Mark All Present</button>
                )}
              </div>
              
              {displayedStudents.map(student => (
                <div key={student.id} className={styles.studentRow}>
                  <span>{student.name} {showAllClasses && `(${student.class})`}</span>
                  {!showAllClasses && (
                    <div className={styles.attendanceButtons}>
                      <button 
                        className={`${styles.statusButton} ${styles.present} ${attendanceData[student.id] === 'Present' ? styles.active : ''}`}
                        onClick={() => handleMarkAttendance(student.id, 'Present')}>P</button>
                      <button 
                        className={`${styles.statusButton} ${styles.absent} ${attendanceData[student.id] === 'Absent' ? styles.active : ''}`}
                        onClick={() => handleMarkAttendance(student.id, 'Absent')}>A</button>
                      <button 
                        className={`${styles.statusButton} ${styles.leave} ${attendanceData[student.id] === 'Leave' ? styles.active : ''}`}
                        onClick={() => handleMarkAttendance(student.id, 'Leave')}>L</button>
                    </div>
                  )}
                </div>
              ))}
              {!showAllClasses && (
                <div className={styles.footer}>
                  <button className={styles.submitButton} onClick={handleSubmitAttendance}>Submit Attendance</button>
                </div>
              )}
            </>
          ) : (
            <p className={styles.noStudentsMessage}>No students found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default AttendancePage;
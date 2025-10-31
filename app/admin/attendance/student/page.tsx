"use client";
import React, { useState, useEffect } from 'react';
import styles from './StudentAttendancePage.module.scss';
import api from '@/backend/utils/api'; // <-- 1. API IMPORT ADD KIYA

// --- 2. CLASS INTERFACE ADD KIYA ---
interface SchoolClass {
    classid: number;
    class_name: string;
}

// --- 3. HARDCODED CLASSOPTIONS HATA DIYA ---
// const classOptions = ["Nursery", "LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];

// Sample Data (Student data abhi bhi hardcoded hai, ise baad mein fix karna hoga)
const allStudentsData = [
  { id: 'S001', name: 'Aarav Sharma', class: 'Grade 4' }, // Note: Yeh naam backend 'class_name' se match hona chahiye
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
  // --- 4. NAYE STATES ADD KIYE ---
  const [fetchedClasses, setFetchedClasses] = useState<SchoolClass[]>([]);
  const [isClassLoading, setIsClassLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(''); // Default empty rakha
  // ---

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'All'>('All');
  const [showAllClasses, setShowAllClasses] = useState(false);

  // --- 5. NAYA USEEFFECT ADD KIYA (Classes fetch karne ke liye) ---
  useEffect(() => {
    const loadClasses = async () => {
        setIsClassLoading(true);
        try {
            const res = await api.get('/api/classes');
            const classesData: SchoolClass[] = res.data || [];
            setFetchedClasses(classesData);
            
            // Default selected class ko list ki pehli class par set karein
            if (classesData.length > 0) {
                setSelectedClass(classesData[0].class_name);
            }
        } catch (err) {
            console.error("Failed to load classes", err);
            // Yahaan error state set kar sakte hain
        } finally {
            setIsClassLoading(false);
        }
    };
    loadClasses();
  }, []); // Run once on mount
  // ---

  // Yeh existing useEffect ab 'selectedClass' ke update hone par sahi se chalega
  useEffect(() => {
    let studentsToDisplay = [];
    if (showAllClasses) {
      studentsToDisplay = allStudentsData;
      setAttendanceData({});
    } else {
      // Yeh abhi bhi hardcoded 'allStudentsData' filter kar raha hai
      // Next step hoga isko API call se replace karna
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
    if (showAllClasses) return; 
    // TODO: Is logic ko localStorage se API call mein badalna hoga
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
            {/* --- 6. DROPDOWN KO UPDATE KIYA --- */}
            <select 
              id="class-select" 
              value={selectedClass} 
              onChange={(e) => {
                setShowAllClasses(false);
                setSelectedClass(e.target.value);
              }}
              disabled={showAllClasses || isClassLoading} // Loading ke waqt disable karein
            >
              {isClassLoading ? (
                <option value="">Loading classes...</option>
              ) : fetchedClasses.length === 0 ? (
                <option value="">No classes found</option>
              ) : (
                fetchedClasses.map(cls => (
                  // Key 'classid' hai, Value 'class_name' hai
                  <option key={cls.classid} value={cls.class_name}>
                    {cls.class_name}
                  </option>
                ))
              )}
            </select>
            {/* --- END FIX --- */}
          </div>

          {/* Date Selector (No Change) */}
          <div className={styles.formGroup}>
            <label htmlFor="date-select">Date</label>
            <input 
              type="date" 
              id="date-select" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              disabled={showAllClasses}
            />
          </div>

          {/* Filter by Status (No Change) */}
          <div className={styles.formGroup}>
            <label htmlFor="status-filter">Filter by Status</label>
            <select 
              id="status-filter" 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AttendanceStatus | 'All')}
              disabled={showAllClasses}
            >
              <option value="All">All Statuses</option>
              {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>

          {/* Show All Students Button (No Change) */}
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
              {/* ... (List Header - No Change) ... */}
              <div className={styles.listHeader}>
                <span>{showAllClasses ? `All Students (${displayedStudents.length})` : `Students in ${selectedClass} (${displayedStudents.length})`}</span>
                {!showAllClasses && (
                  <button className={styles.markAllButton} onClick={() => {/* Logic to mark all present */}}>Mark All Present</button>
                )}
              </div>
              
              {/* ... (Student Rows - No Change) ... */}
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
              {/* ... (Footer - No Change) ... */}
              {!showAllClasses && (
                <div className={styles.footer}>
                  <button className={styles.submitButton} onClick={handleSubmitAttendance}>Submit Attendance</button>
                </div>
              )}
            </>
          ) : (
            <p className={styles.noStudentsMessage}>{isClassLoading ? 'Loading...' : (selectedClass ? `No students found for ${selectedClass}.` : 'Please select a class.')}</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default AttendancePage;
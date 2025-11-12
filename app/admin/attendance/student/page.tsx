"use client";
import React, { useState, useEffect } from 'react';
import styles from './StudentAttendancePage.module.scss';
import api from '@/backend/utils/api';
import { useAcademicYear } from '@/app/context/AcademicYearContext'; // Add this import

// --- 1. CLASS INTERFACE (Aapka code, No Change) ---
interface SchoolClass {
    classid: number;
    class_name: string;
}

// --- 2. NAYE INTERFACES ADD KIYE ---
// Yeh data API se aayega
interface ApiStudent {
    studentid: number;
    first_name: string;
    last_name: string;
    father_name?: string;
    class: { class_name: string } | null;
}

// Yeh data hum component ke state mein rakhenge
interface Student {
  id: string; // Hum studentid ko string mein convert karke save karenge
  name: string;
  class: string;
}

// Helper function student ka poora naam jodne ke liye
const getFullName = (s: { first_name?: string, father_name?: string, last_name?: string } | null | undefined) => {
  if (!s) return 'N/A';
  return [s.first_name, s.father_name, s.last_name].filter(Boolean).join(' ');
}
// --- END NAYE INTERFACES ---


// --- 3. HARDCODED DATA HATA DIYA ---
// const allStudentsData = [ ... ]; // <-- YEH DELETE KAR DIYA GAYA HAI

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Unmarked';
const statusOptions: AttendanceStatus[] = ['Present', 'Absent', 'Leave', 'Unmarked'];

const AttendancePage = () => {
  const { currentYearId } = useAcademicYear(); // Add this line to use academic year context
  // --- STATES (No Change, bas studentList ko type kiya) ---
  const [fetchedClasses, setFetchedClasses] = useState<SchoolClass[]>([]);
  const [isClassLoading, setIsClassLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(''); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [studentList, setStudentList] = useState<Student[]>([]); // <-- Type update kiya
  const [isStudentLoading, setIsStudentLoading] = useState(false); // <-- Naya loading state
  
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'All'>('All');
  
  // 'showAllClasses' ko hata diya hai, Kadam 2 mein hum "Reports" page banayenge
  // const [showAllClasses, setShowAllClasses] = useState(false); 

  // --- Classes fetch karne ka useEffect (Aapka code, No Change) ---
  useEffect(() => {
    const loadClasses = async () => {
        setIsClassLoading(true);
        try {
            const res = await api.get('/api/classes'); // Note: Yeh route 'students.js' se aa raha hai
            const classesData: SchoolClass[] = res.data || [];
            
            // Prisma se 'class_name' distinct nahi aa raha hoga, 
            // humein 'classes' table se fetch karna hoga.
            // Let's assume API se data aayega: [{ classid: 1, class_name: '12th' }, ...]
            setFetchedClasses(classesData);
            
            if (classesData.length > 0) {
                setSelectedClass(classesData[0].class_name);
            }
        } catch (err) {
            console.error("Failed to load classes", err);
        } finally {
            setIsClassLoading(false);
        }
    };
    loadClasses();
  }, [currentYearId]); 
  
  // --- 4. STUDENT FETCH KARNE KA USEEFFECT (Poora naya) ---
  // Yeh 'selectedClass' ya 'selectedDate' badalne par chalega
  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      // Jab tak class select nahi hoti, fetch mat karo
      if (!selectedClass || isClassLoading) {
          setStudentList([]); // List khaali karo
          return;
      }

      setIsStudentLoading(true); // Student loading shuru
      try {
        // Kadam 1: Class ke students ko API se fetch karo
        // Hum 'students.js' route ko call kar rahe hain
        const res = await api.get(`/api/students?class=${encodeURIComponent(selectedClass)}`);
        
        // API se mile data ko humare 'Student' interface mein transform karo
        const transformedStudents: Student[] = (res.data as ApiStudent[]).map((s: ApiStudent) => ({
            id: s.studentid.toString(), // studentid (number) ko id (string) banaya
            name: getFullName(s),
            class: s.class?.class_name || 'N/A'
        }));
        
        setStudentList(transformedStudents);

        // Kadam 2: Students milne ke baad, unki attendance load karo
        
        // TODO: Abhi hum localStorage se load kar rahe hain. 
        // Kadam 2 (Data Save) mein hum ise API se fetch karenge.
        const attendanceKey = `attendance_${selectedClass}_${selectedDate}`;
        const savedAttendance = localStorage.getItem(attendanceKey);

        if (savedAttendance) {
          setAttendanceData(JSON.parse(savedAttendance));
        } else {
          // Naye students ke liye initial 'Unmarked' data banayen
          const initialAttendance: Record<string, AttendanceStatus> = {};
          transformedStudents.forEach(student => {
            initialAttendance[student.id] = 'Unmarked';
          });
          setAttendanceData(initialAttendance);
        }
      } catch (err) {
        console.error(`Failed to fetch students for ${selectedClass}`, err);
        setStudentList([]); // Error par list khaali karo
      } finally {
        setIsStudentLoading(false); // Student loading khatam
      }
    };

    fetchStudentsAndAttendance();
  }, [selectedClass, selectedDate, isClassLoading, currentYearId]); // Dependency list update ki
  // --- END FIX 4 ---


  const handleMarkAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prevData => ({ ...prevData, [studentId]: status }));
  };
  
  const handleSubmitAttendance = () => {
    // TODO: Is logic ko Kadam 2 (Data Save) mein API call mein badalna hoga
    const attendanceKey = `attendance_${selectedClass}_${selectedDate}`;
    localStorage.setItem(attendanceKey, JSON.stringify(attendanceData));
    alert(`Attendance for ${selectedClass} on ${selectedDate} has been submitted!`);
  };

  // Filter logic (No Change)
  const displayedStudents = studentList.filter(student => {
    if (filterStatus === 'All') {
      return true;
    }
    return attendanceData[student.id] === filterStatus;
  });

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Student Attendance</h1>
      <div className={styles.attendanceCard}>
        <div className={styles.controls}>
          {/* Class Selector (Pehle se updated tha) */}
          <div className={styles.formGroup}>
            <label htmlFor="class-select">Class</label>
            <select 
              id="class-select" 
              value={selectedClass} 
              onChange={(e) => {
                setSelectedClass(e.target.value);
              }}
              disabled={isClassLoading} // Loading ke waqt disable
            >
              {isClassLoading ? (
                <option value="">Loading classes...</option>
              ) : fetchedClasses.length === 0 ? (
                <option value="">No classes found</option>
              ) : (
                // Assuming 'fetchedClasses' ab [{ classid: 1, class_name: '12th' }, ...] hai
                fetchedClasses.map(cls => (
                  <option key={cls.classid} value={cls.class_name}>
                    {cls.class_name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date Selector (No Change) */}
          <div className={styles.formGroup}>
            <label htmlFor="date-select">Date</label>
            <input 
              type="date" 
              id="date-select" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
          </div>

          {/* Filter by Status (No Change) */}
          <div className={styles.formGroup}>
            <label htmlFor="status-filter">Filter by Status</label>
            <select 
              id="status-filter" 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AttendanceStatus | 'All')}
            >
              <option value="All">All Statuses</option>
              {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>

          {/* --- 5. "Show All" button hata diya gaya --- */}
          {/* <button 
            className={`${styles.showAllClassesButton} ${showAllClasses ? styles.activeFilter : ''}`} 
            onClick={() => setShowAllClasses(!showAllClasses)}
          >
            {showAllClasses ? 'Back to Class View' : 'Show All Students'}
          </button> */}
          
          {/* Back to Class View (Original image 'fbaeea.jpg' jaisa) */}
           <button className={styles.backButton}>Back to Class View</button>
        </div>

        <div className={styles.studentList}>
          {isStudentLoading ? (
            <p className={styles.noStudentsMessage}>Loading students...</p>
          ) : displayedStudents.length > 0 ? (
            <>
              <div className={styles.listHeader}>
                <span>{`Students in ${selectedClass} (${displayedStudents.length})`}</span>
                <button className={styles.markAllButton} onClick={() => {/* Logic to mark all present */}}>Mark All Present</button>
              </div>
              
              {displayedStudents.map(student => (
                <div key={student.id} className={styles.studentRow}>
                  {/* Student 'id' (jo ki studentid hai) dikha sakte hain debug ke liye */}
                  <span>{student.name}</span>
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
                </div>
              ))}

              <div className={styles.footer}>
                <button className={styles.submitButton} onClick={handleSubmitAttendance}>Submit Attendance</button>
              </div>
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
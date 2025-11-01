"use client";
import React, { useState, useEffect } from 'react';
import styles from './StaffAttendancePage.module.scss';
import api from '@/backend/utils/api'; 

// --- Interfaces (No Change) ---
interface ApiStaff {
  id: number;
  name: string;
  role: string; 
}
interface StaffMember {
  id: string; 
  name: string;
  role: string;
}

const staffRoles = ["All Roles", "Teacher", "Accountant", "Office Admin", "Librarian", "Security", "Transport Staff", "Other"];
type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Unmarked';
const statusOptions: AttendanceStatus[] = ['Present', 'Absent', 'Leave', 'Unmarked'];

const StaffAttendancePage = () => {
  const [selectedRole, setSelectedRole] = useState(staffRoles[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]); 
  const [isStaffLoading, setIsStaffLoading] = useState(true); 
  const [staffList, setStaffList] = useState<StaffMember[]>([]); 
  
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'All'>('All');
  const [showAllStaff, setShowAllStaff] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);


  // --- FIX 1: Staff Fetching useEffect - Loading state ko theek kiya ---
  useEffect(() => {
    const fetchAllStaff = async () => {
      setIsStaffLoading(true);
      try {
        const res = await api.get('/api/staff');
        const transformedData: StaffMember[] = res.data.data.map((staff: ApiStaff) => ({
          id: staff.id.toString(), 
          name: staff.name,
          role: staff.role,
        }));
        setAllStaff(transformedData);
        console.log("Fetched all staff:", transformedData);
      } catch (err) {
        console.error("Failed to fetch staff list", err);
      } finally {
        // CRITICAL FIX: isStaffLoading ko yahaan false set kiya
        setIsStaffLoading(false); 
      }
    };
    fetchAllStaff();
  }, []); // Run only once

  // --- FIX 2: Main Logic useEffect - Dependencies aur Logic ko theek kiya ---
  useEffect(() => {
    // Agar initial staff list abhi bhi load ho rahi hai, toh rukein
    if (isStaffLoading) {
        setStaffList([]);
        return;
    }

    let staffToDisplay: StaffMember[];
    if (showAllStaff) {
      staffToDisplay = allStaff;
      setAttendanceData({});
    } else {
      staffToDisplay = selectedRole === 'All Roles'
        ? allStaff
        : allStaff.filter(staff => staff.role === selectedRole);
      
      const fetchAttendanceForDate = async (currentStaffList: StaffMember[]) => {
        try {
          const res = await api.get(`/api/attendance/staff?date=${selectedDate}`);
          const savedAttendance: Record<string, AttendanceStatus> = res.data;

          const initialAttendance: Record<string, AttendanceStatus> = {};
          currentStaffList.forEach(staff => {
            initialAttendance[staff.id] = savedAttendance[staff.id] || 'Unmarked';
          });
          setAttendanceData(initialAttendance);

        } catch (err) {
          console.error("Failed to fetch staff attendance", err);
          const initialAttendance: Record<string, AttendanceStatus> = {};
          currentStaffList.forEach(staff => {
            initialAttendance[staff.id] = 'Unmarked';
          });
          setAttendanceData(initialAttendance);
        }
      };
      
      // Agar filtered list mein staff hain toh attendance fetch karo
      if (staffToDisplay.length > 0) {
        // Yahaan hum function ko call karte hain, filtered list paas karte hain
        fetchAttendanceForDate(staffToDisplay);
      } else {
          // Agar koi staff nahi hai toh attendance data ko reset kar dein
          setAttendanceData({});
      }
    }
    setStaffList(staffToDisplay);
  }, [selectedRole, selectedDate, showAllStaff, allStaff, isStaffLoading]); // isStaffLoading dependency rakha hai taaki jab initial fetch complete ho toh yeh ek baar chale

  // handleMarkAttendance (No Change)
  const handleMarkAttendance = (staffId: string, status: AttendanceStatus) => {
    setAttendanceData(prevData => ({ ...prevData, [staffId]: status }));
  };

  // markAllPresent (No Change)
  const markAllPresent = () => {
    const allPresent: Record<string, AttendanceStatus> = { ...attendanceData };
    displayedStaff.forEach(staff => {
      allPresent[staff.id] = 'Present';
    });
    setAttendanceData(allPresent);
  };

  // handleSubmitAttendance (No Change)
  const handleSubmitAttendance = async () => {
    if (showAllStaff) return;
    
    setIsSubmitting(true);
    
    const dataToSubmit: Record<string, AttendanceStatus> = {};
    displayedStaff.forEach(staff => {
        dataToSubmit[staff.id] = attendanceData[staff.id];
    });

    try {
      await api.post('/api/attendance/staff', {
        date: selectedDate,
        attendanceData: dataToSubmit
      });
      alert(`Attendance for ${selectedRole} on ${selectedDate} has been submitted!`);
    } catch (err: any) {
      console.error("Failed to submit staff attendance", err);
      alert(`Error: ${err.response?.data?.msg || 'Could not save attendance.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // displayedStaff (No Change)
  const displayedStaff = staffList.filter(staff => {
    if (showAllStaff || filterStatus === 'All') {
      return true;
    }
    return attendanceData[staff.id] === filterStatus;
  });

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Staff Attendance</h1>
      
      <div className={styles.attendanceCard}>
        <div className={styles.controls}>
          <div className={styles.formGroup}>
            <label htmlFor="role-select">Filter by Role</label>
            <select 
              id="role-select" 
              value={selectedRole} 
              onChange={(e) => {
                setShowAllStaff(false);
                setSelectedRole(e.target.value);
              }}
              disabled={showAllStaff || isStaffLoading}
            >
              {staffRoles.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="date-select">Date</label>
            <input 
              type="date" 
              id="date-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={showAllStaff}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="status-filter">Filter by Status</label>
            <select 
              id="status-filter" 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AttendanceStatus | 'All')}
              disabled={showAllStaff}
            >
              <option value="All">All Statuses</option>
              {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <button 
            className={`${styles.showAllButton} ${showAllStaff ? styles.activeFilter : ''}`} 
            onClick={() => setShowAllStaff(!showAllStaff)}
          >
            {showAllStaff ? 'Back to Role View' : 'Show All Staff'}
          </button>
        </div>

        <div className={styles.staffList}>
            {isStaffLoading ? (
                <p className={styles.noStaffMessage}>Loading staff list...</p>
            ) : staffList.length > 0 ? (
                <>
                    <div className={styles.listHeader}>
                        <span>{showAllStaff ? `All Staff (${displayedStaff.length})` : `Staff Members (${displayedStaff.length})`}</span>
                        {!showAllStaff && (
                            <button className={styles.markAllButton} onClick={markAllPresent}>Mark All Present</button>
                        )}
                    </div>
                    {displayedStaff.map(staff => (
                        <div key={staff.id} className={styles.staffRow}>
                            <span>{staff.name} {showAllStaff && `(${staff.role})`}</span>
                            {!showAllStaff && (
                                <div className={styles.attendanceButtons}>
                                    <button 
                                        className={`${styles.statusButton} ${styles.present} ${attendanceData[staff.id] === 'Present' ? styles.active : ''}`}
                                        onClick={() => handleMarkAttendance(staff.id, 'Present')}>P</button>
                                    <button 
                                        className={`${styles.statusButton} ${styles.absent} ${attendanceData[staff.id] === 'Absent' ? styles.active : ''}`}
                                        onClick={() => handleMarkAttendance(staff.id, 'Absent')}>A</button>
                                    <button 
                                        className={`${styles.statusButton} ${styles.leave} ${attendanceData[staff.id] === 'Leave' ? styles.active : ''}`}
                                        onClick={() => handleMarkAttendance(staff.id, 'Leave')}>L</button>
                                </div>
                            )}
                        </div>
                    ))}
                    {!showAllStaff && (
                        <div className={styles.footer}>
                            <button 
                              className={styles.submitButton} 
                              onClick={handleSubmitAttendance}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <p className={styles.noStaffMessage}>No staff found for "{selectedRole}".</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default StaffAttendancePage;
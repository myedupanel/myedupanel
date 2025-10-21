"use client";
import React, { useState, useEffect } from 'react';
import styles from './StaffAttendancePage.module.scss';

// Sample Data Update
const staffRoles = ["All Roles", "Teacher", "Accountant", "Office Admin", "Librarian", "Security", "Transport Staff", "Other"]; // <-- 'Teacher' add kiya gaya
const allStaffMembers = [
    // --- NAYE SAMPLE TEACHERS ADD KIYE GAYE ---
    { id: 'T001', name: 'Priya Sharma', role: 'Teacher' },
    { id: 'T002', name: 'Rahul Verma', role: 'Teacher' },
    // --- Purana Staff Data ---
    { id: 'E001', name: 'Ramesh Kumar', role: 'Accountant' },
    { id: 'E002', name: 'Sunita Singh', role: 'Office Admin' },
    { id: 'E003', name: 'Vikram Rathod', role: 'Security' },
    { id: 'E004', name: 'Anita Das', role: 'Librarian' },
    { id: 'E005', name: 'Amit Desai', role: 'Transport Staff' },
];

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Unmarked';
const statusOptions: AttendanceStatus[] = ['Present', 'Absent', 'Leave', 'Unmarked'];

const StaffAttendancePage = () => {
  const [selectedRole, setSelectedRole] = useState(staffRoles[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'All'>('All');
  const [showAllStaff, setShowAllStaff] = useState(false);

  useEffect(() => {
    let staffToDisplay = [];
    if (showAllStaff) {
      staffToDisplay = allStaffMembers;
      setAttendanceData({});
    } else {
      staffToDisplay = selectedRole === 'All Roles'
        ? allStaffMembers
        : allStaffMembers.filter(staff => staff.role === selectedRole);
      
      const attendanceKey = `staff_attendance_${selectedRole}_${selectedDate}`;
      const savedAttendance = localStorage.getItem(attendanceKey);

      if (savedAttendance) {
        setAttendanceData(JSON.parse(savedAttendance));
      } else {
        const initialAttendance: Record<string, AttendanceStatus> = {};
        staffToDisplay.forEach(staff => {
          initialAttendance[staff.id] = 'Unmarked';
        });
        setAttendanceData(initialAttendance);
      }
    }
    setStaffList(staffToDisplay);
  }, [selectedRole, selectedDate, showAllStaff]);

  const handleMarkAttendance = (staffId: string, status: AttendanceStatus) => {
    setAttendanceData(prevData => ({ ...prevData, [staffId]: status }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, AttendanceStatus> = { ...attendanceData };
    staffList.forEach(staff => {
      allPresent[staff.id] = 'Present';
    });
    setAttendanceData(allPresent);
  };

  const handleSubmitAttendance = () => {
    if (showAllStaff) return;
    const attendanceKey = `staff_attendance_${selectedRole}_${selectedDate}`;
    localStorage.setItem(attendanceKey, JSON.stringify(attendanceData));
    alert(`Attendance for ${selectedRole} on ${selectedDate} has been submitted!`);
  };

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
              disabled={showAllStaff}
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
            {staffList.length > 0 ? (
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
                            <button className={styles.submitButton} onClick={handleSubmitAttendance}>Submit Attendance</button>
                        </div>
                    )}
                </>
            ) : (
                <p className={styles.noStaffMessage}>No staff found.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default StaffAttendancePage;
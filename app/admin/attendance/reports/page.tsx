"use client";
import React, { useState, useEffect } from 'react';
import styles from './ReportsPage.module.scss';
import Papa from 'papaparse';
import { MdDownload } from 'react-icons/md';
import AttendancePieChart from '@/components/admin/AttendancePieChart/AttendancePieChart';

// Sample Data
const classOptions = ["Nursery", "LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];
const staffRoles = ["Teacher", "Accountant", "Office Admin", "Librarian", "Security", "Transport Staff", "Other"];
const allStudents = [
  { id: 'S001', name: 'Aarav Sharma', class: 'Grade 4' }, { id: 'S006', name: 'Anjali Verma', class: 'Nursery' },
  { id: 'S007', name: 'Kunal Shah', class: 'Nursery' },
];
const allStaffMembers = [
    { id: 'T001', name: 'Priya Sharma', role: 'Teacher' }, { id: 'E001', name: 'Ramesh Kumar', role: 'Accountant' },
];

const ReportsPage = () => {
  const [reportFor, setReportFor] = useState<'student' | 'staff'>('student');
  const [timeRange, setTimeRange] = useState('monthly');
  const [selectedGroup, setSelectedGroup] = useState(classOptions[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pieChartData, setPieChartData] = useState<{ name: string, value: number }[]>([]);

  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let totalPresent = 0, totalAbsent = 0, totalLeave = 0;

    allStudents.forEach(student => {
        const key = `attendance_${student.class}_${todayStr}`;
        const rec = localStorage.getItem(key);
        if (rec) {
            const status = JSON.parse(rec)[student.id];
            if (status === 'Present') totalPresent++;
            else if (status === 'Absent') totalAbsent++;
            else if (status === 'Leave') totalLeave++;
        }
    });
    allStaffMembers.forEach(staff => {
        const key = `staff_attendance_${staff.role}_${todayStr}`;
        const rec = localStorage.getItem(key);
        if (rec) {
            const status = JSON.parse(rec)[staff.id];
            if (status === 'Present') totalPresent++;
            else if (status === 'Absent') totalAbsent++;
            else if (status === 'Leave') totalLeave++;
        }
    });
    setPieChartData([
        { name: 'Present', value: totalPresent }, { name: 'Absent', value: totalAbsent }, { name: 'Leave', value: totalLeave },
    ]);
  }, []);

  const groupOptions = reportFor === 'student' ? classOptions : staffRoles;

  useEffect(() => {
    setSelectedGroup(groupOptions[0]);
  }, [reportFor]);

  const handleGenerateReport = () => {
    setIsLoading(true);
    setReportData(null);

    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (timeRange) {
        case 'daily':
            startDate = new Date(selectedDate);
            endDate = new Date(selectedDate);
            break;
        case 'monthly':
            const [year, month] = selectedMonth.split('-').map(Number);
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0);
            break;
        case '3months':
            startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
            endDate = today;
            break;
        case '6months':
            startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
            endDate = today;
            break;
        case 'annually':
            startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
            endDate = today;
            break;
    }

    const membersToList = reportFor === 'student'
        ? allStudents.filter(s => s.class === selectedGroup)
        : allStaffMembers.filter(s => s.role === selectedGroup);
    
    const keyPrefix = reportFor === 'student' ? `attendance_${selectedGroup}_` : `staff_attendance_${selectedGroup}_`;

    const compiledReport = membersToList.map(member => {
        let present = 0, absent = 0, leave = 0;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0, 10);
            const key = keyPrefix + dateStr;
            const attendanceRecord = localStorage.getItem(key);
            
            if (attendanceRecord) {
                const parsedRecord = JSON.parse(attendanceRecord);
                const status = parsedRecord[member.id];
                if (status === 'Present') present++;
                else if (status === 'Absent') absent++;
                else if (status === 'Leave') leave++;
            }
        }
        return { name: member.name, present, absent, leave, total: present + absent + leave };
    });

    setTimeout(() => {
        setReportData(compiledReport);
        setIsLoading(false);
    }, 500);
  };

  const handleDownloadReport = () => {
    if (!reportData) return;
    const csv = Papa.unparse(reportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `attendance_report_${selectedGroup}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Attendance Dashboard</h1>
      
      <AttendancePieChart data={pieChartData} />

      <div className={styles.controlsCard}>
        <div className={styles.formGroup}>
            <label>Report For</label>
            <select value={reportFor} onChange={e => setReportFor(e.target.value as any)}>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
            </select>
        </div>
        <div className={styles.formGroup}>
            <label>Time Range</label>
            <select value={timeRange} onChange={e => setTimeRange(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="annually">Last Year</option>
            </select>
        </div>
         <div className={styles.formGroup}>
            <label>{reportFor === 'student' ? 'Class' : 'Role'}</label>
            <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
                {groupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
        
        {timeRange === 'daily' && (
            <div className={styles.formGroup}>
                <label>Select Date</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
            </div>
        )}
        {timeRange === 'monthly' && (
            <div className={styles.formGroup}>
                <label>Select Month</label>
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
            </div>
        )}

        <button className={styles.generateButton} onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      <div className={styles.reportDisplay}>
        <div className={styles.reportHeader}>
            <h3>Generated Report</h3>
            {reportData && reportData.length > 0 && (
                 <button className={styles.downloadButton} onClick={handleDownloadReport}>
                    <MdDownload /> Download CSV
                 </button>
            )}
        </div>
        <div className={styles.reportContent}>
            {isLoading && <p>Loading report...</p>}
            {!isLoading && !reportData && <p>Select criteria and click "Generate Report".</p>}
            {!isLoading && reportData && reportData.length > 0 ? (
                <table className={styles.reportTable}>
                    <thead>
                        <tr>
                            <th>{reportFor === 'student' ? 'Student' : 'Staff'} Name</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Leave</th>
                            <th>Total Days Tracked</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((item, index) => (
                            <tr key={index}>
                                <td>{item.name}</td>
                                <td>{item.present}</td>
                                <td>{item.absent}</td>
                                <td>{item.leave}</td>
                                <td>{item.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                !isLoading && reportData && <p>No attendance data found for this selection.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
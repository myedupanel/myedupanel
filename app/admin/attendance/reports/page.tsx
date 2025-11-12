"use client";
import React, { useState, useEffect } from 'react';
import styles from './ReportsPage.module.scss';
import Papa from 'papaparse'; // CSV ke liye
import * as XLSX from 'xlsx'; // Excel ke liye
import jsPDF from 'jspdf'; // PDF ke liye
import 'jspdf-autotable'; // PDF Table ke liye
import { MdDownload } from 'react-icons/md';
import AttendancePieChart from '@/components/admin/AttendancePieChart/AttendancePieChart';
import api from '@/backend/utils/api';
import { useAcademicYear } from '@/app/context/AcademicYearContext';

// --- 3. NAYE INTERFACES ADD KIYE ---
interface SchoolClass {
  classid: number;
  class_name: string;
}
// Staff roles ko abhi bhi hardcoded rakhenge (jaisa pichhli file mein tha)
const staffRoles = ["Teacher", "Accountant", "Office Admin", "Librarian", "Security", "Transport Staff", "Other"];

// API se aane waale report data ka type
interface ReportRow {
  name: string;
  present: number;
  absent: number;
  leave: number;
  total: number;
}

const ReportsPage = () => {
  const { currentYearId } = useAcademicYear();
  const [reportFor, setReportFor] = useState<'student' | 'staff'>('student');
  const [timeRange, setTimeRange] = useState('monthly');
  
  // --- 4. STATE UPDATE KIYE ---
  const [fetchedClasses, setFetchedClasses] = useState<SchoolClass[]>([]); // Classes API se aayengi
  const [selectedGroup, setSelectedGroup] = useState(''); // Ab yeh Class ID ya Role Name store karega
  const [isFilterLoading, setIsFilterLoading] = useState(true); // Dropdowns ke liye loading
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [reportData, setReportData] = useState<ReportRow[] | null>(null); // Type update kiya
  const [isLoading, setIsLoading] = useState(false); // Report generation ke liye
  const [pieChartData, setPieChartData] = useState<{ name: string, value: number }[]>([]);

  // --- 5. NAYA USEEFFECT (FILTERS LOAD KARNE KE LIYE) ---
  useEffect(() => {
    const loadFilters = async () => {
      setIsFilterLoading(true);
      try {
        // Classes fetch karo
        const res = await api.get('/api/classes'); 
        const classesData: SchoolClass[] = res.data || [];
        setFetchedClasses(classesData);
        
        // Default selection set karo
        if (reportFor === 'student' && classesData.length > 0) {
          setSelectedGroup(classesData[0].classid.toString()); // Class ID ko string mein save karo
        } else if (reportFor === 'staff' && staffRoles.length > 0) {
          setSelectedGroup(staffRoles[0]);
        }
      } catch (err) {
        console.error("Failed to load classes", err);
      } finally {
        setIsFilterLoading(false);
      }
    };
    loadFilters();
  }, [reportFor, currentYearId]); // Jab bhi 'reportFor' (student/staff) badlega, yeh chalega

  // --- 6. PIE CHART KA USEEFFECT UPDATE KIYA (LocalStorage hataya) ---
  useEffect(() => {
    // TODO: Is pie chart ke liye ek alag API route (e.g., GET /api/attendance/today-overview) banana behtar hoga.
    // Abhi ke liye, hum report generate hone ke baad ise update karenge.
    setPieChartData([]); // Default empty rakha
  }, [currentYearId]);

  // Dropdown options ko dynamically badlo
  const groupOptions = reportFor === 'student' ? fetchedClasses : staffRoles;

  // --- 7. HANDLEGENERATEREPORT KO API SE CONNECT KIYA ---
  const handleGenerateReport = async () => {
    setIsLoading(true);
    setReportData(null);
    setPieChartData([]); // Pie chart reset karo

    const today = new Date();
    let startDateStr = '';
    let endDateStr = '';

    // Date range logic (No Change, bas string format mein save kiya)
    switch (timeRange) {
        case 'daily':
            startDateStr = selectedDate;
            endDateStr = selectedDate;
            break;
        case 'monthly':
            const [year, month] = selectedMonth.split('-').map(Number);
            startDateStr = new Date(year, month - 1, 1).toISOString().slice(0, 10);
            endDateStr = new Date(year, month, 0).toISOString().slice(0, 10);
            break;
        case '3months':
            startDateStr = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()).toISOString().slice(0, 10);
            endDateStr = today.toISOString().slice(0, 10);
            break;
        case '6months':
            startDateStr = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()).toISOString().slice(0, 10);
            endDateStr = today.toISOString().slice(0, 10);
            break;
        case 'annually':
            startDateStr = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
            endDateStr = today.toISOString().slice(0, 10);
            break;
    }

    // API ke liye parameters banayein
    const apiParams = {
      reportFor: reportFor,
      startDate: startDateStr,
      endDate: endDateStr,
      // groupId ya role bhejein
      ...(reportFor === 'student' ? { groupId: selectedGroup } : { role: selectedGroup })
    };

    try {
      // Naye API route ko call karein
      const res = await api.get('/api/attendance/report', { params: apiParams });
      const data: ReportRow[] = res.data;
      setReportData(data);

      // Report data se Pie Chart ko update karein
      if (data.length > 0) {
        let totalPresent = 0, totalAbsent = 0, totalLeave = 0;
        data.forEach(item => {
          totalPresent += item.present;
          totalAbsent += item.absent;
          totalLeave += item.leave;
        });
        setPieChartData([
          { name: 'Present', value: totalPresent },
          { name: 'Absent', value: totalAbsent },
          { name: 'Leave', value: totalLeave },
        ]);
      }

    } catch (err) {
      console.error("Failed to generate report", err);
      alert("Error generating report. Please check console.");
    } finally {
      setIsLoading(false);
    }
  };
  // --- END FIX 7 ---

  // --- 8. DOWNLOAD FUNCTIONS ADD KIYE ---
  const handleDownloadCSV = () => {
    if (!reportData) return;
    const csv = Papa.unparse(reportData);
    downloadFile(csv, 'text/csv;charset=utf-8;', 'csv');
  };

  const handleDownloadExcel = () => {
    if (!reportData) return;
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
    XLSX.writeFile(wb, getFileName('xlsx'));
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    
    // Title
    doc.text("Attendance Report", 14, 15);
    doc.text(`For: ${reportFor === 'student' ? 'Class' : 'Role'} - ${getSelectedGroupName()}`, 14, 22);
    
    // Table
    (doc as any).autoTable({
      startY: 30,
      head: [['Name', 'Present', 'Absent', 'Leave', 'Total Tracked']],
      body: reportData.map(item => [
        item.name, 
        item.present, 
        item.absent, 
        item.leave, 
        item.total
      ]),
    });
    
    doc.save(getFileName('pdf'));
  };

  // Helper function (download ke liye)
  const getFileName = (extension: string) => {
    return `attendance_report_${selectedGroup}_${new Date().toISOString().slice(0,10)}.${extension}`;
  };
  const getSelectedGroupName = () => {
    if (reportFor === 'student') {
      return fetchedClasses.find(c => c.classid.toString() === selectedGroup)?.class_name || 'N/A';
    }
    return selectedGroup;
  }
  const downloadFile = (data: string, fileType: string, extension: string) => {
    const blob = new Blob([data], { type: fileType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', getFileName(extension));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // --- END FIX 8 ---


  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Attendance Dashboard</h1>
      
      {/* Pie Chart (Ab yeh report generate hone ke baad update hoga) */}
      <AttendancePieChart data={pieChartData} />

      {/* --- 9. JSX (DROPDOWNS) UPDATE KIYA --- */}
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
            <select 
              value={selectedGroup} 
              onChange={e => setSelectedGroup(e.target.value)} 
              disabled={isFilterLoading}
            >
              {isFilterLoading ? (
                <option>Loading...</option>
              ) : (
                groupOptions.map(opt => (
                  // 'opt' ab ya toh SchoolClass object hai ya string
                  typeof opt === 'object' 
                    ? <option key={opt.classid} value={opt.classid}>{opt.class_name}</option>
                    : <option key={opt} value={opt}>{opt}</option>
                ))
              )}
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

        <button className={styles.generateButton} onClick={handleGenerateReport} disabled={isLoading || isFilterLoading}>
            {isLoading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* --- 10. JSX (DOWNLOAD BUTTONS) UPDATE KIYA --- */}
      <div className={styles.reportDisplay}>
        <div className={styles.reportHeader}>
            <h3>Generated Report for: {getSelectedGroupName()}</h3>
            {reportData && reportData.length > 0 && (
                 <div className={styles.downloadButtons}>
                    <button className={styles.downloadButton} onClick={handleDownloadCSV}>
                        <MdDownload /> CSV
                    </button>
                    <button className={styles.downloadButton} onClick={handleDownloadExcel}>
                        <MdDownload /> Excel
                    </button>
                    <button className={styles.downloadButton} onClick={handleDownloadPDF}>
                        <MdDownload /> PDF
                    </button>
                 </div>
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
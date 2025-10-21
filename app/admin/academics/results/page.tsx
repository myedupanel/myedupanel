"use client";
import React, { useState, useEffect } from 'react';
import styles from './ResultsPage.module.scss';
import { MdAssessment, MdPrint, MdRemoveRedEye } from 'react-icons/md';
import Modal from '@/components/common/Modal/Modal';
import ReportCardDetail, { DetailedReportCard, SchoolInfo } from '@/components/admin/academics/ReportCardDetail';

// --- DATABASE MOCK ---
const schoolDetails: SchoolInfo = {
  name: "SchoolPro Academy",
  address: "123 Education Lane, Knowledge City",
  logoChar: 'S',
  session: "2025-2026",
};
const allStudents = [
  { id: 'S001', name: 'Aarav Sharma', class: 'Grade 10', rollNumber: '10-A-01', seatNumber: 'SC10-052' },
  { id: 'S002', name: 'Priya Patel', class: 'Grade 10', rollNumber: '10-A-02', seatNumber: 'SC10-053' },
  { id: 'S003', name: 'Rohan Mehta', class: 'Grade 9', rollNumber: '09-B-01', seatNumber: 'SC09-015' },
  { id: 'S004', name: 'Sneha Gupta', class: 'Grade 9', rollNumber: '09-B-02', seatNumber: 'SC09-016' },
];
const examStructureDatabase = {
  'Term Exams': {
    'Mid-Term Exam': { 'Mathematics': 100, 'Science': 100, 'English': 100 },
    'Final Exam': { 'Mathematics': 100, 'Science': 100, 'English': 100 },
  },
  'Monthly Tests': {
    'September Test': { 'Mathematics': 50, 'Science': 50 },
  },
};
const marksDatabase = {
  'Aarav Sharma': {
    'Final Exam': { 'Mathematics': 95, 'Science': 98, 'English': 88 },
    'Mid-Term Exam': { 'Mathematics': 85, 'Science': 90, 'English': 82 },
  },
  'Priya Patel': {
    'Final Exam': { 'Mathematics': 82, 'Science': 88, 'English': 90 },
  },
};
// --- END OF DATABASE MOCK ---

type ReportData = DetailedReportCard;

const ResultsPage = () => {
  const [selectedExamType, setSelectedExamType] = useState(Object.keys(examStructureDatabase)[0]);
  const [selectedExam, setSelectedExam] = useState(Object.keys(examStructureDatabase['Term Exams'])[0]);
  const [reportData, setReportData] = useState<ReportData[] | null>(null);
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);

  useEffect(() => {
    const examsInType = Object.keys(examStructureDatabase[selectedExamType as keyof typeof examStructureDatabase] || {});
    if (examsInType.length > 0 && !examsInType.includes(selectedExam)) {
      setSelectedExam(examsInType[0]);
    }
  }, [selectedExamType, selectedExam]);

  const handleGenerate = () => {
    const studentsInClass = allStudents.filter(s => s.class === selectedClass);
    
    // FIX: Added type assertions to safely access nested properties
    const examsForType = examStructureDatabase[selectedExamType as keyof typeof examStructureDatabase];
    const examMaxMarks = examsForType[selectedExam as keyof typeof examsForType];

    if (!examMaxMarks || Object.keys(examMaxMarks).length === 0) {
      setReportData([]);
      return;
    }
    
    const totalMaxMarks = Object.values(examMaxMarks).reduce<number>((acc, marks) => acc + Number(marks || 0), 0);

    const generatedReports: ReportData[] = studentsInClass.map(student => {
      // FIX: Added type assertions here as well for safety
      const studentExams = marksDatabase[student.name as keyof typeof marksDatabase];
      const studentMarksData = studentExams ? studentExams[selectedExam as keyof typeof studentExams] : undefined;
      
      const totalMarks = studentMarksData ? Object.values(studentMarksData).reduce<number>((acc, marks) => acc + Number(marks || 0), 0) : 0;
      
      const percentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
      
      const marksArray = studentMarksData ? Object.keys(studentMarksData).map(subject => ({
        subject,
        score: (studentMarksData as any)[subject] || 0,
        max: (examMaxMarks as any)[subject] || 0,
      })) : [];

      return {
        studentId: student.id,
        studentName: student.name,
        class: student.class,
        rollNumber: student.rollNumber,
        seatNumber: student.seatNumber,
        examName: selectedExam,
        totalMarks,
        maxMarks: totalMaxMarks,
        percentage,
        result: percentage >= 40 ? 'Pass' : 'Fail',
        marks: marksArray,
        attendance: 92,
        remarks: "Excellent progress.",
      };
    });
    setReportData(generatedReports);
  };

  const handleViewReport = (report: ReportData) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };
  
  const examOptions = Object.keys(examStructureDatabase[selectedExamType as keyof typeof examStructureDatabase] || {});

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1>Results & Report Cards</h1>
          <p>Generate and view student report cards for selected exams.</p>
        </div>
        <div className={styles.selectionPanel}>
          <div className={styles.formGroup}>
            <label htmlFor="class-select">Select Class</label>
            <select id="class-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              {[...new Set(allStudents.map(s => s.class))].map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="exam-type-select">Select Exam Type</label>
            <select id="exam-type-select" value={selectedExamType} onChange={(e) => setSelectedExamType(e.target.value)}>
              {Object.keys(examStructureDatabase).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="exam-select">Select Specific Exam</label>
            <select id="exam-select" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} disabled={!examOptions.length}>
              {examOptions.map(exam => <option key={exam} value={exam}>{exam}</option>)}
            </select>
          </div>
          <button className={styles.generateButton} onClick={handleGenerate}>
            <MdAssessment /> Generate Reports
          </button>
        </div>
        <div className={styles.resultsContainer}>
          {reportData ? (
             <table className={styles.resultsTable}>
               <thead>
                 <tr><th>Student Name</th><th>Total Marks</th><th>Percentage</th><th>Result</th><th>Actions</th></tr>
               </thead>
               <tbody>
                 {reportData.map(report => (
                   <tr key={report.studentId}>
                     <td>{report.studentName}</td>
                     <td>{`${report.totalMarks} / ${report.maxMarks}`}</td>
                     <td>{report.percentage}%</td>
                     <td><span className={`${styles.resultBadge} ${report.result === 'Pass' ? styles.pass : styles.fail}`}>{report.result}</span></td>
                     <td><button className={styles.viewButton} onClick={() => handleViewReport(report)}><MdRemoveRedEye /> View Report</button></td>
                   </tr>
                 ))}
               </tbody>
             </table>
          ) : (
             <div className={styles.emptyState}>
               <MdPrint size={60} />
               <h2>Generate Report Cards</h2>
               <p>Select a class and an exam from the options above and click 'Generate Reports' to see the results.</p>
             </div>
          )}
        </div>
      </div>
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Student Report Card">
        {selectedReport && <ReportCardDetail report={selectedReport} schoolInfo={schoolDetails} />}
      </Modal>
    </>
  );
};

export default ResultsPage;
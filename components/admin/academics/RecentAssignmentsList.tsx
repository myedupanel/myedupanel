"use client";
import React from 'react';
import styles from './ReportCardDetail.module.scss';
import { MdPrint, MdDownload } from 'react-icons/md';

export type SchoolInfo = { name: string; address: string; logoChar: string; session: string; };
export type DetailedReportCard = {
  studentName: string; class: string; rollNumber: string; seatNumber: string; // Seat No. add kiya
  examName: string; marks: { subject: string; score: number; max: number }[];
  totalMarks: number; maxMarks: number; percentage: number; result: 'Pass' | 'Fail';
  attendance: number; remarks: string; // Attendance aur Remarks add kiye
};
interface ReportCardDetailProps { report: DetailedReportCard | null; schoolInfo: SchoolInfo; }

const ReportCardDetail = ({ report, schoolInfo }: ReportCardDetailProps) => {
  if (!report) return null;

  const getGrade = (percentage: number) => { /* ... */ return 'A'; };
  const handleDownload = () => { alert('Download PDF functionality is a premium feature!'); };

  return (
    <div className={styles.wrapper}>
      <div className={styles.reportCard}>
        <div className={styles.cardHeader}>
          <div className={styles.schoolLogo}>{schoolInfo.logoChar}</div>
          <div className={styles.schoolInfo}>
            <h2>{schoolInfo.name}</h2>
            <p>{report.examName} | Session: {schoolInfo.session}</p>
          </div>
        </div>

        <div className={styles.infoCard}>
          <div><strong>Student:</strong> {report.studentName}</div>
          <div><strong>Class:</strong> {report.class}</div>
          <div><strong>Roll No:</strong> {report.rollNumber}</div>
          <div><strong>Seat No:</strong> {report.seatNumber}</div>
        </div>

        <div className={styles.tableCard}>
          <table className={styles.marksTable}>
            <thead><tr><th>Subject</th><th>Max Marks</th><th>Marks Obtained</th><th>Grade</th></tr></thead>
            <tbody>
              {report.marks.map((subject, index) => (
                <tr key={index}>
                  <td>{subject.subject}</td>
                  <td>{subject.max}</td>
                  <td>{subject.score}</td>
                  <td>{getGrade((subject.score / subject.max) * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.summaryCard}>
          <div><strong>Total Marks</strong><span>{report.totalMarks} / {report.maxMarks}</span></div>
          <div><strong>Percentage</strong><span>{report.percentage}%</span></div>
          <div><strong>Attendance</strong><span>{report.attendance}%</span></div>
          <div className={report.result === 'Pass' ? styles.pass : styles.fail}>
            <strong>Result</strong><span>{report.result}</span>
          </div>
        </div>

        <div className={styles.remarksCard}>
          <strong>Teacher's Remarks:</strong>
          <p>{report.remarks}</p>
        </div>
      </div>

      <div className={styles.modalActions}>
        <button className={`${styles.actionButton} ${styles.downloadButton}`} onClick={handleDownload}><MdDownload /> Download</button>
        <button className={`${styles.actionButton} ${styles.printButton}`} onClick={() => window.print()}><MdPrint /> Print</button>
      </div>
    </div>
  );
};

export default ReportCardDetail;
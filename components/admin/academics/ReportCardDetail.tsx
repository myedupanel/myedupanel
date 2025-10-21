"use client";
import React, { useRef } from 'react';
import styles from './ReportCardDetail.module.scss';
import { MdPrint, MdDownload } from 'react-icons/md';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Data Types
export type SchoolInfo = { name: string; address: string; logoChar: string; session: string; };
export type DetailedReportCard = {
  studentId: string;
  studentName: string; class: string; rollNumber: string; seatNumber: string;
  examName: string; marks: { subject: string; score: number; max: number }[];
  totalMarks: number; maxMarks: number; percentage: number; result: 'Pass' | 'Fail';
  attendance: number; remarks: string;
};
interface ReportCardDetailProps { report: DetailedReportCard | null; schoolInfo: SchoolInfo; }

const ReportCardDetail = ({ report, schoolInfo }: ReportCardDetailProps) => {
  const reportCardRef = useRef<HTMLDivElement>(null);

  if (!report || !schoolInfo) {
    return null;
  }

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+'; if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B'; if (percentage >= 60) return 'C';
    if (percentage >= 40) return 'D'; return 'F';
  };

  const handleDownload = () => {
    const input = reportCardRef.current;
    if (input) {
      // FIX: Removed the unsupported 'backgroundColor' property.
      html2canvas(input, { useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Report_Card_${report.studentName.replace(' ', '_')}.pdf`);
      });
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.reportCard} ref={reportCardRef}>
        <div className={styles.cardHeader}>
          <div className={styles.schoolLogo}>{schoolInfo.logoChar}</div>
          <div className={styles.schoolInfo}>
            <h2>{schoolInfo.name}</h2>
            <p>{report.examName} | Session: {schoolInfo.session}</p>
          </div>
        </div>
        
        <div className={styles.cardBody}>
          <div className={styles.studentInfo}>
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
                    <td>{subject.subject}</td><td>{subject.max}</td><td>{subject.score}</td><td>{getGrade((subject.score / subject.max) * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.summaryCard}>
            <div><strong>Total Marks</strong><span>{report.totalMarks} / {report.maxMarks}</span></div>
            <div><strong>Percentage</strong><span>{report.percentage}%</span></div>
            <div><strong>Attendance</strong><span>{report.attendance}%</span></div>
            <div className={report.result === 'Pass' ? styles.pass : styles.fail}><strong>Result</strong><span>{report.result}</span></div>
          </div>

          <div className={styles.remarksCard}>
            <strong>Teacher's Remarks:</strong><p>{report.remarks}</p>
          </div>

          <div className={styles.footer}>
            <div className={styles.signature}>Teacher's Signature</div>
            <div className={styles.signature}>Principal's Signature</div>
          </div>
        </div>
      </div>

      <div className={`${styles.modalActions} no-print`}>
        <button className={`${styles.actionButton} ${styles.downloadButton}`} onClick={handleDownload}><MdDownload /> Download PDF</button>
        <button className={`${styles.actionButton} ${styles.printButton}`} onClick={() => window.print()}><MdPrint /> Print</button>
      </div>
    </div>
  );
};

export default ReportCardDetail;
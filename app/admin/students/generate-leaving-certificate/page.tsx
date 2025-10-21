"use client";
import React, { useState, useEffect, useRef } from 'react';
import styles from './LeavingCertificate.module.scss';
import StudentSearch from '@/components/admin/StudentSearch/StudentSearch';
import LeavingCertificatePreview from '@/components/admin/LeavingCertificatePreview/LeavingCertificatePreview';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const LeavingCertificatePage = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const certificateRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '', gender: 'Male',
    placeOfBirth: '', birthDate: '', greNo: '', joiningDate: '',
    leavingDate: '', nationality: 'Indian', lastSchool: '',
    reasonForLeaving: '', generalRemark: 'Good', 
    certificateDate: new Date().toISOString().split('T')[0],
    feeDue: 'Yes', academicPerformance: 'Good', conduct: 'Good',
    coCurricular: 'Good', promotionStatus: 'Promoted', progress: 'Good',
    lastSchoolAttended: '', standardOfAdmission: '', joiningGrade: ''
  });
  
  const schoolDetails = {
    name: "Sunshine International School",
    address: "Pune, Maharashtra, 411041",
  };

  useEffect(() => {
    if (selectedStudent) {
      setFormData(prev => ({
        ...prev,
        firstName: selectedStudent.name.split(' ')[0] || '',
        lastName: selectedStudent.name.split(' ').slice(-1)[0] || '',
        birthDate: selectedStudent.dob || '',
        joiningDate: selectedStudent.joiningDate || '',
        greNo: selectedStudent.greNo || '',
      }));
    }
  }, [selectedStudent]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ===== PRINT FUNCTION =====
  const handlePrint = () => {
    const input = certificateRef.current;
    if (!input || !selectedStudent) return alert("Please select a student first.");

    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`<html><head><title>Print LC</title><style>@page{size:A4 portrait;margin:0;}body{margin:0;}img{width:100%;}</style></head><body><img src="${imgData}" /></body></html>`);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
    });
  };

  // ===== PDF DOWNLOAD FUNCTION =====
  const handleDownloadPDF = () => {
    const input = certificateRef.current;
    if (!input || !selectedStudent) return alert("Please select a student first.");

    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasRatio = canvas.width / canvas.height;
      let finalWidth = pdfWidth;
      let finalHeight = pdfWidth / canvasRatio;

      if (finalHeight > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * canvasRatio;
      }
      
      pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);
      pdf.save(`Leaving_Certificate_${selectedStudent.name.replace(/ /g, '_')}.pdf`);
    });
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Leaving Certificate Generator</h1>
        <p>Search for a student to generate their Leaving Certificate.</p>
      </header>
      
      <div className={styles.builderLayout}>
        <div className={styles.formColumn}>
          {/* ... (Form ka poora code waisa hi rahega) ... */}
          <div className={styles.formSection}>
            <h2>1. Select Student</h2>
            <StudentSearch onStudentSelect={setSelectedStudent} />
          </div>
          
          {selectedStudent && (
            <form>
              <div className={styles.formSection}>
                <h2>2. Student Details for {selectedStudent.name}</h2>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}><label className={styles.formLabel}>First Name</label><input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className={styles.formInput} /></div>
                  <div className={styles.formGroup}><label className={styles.formLabel}>Middle Name</label><input type="text" name="middleName" value={formData.middleName} onChange={handleInputChange} className={styles.formInput} /></div>
                  <div className={styles.formGroup}><label className={styles.formLabel}>Last Name</label><input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className={styles.formInput} /></div>
                  <div className={styles.formGroup}><label className={styles.formLabel}>Birthdate</label><input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} className={styles.formInput} /></div>
                  <div className={styles.formGroup}><label className={styles.formLabel}>Place of Birth</label><input type="text" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleInputChange} className={styles.formInput} /></div>
                  <div className={styles.formGroup}><label className={styles.formLabel}>Gender</label><div className={styles.radioGroup}><input type="radio" id="male" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleInputChange} /><label htmlFor="male">Male</label><input type="radio" id="female" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleInputChange} /><label htmlFor="female">Female</label></div></div>
                  <div className={styles.formGroup}><label className={styles.formLabel}>Date of Joining</label><input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} className={styles.formInput} /></div>
                  <div className={styles.formGroup}><label className={styles.formLabel}>Date Of Leaving</label><input type="date" name="leavingDate" value={formData.leavingDate} onChange={handleInputChange} className={styles.formInput} /></div>
                  <div className={styles.formGroup}><label className={styles.formLabel}>GRE No.</label><input type="text" name="greNo" value={formData.greNo} onChange={handleInputChange} className={styles.formInput} /></div>
                  <div className={styles.formGroup}><label className={styles.formLabel}>Nationality</label><input type="text" name="nationality" value={formData.nationality} onChange={handleInputChange} className={styles.formInput} /></div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h2>3. Certificate Details</h2>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup + ' ' + styles.fullWidth}><label className={styles.formLabel}>Reason for Leaving School</label><input type="text" name="reasonForLeaving" value={formData.reasonForLeaving} onChange={handleInputChange} className={styles.formInput} /></div>
                    <div className={styles.formGroup}><label className={styles.formLabel}>General Remark</label><input type="text" name="generalRemark" value={formData.generalRemark} onChange={handleInputChange} className={styles.formInput} /></div>
                    <div className={styles.formGroup}><label className={styles.formLabel}>Conduct</label><input type="text" name="conduct" value={formData.conduct} onChange={handleInputChange} className={styles.formInput} /></div>
                    <div className={styles.formGroup}><label className={styles.formLabel}>Progress</label><input type="text" name="progress" value={formData.progress} onChange={handleInputChange} className={styles.formInput} /></div>
                    <div className={styles.formGroup}><label className={styles.formLabel}>Academic Performance</label><input type="text" name="academicPerformance" value={formData.academicPerformance} onChange={handleInputChange} className={styles.formInput} /></div>
                    <div className={styles.formGroup + ' ' + styles.fullWidth}><label className={styles.formLabel}>Last School/College Attended</label><input type="text" name="lastSchoolAttended" value={formData.lastSchoolAttended} onChange={handleInputChange} className={styles.formInput} /></div>
                    <div className={styles.formGroup}><label className={styles.formLabel}>Joining Grade</label><input type="text" name="joiningGrade" value={formData.joiningGrade} onChange={handleInputChange} className={styles.formInput} /></div>
                    <div className={styles.formGroup}><label className={styles.formLabel}>Promotion Granted to</label><input type="text" name="promotionStatus" value={formData.promotionStatus} onChange={handleInputChange} className={styles.formInput} /></div>
                    <div className={styles.formGroup}><label className={styles.formLabel}>Certificate Date</label><input type="date" name="certificateDate" value={formData.certificateDate} onChange={handleInputChange} className={styles.formInput} /></div>
                    <div className={styles.formGroup}><label className={styles.formLabel}>Fee Due?</label><input type="text" name="feeDue" value={formData.feeDue} onChange={handleInputChange} className={styles.formInput} /></div>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className={styles.previewColumn}>
          <h2>Live Preview</h2>
          <div className={styles.previewWrapper} ref={certificateRef}>
            <LeavingCertificatePreview
              student={selectedStudent}
              formData={formData}
              schoolDetails={schoolDetails}
            />
          </div>
          {selectedStudent && (
            <div className={styles.actionsWrapper}>
              <button onClick={handleDownloadPDF} type="button" className={`${styles.actionButton} ${styles.download}`}><FiDownload /> Download LC</button>
              <button onClick={handlePrint} type="button" className={`${styles.actionButton} ${styles.print}`}><FiPrinter /> Print LC</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeavingCertificatePage;
"use client";
// FIX 1: 'useEffect' ko React se import kiya
import React, { useState, useRef, useEffect } from 'react'; 
import styles from './BonafideBuilder.module.scss';
import StudentSearch from '@/components/admin/StudentSearch/StudentSearch';
import BonafideForm from '@/components/admin/BonafideForm/BonafideForm';
import CertificatePreview from '@/components/admin/CertificatePreview/CertificatePreview';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// FIX 2: Aapka 'api' utility import kiya (jaisa aapne doosre components mein use kiya hai)
import api from '@/backend/utils/api'; 

const BonafideBuilderPage = () => {
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const certificateRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState({
    includeCaste: false,
    includeAadhaar: false,
    includeUdise: false,
    noSchoolHeader: false,
    includeCharacter: false,
    characterText: 'Good',
    includeSchoolRecInfo: false,
    schoolRecInfoText: '',
    includeReason: false,
    reasonText: '',
    paragraphText: `This is to certify that __studentName__, son/daughter of __parentName__, is a bonafide student of this school. He/She is studying in Class __class__ for the academic year __academicYear__.`,
    template: '1',
    principalRole: 'Principal',
  });

  // FIX 3: Hard-coded object ko 'useState' se badal diya
  const [schoolDetails, setSchoolDetails] = useState({
    name: "Loading School...",
    address: "Loading Address...",
    code: "..."
  });

  // FIX 4: Page load par school details fetch karne ke liye 'useEffect' add kiya
  useEffect(() => {
    const fetchSchoolDetails = async () => {
      try {
        // Maan lijiye yeh API endpoint logged-in admin ke school ki details deta hai
        const res = await api.get('/school/profile'); 
        if (res.data) {
          setSchoolDetails(res.data);
        } else {
          // Agar data na mile toh fallback
          setSchoolDetails({
            name: "My School (Default)",
            address: "My School Address (Default)",
            code: "000"
          });
        }
      } catch (err) {
        console.error("Failed to fetch school details:", err);
        // Error hone par fallback
        setSchoolDetails({
          name: "My School (Error)",
          address: "My School Address (Error)",
          code: "000"
        });
      }
    };

    fetchSchoolDetails();
  }, []); // [] ka matlab yeh effect sirf ek baar page load par chalega

  /* FIX 5: Yeh hard-coded object ab delete ho gaya hai
  const schoolDetails = {
    name: "Sunshine International School",
    address: "Pune, Maharashtra, 411041",
    code: "SIS"
  };
  */

  const handlePrint = () => {
    const input = certificateRef.current;
    if (!input || !selectedStudent) {
      alert("Please select a student first.");
      return;
    }

    html2canvas(input, { useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print Certificate</title><style>@page { size: A4 portrait; margin: 0; } body { margin: 0; } img { width: 100%; height: 100%; object-fit: contain; }</style></head>
            <body><img src="${imgData}" /></body>
          </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        };
      }
    });
  };

  const handleDownloadPDF = () => {
    const input = certificateRef.current;
    if (!input || !selectedStudent) {
      alert("Please select a student first.");
      return;
    }

    html2canvas(input, { useCORS: true })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        let width = pdfWidth;
        let height = width / ratio;

        if (height > pdfHeight) {
          height = pdfHeight;
          width = height * ratio;
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save(`Bonafide_${selectedStudent.name.replace(/ /g, '_')}.pdf`);
      });
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Bonafide Certificate Builder</h1>
        <p>Search for a student and customize the certificate details.</p>
      </header>
      
      <div className={styles.builderLayout}>
        <div className={styles.controlsColumn}>
          <div className={styles.controlSection}>
            <h2>1. Select Student</h2>
            <StudentSearch onStudentSelect={setSelectedStudent} />
          </div>
          
          {selectedStudent && (
            <>
              <div className={styles.controlSection}>
                <h2>2. Customize Certificate</h2>
                <BonafideForm 
                  student={selectedStudent} 
                  formData={formData} 
                  setFormData={setFormData} 
                />
              </div>

              <div className={styles.actionsWrapper}>
                  <button onClick={handleDownloadPDF} type="button" className={`${styles.actionButton} ${styles.download}`}>
                      <FiDownload /> Download
                  </button>
                  <button onClick={handlePrint} type="button" className={`${styles.actionButton} ${styles.print}`}>
                      <FiPrinter /> Print
                  </button>
              </div>
            </>
          )}
        </div>

        <div className={styles.previewColumn}>
          <h2>Live Preview</h2>
          <div className={styles.previewWrapper} ref={certificateRef}>
            <CertificatePreview 
              student={selectedStudent} 
              formData={formData} 
              // Yeh 'schoolDetails' ab hard-coded nahi hai, yeh state se aa raha hai
              schoolDetails={schoolDetails} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonafideBuilderPage;
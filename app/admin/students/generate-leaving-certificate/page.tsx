// app/admin/students/generate-leaving-certificate/page.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
// ✅ Use the new SCSS file
import styles from './LeavingCertificate.module.scss';
import StudentSearch from '@/components/admin/StudentSearch/StudentSearch';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '@/backend/utils/api';
import Link from 'next/link';
import { MdGridView } from 'react-icons/md';
import { useAuth } from '@/app/context/AuthContext';

// ✅ Import the new components and ensure correct paths
import LeavingCertificatePreview from '@/components/admin/LeavingCertificatePreview/LeavingCertificatePreview';
import LeavingCertificateForm from '@/components/admin/certificates/LeavingCertificateForm';

// --- Interfaces (Defined within the page for clarity, or import from types file) ---
export interface Student { // Base Student + LC specific fields StudentSearch MUST return
  id: string;
  name: string;
  class?: string; // Current Class
  dob?: string;
  address?: string;
  studentId?: string; // Register No (S.No 1)
  aadhaarNo?: string; // U.I.D (S.No 2)
  motherName?: string; // (S.No 4)
  nationality?: string; // (S.No 5) - Default to Indian if missing?
  caste?: string; // (S.No 6)
  birthPlace?: string; // (S.No 7)
  dobInWords?: string; // (S.No 9) - Ideally generate this if not stored
  // Add any other fields StudentSearch returns
}

export interface SchoolDetails { // Include Affiliation info
  name: string;
  name2?: string;
  address: string;
  mobNo?: string;
  email?: string;
  govtReg?: string;
  udiseNo?: string;
  logoUrl?: string;
  place?: string;
  affiliationIndex?: string; // INDEX No.
  affiliationDetails?: string; // Affiliated: XXXX
}

export interface LeavingFormData { // Form fields specific to LC
  previousSchool?: string; // (S.No 10)
  dateOfAdmission?: string; // (S.No 11)
  standardAdmitted?: string; // (S.No 11)
  progress?: string; // (S.No 12)
  conduct?: string; // (S.No 12)
  dateOfLeaving?: string; // (S.No 13)
  standardLeaving?: string; // (S.No 14 - e.g., "5th")
  standardLeavingWords?: string; // (S.No 14 - e.g., "Fifth")
  sinceWhenLeaving?: string; // (S.No 14 - e.g., "June 2025")
  reasonForLeaving?: string; // (S.No 15)
  remarks?: string; // (S.No 16)
  issueDate?: string; // (Footer)
  signatoryRole?: string; // (Footer)
}


// --- MAIN PAGE COMPONENT ---
const LeavingCertificateBuilderPage = () => {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const certificateRef = useRef<HTMLDivElement | null>(null);

  // ✅ Use the correct LeavingFormData state
  const [formData, setFormData] = useState<LeavingFormData>({
    previousSchool: '',
    dateOfAdmission: '',
    standardAdmitted: '',
    progress: 'Good',
    conduct: 'Good',
    dateOfLeaving: new Date().toISOString().split('T')[0],
    standardLeaving: '', // Will be set from student's current class
    standardLeavingWords: '',
    sinceWhenLeaving: '',
    reasonForLeaving: '',
    remarks: '',
    issueDate: new Date().toISOString().split('T')[0],
    signatoryRole: 'Head Master'
  });

  // ✅ Use the correct SchoolDetails state
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails>({
    name: "Loading...", name2: "", address: "Loading...",
    mobNo: "Loading...", email: "Loading...", govtReg: "Loading...",
    udiseNo: "Loading...", place: "Loading...", logoUrl: undefined,
    affiliationIndex: "Loading...", affiliationDetails: "Loading..."
  });

   // Update form data (like leaving standard) when student changes
   useEffect(() => {
    if (selectedStudent?.class) {
      setFormData(prev => ({
          ...prev,
          standardLeaving: selectedStudent.class,
          // Reset other fields that might depend on previous student?
          // Or pre-fill based on selected student if applicable
       }));
    } else {
       // Clear leaving standard if no student is selected
       setFormData(prev => ({ ...prev, standardLeaving: '' }));
    }
   }, [selectedStudent]);

  // Fetch School Profile
  useEffect(() => {
    const fetchSchoolProfile = async () => {
      console.log("Fetching school profile for LC...");
      try {
        // Ensure this endpoint returns all fields in SchoolDetails interface
        const res = await api.get('/api/school/profile');
        if (res.data) {
          setSchoolDetails({
            name: res.data.name || "N/A",
            name2: res.data.name2 || res.data.name, // Use name2 if available
            logoUrl: res.data.logoUrl || undefined,
            address: res.data.address || "N/A",
            mobNo: res.data.contactNumber || "N/A", // Map backend field name
            email: res.data.email || "N/A",
            govtReg: res.data.recognitionNumber || "N/A", // Map backend field name
            udiseNo: res.data.udiseNo || "N/A",
            place: res.data.place || "N/A",
            affiliationIndex: res.data.affiliationIndex || "N/A", // Map backend field name
            affiliationDetails: res.data.affiliationDetails || "N/A" // Map backend field name
          });
        } else { throw new Error("No data"); }
      } catch (err) {
        console.error("Failed to fetch school profile:", err);
        setSchoolDetails(prev => ({
            ...prev,
            name: user?.schoolName || "Error", name2: user?.schoolName || "Error",
            // Set other fields to "Error" or similar
            address: "Error", mobNo: "Error", email: "Error", govtReg: "Error",
            udiseNo: "Error", place: "Error", affiliationIndex: "Error", affiliationDetails: "Error"
        }));
      }
    };
    if (user) {
      fetchSchoolProfile();
    }
  }, [user]);


  // --- Print/Download functions (Adjust filename) ---
  const handlePrint = () => {
    const input = certificateRef.current;
    if (!input || !selectedStudent) { alert("Please select a student first."); return; }
    html2canvas(input, { scale: 2.5, useCORS: true } as any).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<html><head><title>Print Leaving Certificate</title><style>@page { size: A4 portrait; margin: 0; } body { margin: 0; } img { width: 100%; height: auto; display: block; }</style></head><body><img src="${imgData}" /></body></html>`);
        printWindow.document.close();
        printWindow.onload = () => { printWindow.focus(); setTimeout(() => { printWindow.print(); printWindow.close(); }, 250); };
      }
    }).catch(err => { console.error("Print LC Error:", err); alert("Error generating print preview."); });
  };

  const handleDownloadPDF = () => {
    const input = certificateRef.current;
    if (!selectedStudent) { alert("Please select a student first."); return; }
    if (!input) { alert("Preview element not found."); return; }
    html2canvas(input, { scale: 3, useCORS: true } as any)
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height; const margin = 10;
        let imgWidth = pdfWidth - (margin * 2); let imgHeight = imgWidth / ratio;
        let xOffset = margin; let yOffset = margin;
        if (imgHeight > pdfHeight - (margin * 2)) { imgHeight = pdfHeight - (margin * 2); imgWidth = imgHeight * ratio; xOffset = (pdfWidth - imgWidth) / 2; }
        else { yOffset = (pdfHeight - imgHeight) / 2; }
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
        pdf.save(`Leaving_Certificate_${selectedStudent.name.replace(/ /g, '_')}.pdf`); // Changed filename
      }).catch(err => { console.error("PDF LC Error:", err); alert("Error generating PDF."); });
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Leaving Certificate Builder</h1>
        <p>Search student, fill details, and preview the certificate.</p>
      </header>

      <div className={styles.builderLayout}>
        {/* Controls Column */}
        <div className={styles.controlsColumn}>
          <div className={styles.controlSection}>
            <h2>1. Select Student</h2>
             {/* IMPORTANT: Ensure StudentSearch fetches ALL needed fields in the 'Student' interface */}
            <StudentSearch onStudentSelect={(student) => setSelectedStudent(student as Student)} />
             <p className={styles.note}>
              Ensure Student Search provides all details listed in the certificate table (Aadhaar, Mother's Name etc.).
            </p>
          </div>
          {selectedStudent && (
            <>
              <div className={styles.controlSection}>
                <h2>2. Fill Leaving Details</h2>
                {/* Use the new Leaving Certificate Form */}
                <LeavingCertificateForm
                  formData={formData}
                  setFormData={setFormData}
                />
              </div>
              <div className={styles.actionsWrapper}>
                  <button onClick={handleDownloadPDF} type="button" className={`${styles.actionButton} ${styles.download}`}>
                      <FiDownload /> Download PDF
                  </button>
                  <button onClick={handlePrint} type="button" className={`${styles.actionButton} ${styles.print}`}>
                      <FiPrinter /> Print
                  </button>
              </div>
            </>
          )}
        </div>

        {/* Preview Column */}
        <div className={styles.previewColumn}>
          <h2>Live Preview</h2>
          <div className={styles.previewWrapper}>
             <div ref={certificateRef}>
                {/* Use the new Leaving Certificate Preview */}
               <LeavingCertificatePreview
                 student={selectedStudent}
                 formData={formData}
                 schoolDetails={schoolDetails}
               />
             </div>
          </div>
        </div>
      </div>

       <Link href="/admin/students" className={styles.dashboardLinkButton}>
          <MdGridView /> Go to Students Dashboard
       </Link>
    </div>
  );
};

export default LeavingCertificateBuilderPage;
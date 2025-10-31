// app/admin/students/generate-leaving-certificate/page.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import styles from './LeavingCertificate.module.scss';
import StudentSearch from '@/components/admin/StudentSearch/StudentSearch';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '@/backend/utils/api';
import Link from 'next/link';
import { MdGridView } from 'react-icons/md';
import { useAuth } from '@/app/context/AuthContext';

import LeavingCertificatePreview from '@/components/admin/LeavingCertificatePreview/LeavingCertificatePreview';
import LeavingCertificateForm from '@/components/admin/certificates/LeavingCertificateForm'; // Path sahi hai

// --- FIX 1: Student interface ko update kiya taaki saari details aa sakein ---
// (StudentSearch ko yeh sab return karna hoga)
export interface Student {
  id: string; // Prisma 'studentid' (Int) - StudentSearch ko string mein convert karna hoga
  name: string; // Poora naam
  class?: string; // Current Class name (e.g., "7")
  dob?: string; // YYYY-MM-DD format mein
  address?: string;
  studentId?: string; // Register No (Point 1 - Prisma 'roll_number')
  aadhaarNo?: string; // U.I.D (Point 2 - Prisma 'uid_number')
  motherName?: string; // (Point 4 - Prisma 'mother_name')
  nationality?: string; // (Point 5)
  motherTongue?: string; // (Point 5)
  religion?: string; // (Point 5)
  caste?: string; // (Point 5)
  birthPlace?: string; // (Point 6)
  birthTaluka?: string; // (Point 6)
  birthDistrict?: string; // (Point 6)
  birthState?: string; // (Point 6)
  dobInWords?: string; // (Point 8)
  dateOfAdmission?: string; // (Point 10)
  standardAdmitted?: string; // (Point 10)
  previousSchool?: string; // (Point 9)
}
// --- END FIX ---

export interface SchoolDetails {
  name: string;
  name2?: string;
  address: string;
  mobNo?: string;
  email?: string;
  govtReg?: string;
  udiseNo?: string;
  logoUrl?: string;
  place?: string;
  affiliationIndex?: string;
  affiliationDetails?: string;
}

// --- FIX 2: LeavingFormData interface ko Form component se match kiya ---
export interface LeavingFormData {
  // Fields from image header
  genRegNo?: string;
  regNo?: string;
  
  // Fields from image body
  studentAadharNo?: string; // Point 2
  nationality?: string;     // Point 5
  motherTongue?: string;    // Point 5
  religion?: string;        // Point 5
  caste?: string;           // Point 5
  birthPlace?: string;      // Point 6
  birthTaluka?: string;     // Point 6
  birthDistrict?: string;   // Point 6
  birthState?: string;      // Point 6
  dobWords?: string;        // Point 8

  // Aapke existing fields (Points 9-16 & Footer)
  previousSchool?: string;    // Point 9
  dateOfAdmission?: string;   // Point 10
  standardAdmitted?: string;  // Point 10
  progress?: string;          // Point 11
  conduct?: string;           // Point 12
  dateOfLeaving?: string;     // Point 13
  standardLeaving?: string;   // Point 14
  standardLeavingWords?: string; // Point 14
  sinceWhenLeaving?: string;  // Point 14
  reasonForLeaving?: string;  // Point 15
  remarks?: string;           // Point 16
  issueDate?: string;         // Footer
  signatoryRole?: string;     // Footer
}
// --- END FIX ---


// --- MAIN PAGE COMPONENT ---
const LeavingCertificateBuilderPage = () => {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const certificateRef = useRef<HTMLDivElement | null>(null);

  // --- FIX 3: formData state ko naye interface se match kiya ---
  const [formData, setFormData] = useState<LeavingFormData>({
    // Header
    genRegNo: '',
    regNo: '',
    // Point 2-8 (Student se pre-fill honge)
    studentAadharNo: '',
    nationality: 'Indian', // Default
    motherTongue: '',
    religion: '',
    caste: '',
    birthPlace: '',
    birthTaluka: '',
    birthDistrict: '',
    birthState: '',
    dobWords: '',
    // Point 9-16 & Footer
    previousSchool: '',
    dateOfAdmission: '',
    standardAdmitted: '',
    progress: 'Good', // Default
    conduct: 'Good', // Default
    dateOfLeaving: new Date().toISOString().split('T')[0],
    standardLeaving: '',
    standardLeavingWords: '',
    sinceWhenLeaving: '',
    reasonForLeaving: "Parent's Application", // Default
    remarks: '',
    issueDate: new Date().toISOString().split('T')[0],
    signatoryRole: 'Head Master'
  });
  // --- END FIX ---

  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails>({ /* ... (existing state) ... */
    name: "Loading...", name2: "", address: "Loading...",
    mobNo: "Loading...", email: "Loading...", govtReg: "Loading...",
    udiseNo: "Loading...", place: "Loading...", logoUrl: undefined,
    affiliationIndex: "Loading...", affiliationDetails: "Loading..."
  });

   // --- FIX 4: useEffect ko update kiya taaki student data se form pre-fill ho ---
   useEffect(() => {
    
    // Helper function to format date
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try { return new Date(dateStr).toISOString().split('T')[0]; } catch (e) { return ''; }
    };

    if (selectedStudent) {
      setFormData(prev => ({
          ...prev,
          // Student data se fields pre-fill karein
          studentAadharNo: selectedStudent.aadhaarNo || '',
          nationality: selectedStudent.nationality || 'Indian', // Default to Indian
          motherTongue: selectedStudent.motherTongue || '',
          religion: selectedStudent.religion || '',
          caste: selectedStudent.caste || '',
          birthPlace: selectedStudent.birthPlace || '',
          birthTaluka: selectedStudent.birthTaluka || '',
          birthDistrict: selectedStudent.birthDistrict || '',
          birthState: selectedStudent.birthState || '',
          dobWords: selectedStudent.dobInWords || '',
          previousSchool: selectedStudent.previousSchool || '',
          dateOfAdmission: formatDate(selectedStudent.dateOfAdmission),
          standardAdmitted: selectedStudent.standardAdmitted || '',
          
          // Current class se leaving standard set karein
          standardLeaving: selectedStudent.class || '', 
          
          // TODO: Generate standardLeavingWords from standardLeaving
          // (e.g., "5th" -> "Fifth")
          // TODO: Generate sinceWhenLeaving (usually start of session)
       }));
    } else {
       // Clear fields if no student is selected
       setFormData(prev => ({ 
           ...prev, 
           standardLeaving: '',
           studentAadharNo: '',
           // ... baaki fields bhi clear kar sakte hain
       }));
    }
   }, [selectedStudent]);
   // --- END FIX ---

  // Fetch School Profile (No Change)
  useEffect(() => {
    const fetchSchoolProfile = async () => { /* ... (existing function) ... */
      console.log("Fetching school profile for LC...");
      try {
        const res = await api.get('/api/school/profile');
        if (res.data) {
          setSchoolDetails({
            name: res.data.name || "N/A",
            name2: res.data.name2 || res.data.name,
            logoUrl: res.data.logoUrl || undefined,
            address: res.data.address || "N/A",
            mobNo: res.data.contactNumber || "N/A",
            email: res.data.email || "N/A",
            govtReg: res.data.recognitionNumber || "N/A",
            udiseNo: res.data.udiseNo || "N/A",
            place: res.data.place || "N/A",
            affiliationIndex: res.data.affiliationIndex || "N/A",
            affiliationDetails: res.data.affiliationDetails || "N/A"
          });
        } else { throw new Error("No data"); }
      } catch (err) {
        console.error("Failed to fetch school profile:", err);
        setSchoolDetails(prev => ({
            ...prev,
            name: user?.schoolName || "Error", name2: user?.schoolName || "Error",
            address: "Error", mobNo: "Error", email: "Error", govtReg: "Error",
            udiseNo: "Error", place: "Error", affiliationIndex: "Error", affiliationDetails: "Error"
        }));
      }
    };
    if (user) {
      fetchSchoolProfile();
    }
  }, [user]);


  // --- Print/Download functions (No Change) ---
  const handlePrint = () => { /* ... (existing function) ... */
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
  const handleDownloadPDF = () => { /* ... (existing function) ... */
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
        pdf.save(`Leaving_Certificate_${selectedStudent.name.replace(/ /g, '_')}.pdf`);
      }).catch(err => { console.error("PDF LC Error:", err); alert("Error generating PDF."); });
  };


  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Leaving Certificate Builder</h1>
        <p>Search student, fill details, and preview the certificate.</p>
      </header>

      <div className={styles.builderLayout}>
        {/* Controls Column (No Change) */}
        <div className={styles.controlsColumn}>
          <div className={styles.controlSection}>
            <h2>1. Select Student</h2>
            <StudentSearch onStudentSelect={(student) => setSelectedStudent(student as Student)} />
             <p className={styles.note}>
              Ensure Student Search provides all details listed in the certificate table (Aadhaar, Mother's Name etc.).
            </p>
          </div>
          {selectedStudent && (
            <>
              <div className={styles.controlSection}>
                <h2>2. Fill Leaving Details</h2>
                {/* Form ab updated state use karega */}
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

        {/* Preview Column (No Change) */}
        <div className={styles.previewColumn}>
          <h2>Live Preview</h2>
          <div className={styles.previewWrapper}>
             <div ref={certificateRef}>
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
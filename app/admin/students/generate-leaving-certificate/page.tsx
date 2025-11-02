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

// --- Student interface (No Change) ---
export interface Student {
  id: string; 
  name: string; 
  class?: string; 
  dob?: string; 
  address?: string;
  studentId?: string; 
  aadhaarNo?: string; 
  motherName?: string; 
  nationality?: string; 
  motherTongue?: string; 
  religion?: string; 
  caste?: string; 
  birthPlace?: string; 
  birthTaluka?: string; 
  birthDistrict?: string; 
  birthState?: string; 
  dobInWords?: string; 
  dateOfAdmission?: string; 
  standardAdmitted?: string; 
  previousSchool?: string; 
}
// --- END ---

// --- SchoolDetails interface (No Change) ---
export interface SchoolDetails {
  name: string;
  name2?: string;
  address: string;
  mobNo?: string;
  email?: string;
  govtReg?: string; // Yeh School ka "Sr. No." / "Reg. No." ho sakta hai
  udiseNo?: string;
  logoUrl?: string;
  place?: string;
  affiliationIndex?: string;
  affiliationDetails?: string;
}
// --- END ---

// --- LeavingFormData interface (No Change) ---
export interface LeavingFormData {
  genRegNo?: string;
  regNo?: string; // Yeh School ka "Sr. No." hai
  studentAadharNo?: string; 
  nationality?: string;     
  motherTongue?: string;    
  religion?: string;        
  caste?: string;           
  birthPlace?: string;      
  birthTaluka?: string;     
  birthDistrict?: string;   
  birthState?: string;      
  dobWords?: string;        
  previousSchool?: string;    
  dateOfAdmission?: string;   
  standardAdmitted?: string;  
  progress?: string;          
  conduct?: string;           
  dateOfLeaving?: string;     
  standardLeaving?: string;   
  standardLeavingWords?: string; 
  sinceWhenLeaving?: string;  
  reasonForLeaving?: string;  
  remarks?: string;           
  issueDate?: string;         
  signatoryRole?: string;     
}
// --- END ---

// --- FIX 3: Helper function (Standard ko words mein convert karne ke liye) ---
const standardMap: { [key: string]: string } = {
  '1': 'First',
  '2': 'Second',
  '3': 'Third',
  '4': 'Fourth',
  '5': 'Fifth',
  '6': 'Sixth',
  '7': 'Seventh',
  '8': 'Eighth',
  '9': 'Ninth',
  '10': 'Tenth',
  '11': 'Eleventh',
  '12': 'Twelfth',
};

/**
 * "7th" ya "Nursery" ko "Seventh" ya "Nursery" mein convert karta hai
 */
const convertStandardToWords = (standard: string | undefined): string => {
  if (!standard) return '';

  // "7th" -> 7 -> "7"
  const numStr = parseInt(standard, 10).toString(); 
  
  // Agar '7' map mein hai, toh 'Seventh' return karo
  if (standardMap[numStr]) {
    return standardMap[numStr];
  }
  
  // Agar "Nursery", "Jr. KG" jaisa kuch hai, toh wahi return karo
  if (isNaN(parseInt(standard, 10))) {
     return standard; 
  }

  // Fallback (jaise "13th" etc.)
  return standard;
};
// --- END FIX 3 ---


// --- MAIN PAGE COMPONENT ---
const LeavingCertificateBuilderPage = () => {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const certificateRef = useRef<HTMLDivElement | null>(null);

  // --- formData state (No Change) ---
  const [formData, setFormData] = useState<LeavingFormData>({
    genRegNo: '',
    regNo: '', // Yeh School Sr. No. hai
    studentAadharNo: '',
    nationality: 'Indian', 
    motherTongue: '',
    religion: '',
    caste: '',
    birthPlace: '',
    birthTaluka: '',
    birthDistrict: '',
    birthState: '',
    dobWords: '',
    previousSchool: '',
    dateOfAdmission: '',
    standardAdmitted: '',
    progress: 'Good', 
    conduct: 'Good', 
    dateOfLeaving: new Date().toISOString().split('T')[0],
    standardLeaving: '',
    standardLeavingWords: '',
    sinceWhenLeaving: '',
    reasonForLeaving: "Parent's Application", 
    remarks: '',
    issueDate: new Date().toISOString().split('T')[0],
    signatoryRole: 'Head Master'
  });
  // --- END ---

  // --- schoolDetails state (No Change) ---
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails>({ 
    name: "Loading...", name2: "", address: "Loading...",
    mobNo: "Loading...", email: "Loading...", govtReg: "Loading...",
    udiseNo: "Loading...", place: "Loading...", logoUrl: undefined,
    affiliationIndex: "Loading...", affiliationDetails: "Loading..."
  });
  // --- END ---


   // --- FIX 1 & 3: Student data se form pre-fill karna (Updated) ---
   useEffect(() => {
    
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try { return new Date(dateStr).toISOString().split('T')[0]; } catch (e) { return ''; }
    };

    if (selectedStudent) {
      // Student select hone par form data update karo
      setFormData(prev => ({
          ...prev,
          // --- FIX 1: Mother's Name yahan add kiya ---
          motherName: selectedStudent.motherName || '', 
          studentAadharNo: selectedStudent.aadhaarNo || '',
          
          nationality: selectedStudent.nationality || 'Indian', 
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
          
          standardLeaving: selectedStudent.class || '', 
          
          // --- FIX 3: TODO poora kiya ---
          standardLeavingWords: convertStandardToWords(selectedStudent.class),
          
          // TODO: Generate sinceWhenLeaving (usually start of session)
       }));
    } else {
       // Student clear karne par form data clear karo
       setFormData(prev => ({ 
           ...prev, 
           motherName: '', // Clear Mother's Name
           studentAadharNo: '', // Clear Aadhaar
           standardLeaving: '',
           standardLeavingWords: '',
           // ... baaki fields bhi clear kar sakte hain
       }));
    }
   }, [selectedStudent]);
   // --- END FIX ---

  // --- FIX 2: School Profile Fetch karna (Updated) ---
  useEffect(() => {
    const fetchSchoolProfile = async () => { 
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

          // --- FIX 2: School ka Sr. No. form state mein set kiya ---
          // (Hum maan rahe hain ki 'recognitionNumber' hi aapka 'regNo' hai)
          setFormData(prev => ({
            ...prev,
            regNo: res.data.recognitionNumber || ''
          }));

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
  // --- END FIX ---


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
  // --- END ---

  // --- JSX Return (No Change) ---
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

        {/* Preview Column */}
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
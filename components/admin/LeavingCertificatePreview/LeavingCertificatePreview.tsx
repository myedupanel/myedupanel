// File: LeavingCertificatePreview.tsx (FINAL PREMIUM STRUCTURE)

import React from 'react';
import styles from './LeavingCertificatePreview.module.scss'; 

// --- Interfaces (No Change) ---
interface Student {
  id: string; 
  name: string; 
  dob?: string; 
  studentId?: string; 
  aadhaarNo?: string; 
  motherName?: string; 
}
interface SchoolDetails {
  name: string; 
  name2?: string; 
  address: string; 
  govtReg?: string; 
  logoUrl?: string; 
  place?: string; 
  genRegNo?: string; 
  udiseNo?: string;
}

export interface LeavingFormData {
  regNo?: string; 
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
  genRegNo?: string;
  motherName?: string; 
}

// --- formatDate Function (No Change) ---
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date object created from:", dateString);
      return dateString;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
      console.warn("Invalid date format for formatDate:", dateString);
      return dateString;
   }
};

// --- Props Interface (No Change) ---
interface LeavingCertificatePreviewProps {
  student: Student | null;
  formData: LeavingFormData;
  schoolDetails: SchoolDetails;
}

// --- Helper Components (Modified to include noLine flag) ---
const fill = (value: string | undefined | null, noLine = false) => {
  const className = noLine ? styles.fillNoLine : (value ? styles.fill : styles.fillBlank); 
  if (value) {
    return <span className={className}>{value}</span>;
  }
  return <span className={className}>&nbsp;</span>; 
}

const SubField: React.FC<{ label: string, value: string | undefined | null, noLine?: boolean }> = ({ label, value, noLine = false }) => (
  <span className={styles.subField}>
    {/* Label ko tabhi dikhayein jab woh blank na ho */}
    {label && <span className={styles.subLabel}>{label}:</span>} 
    {fill(value, noLine)}
  </span>
);

// Yeh naya GridRow component blueprint banayega
const GridRow: React.FC<{ num: string, label: string, children: React.ReactNode, className?: string }> = ({ num, label, children, className }) => {
  return (
    <>
      <div className={`${styles.rowNum} ${className || ''}`}>{num}</div>
      <div className={`${styles.rowLabel} ${className || ''}`}>{label}</div>
      <div className={`${styles.rowValue} ${className || ''}`}>{children}</div>
    </>
  );
};
// --- End Helper Components ---


const LeavingCertificatePreview: React.FC<LeavingCertificatePreviewProps> = ({
  student,
  formData,
  schoolDetails
}) => {
  
  const dateOfAdmission = formatDate(formData.dateOfAdmission);
  const dateOfLeaving = formatDate(formData.dateOfLeaving);
  const studentDobFormatted = formatDate(student?.dob);

  return (
    <div className={styles.certificatePaper}>
      <div className={styles.outerBorder}>
        
        {/* Header (School Name, Logo, UDISE) */}
        <header className={styles.certHeader}>
          {schoolDetails.logoUrl && (
            <div className={styles.logoContainer}>
              <img 
                src={schoolDetails.logoUrl} 
                alt="School Logo" 
                className={styles.logo} 
              />
            </div>
          )}
          <div className={styles.schoolInfoBlock}>
            {/* School Name - First Line (if needed for Trust/Est. info) */}
            <div className={styles.schoolNameMyEdu}>{schoolDetails.name || 'My EduPanel Trust'}</div> 
            {/* School Name - Main Bold Line */}
            <div className={styles.schoolName1}>{schoolDetails.name2 || 'Prime International School'}</div>
            <div className={styles.schoolAddressCode}>
              {schoolDetails.address || 'Hinjewadi, Pune, 411057'}
              <br/>
              UDISE NO: {schoolDetails.udiseNo || '987654321012'}
            </div>
          </div>
        </header>
          
        {/* Title Row (Sr. No / Title / Reg. No) */}
        <div className={styles.titleRow}>
          <div className={styles.headerSrNo}>
            Sr. No: {fill(formData.genRegNo)}
          </div>
          <h2>LEAVING CERTIFICATE</h2>
          <div className={styles.headerRegNo}>
            Reg. No: {fill(formData.regNo)}
          </div>
        </div>

        {/* === MAIN BLUEPRINT (GRID) === */}
        <div className={styles.certificateGrid}>
          
          <GridRow num="1" label="Student's Full Name">
            {fill(student?.name)}
          </GridRow>
          
          <GridRow num="2" label="UID No (Aadhar card No.)">
            {fill(student?.aadhaarNo)}
          </GridRow>

          <GridRow num="3" label="Mother's Name">
            {fill(formData.motherName)}
          </GridRow>

          {/* === ROW 4: Nationality & Mother Tongue === */}
          <GridRow num="4" label="Nationality">
            <div className={styles.multiFieldRow}>
              {/* Nationality value (No label, no line needed for value) */}
              <SubField label="" value={formData.nationality || 'Indian'} noLine={true} />
              
              {/* Mother Tongue subfield */}
              <SubField label="Mother Tongue" value={formData.motherTongue} />
            </div>
          </GridRow>
          
          {/* === ROW 5: Religion & Caste === */}
          <GridRow num="5" label="Religion"> 
            <div className={styles.multiFieldRow}>
                {/* 1. Religion Value */}
                {fill(formData.religion)}
                
                {/* 2. Caste Field */}
                <span className={styles.casteField}>
                    <SubField label="Caste" value={formData.caste} />
                </span>
            </div>
          </GridRow>

          {/* === ROW 6: Birth Place SubGrid === */}
          <GridRow num="6" label="Birth place (State/City)">
             <div className={styles.subGrid}> 
                <SubField label="Place" value={formData.birthPlace} />
                <SubField label="Taluka" value={formData.birthTaluka} />
                <SubField label="Dist" value={formData.birthDistrict} />
                <SubField label="State" value={formData.birthState} />
             </div>
          </GridRow>

          <GridRow num="7" label="Date of Birth (Figures)">
            {fill(studentDobFormatted)}
          </GridRow>
          
          <GridRow num="8" label="Date of Birth (in Words)">
            {fill(formData.dobWords)}
          </GridRow>

          <GridRow num="9" label="Previous School Name">
            {fill(formData.previousSchool)}
          </GridRow>

          {/* === ROW 10: Admission Date & Standard === */}
          <GridRow num="10" label="Date of Admission">
             <div className={styles.multiFieldRow}>
                <SubField label="Date" value={dateOfAdmission} />
                <SubField label="Std" value={formData.standardAdmitted} />
             </div>
          </GridRow>

          {/* === ROW 11: Progress & Conduct === */}
          <GridRow num="11" label="Progress of Study">
             <div className={styles.multiFieldRow}>
                <SubField label="Progress" value={formData.progress} /> 
                <SubField label="Conduct" value={formData.conduct} />
             </div>
          </GridRow>

          <GridRow num="12" label="Date of School Leaving">
            {fill(dateOfLeaving)}
          </GridRow>
          
          {/* === ROW 13: Standard Leaving & Since When === */}
          <GridRow num="13" label="Standard in which studying and since when (in Words)">
            <div className={styles.multiFieldRow}>
              <SubField label="Std" value={formData.standardLeaving} />
              <SubField label="Since" value={formData.sinceWhenLeaving} />
            </div>
          </GridRow>

          <GridRow num="14" label="Reason for leaving school">
            {fill(formData.reasonForLeaving)}
          </GridRow>
          
          <GridRow num="15" label="Remarks" className={styles.lastRow}>
            {fill(formData.remarks)}
          </GridRow>
        </div>
        {/* === BLUEPRINT KHATM === */}


        {/* Certification Text */}
        <p className={styles.certText}>
          This is to certify that, Above mentioned information is as per 
          School General Register No. {fill(formData.genRegNo)}
        </p>

        {/* Footer (Signatures and Place/Date) */}
        <footer className={styles.certFooterWrapper}>
          <div className={styles.datePlace}>
            <span>Date: {fill(formData.issueDate)}</span>
            <span>Place: {fill(schoolDetails.place)}</span>
          </div>
          <div className={styles.signatures}>
            <div className={styles.sigBox}>
              <span>Class Teacher</span>
            </div>
            <div className={styles.sigBox}>
              <span>Clerk</span>
            </div>
            <div className={styles.sigBox}>
              <span>{formData.signatoryRole || 'Head Master'}</span>
            </div>
          </div>
        </footer>
        
      </div> {/* End outerBorder */}
    </div>
  );
};

export default LeavingCertificatePreview;
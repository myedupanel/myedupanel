// File: LeavingCertificatePreview.tsx (FINAL PREMIUM STRUCTURE - 100% MATCH)

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
  name2?: string; // Trust Name
  address: string; 
  email?: string; // Contact Email
  contactNumber?: string; // Contact Number
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
  subCaste?: string; // ADDED: Sub Caste
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
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
      return dateString;
   }
};

// --- Props Interface (No Change) ---
interface LeavingCertificatePreviewProps {
  student: Student | null;
  formData: LeavingFormData;
  schoolDetails: SchoolDetails;
}

// --- Helper Components ---
const fill = (value: string | undefined | null, noLine = false) => {
  const className = noLine ? styles.fillNoLine : (value ? styles.fill : styles.fillBlank); 
  if (value) {
    return <span className={className}>{value}</span>;
  }
  return <span className={className}>&nbsp;</span>; 
}

const SubField: React.FC<{ label: string, value: string | undefined | null, noLine?: boolean }> = ({ label, value, noLine = false }) => (
  <span className={styles.subField}>
    {label && <span className={styles.subLabel}>{label}</span>} 
    {fill(value, noLine)}
  </span>
);

// Helper component to render table rows based on SNS blueprint
const RenderRow = ({ label, children, isLast = false, labelClass = '' }: { label: string, children: React.ReactNode, isLast?: boolean, labelClass?: string }) => (
    <>
      <div className={`${styles.labelCell} ${isLast ? styles.lastRow : ''} ${labelClass}`}>{label}</div>
      <div className={`${styles.valueCell} ${isLast ? styles.lastRow : ''}`}>{children}</div>
    </>
  );


const LeavingCertificatePreview: React.FC<LeavingCertificatePreviewProps> = ({
  student,
  formData,
  schoolDetails
}) => {
  
  const dateOfAdmission = formatDate(formData.dateOfAdmission);
  const dateOfLeaving = formatDate(formData.dateOfLeaving);
  const studentDobFormatted = formatDate(student?.dob);
  
  // Header Contact Line
  const contactLine = `${schoolDetails.email || 'EMAIL NOT FOUND'} | ${schoolDetails.contactNumber || 'CONTACT NO. NOT FOUND'}`;


  return (
    <div className={styles.certificatePaper}>
      <div className={styles.outerBorder}>
        
        {/* === HEADER BLOCK (ZERO MARGIN FIX) === */}
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
            {/* 1. School Name (Largest/Bold - SWAPPED) */}
            <div className={styles.trustName}>{schoolDetails.name || 'KHANESPAR ENGLISH MEDIUM SCHOOL PARANDA'}</div> 
            
            {/* 2. Trust/Society Name (SWAPPED) */}
            <div className={styles.schoolName1}>{schoolDetails.name2 || 'AFFILIATED/DBT BOARD...'}</div>
            
            {/* 3. Address & Affiliation */}
            <div className={styles.schoolAddressCode}>
              {schoolDetails.address || 'FULL SCHOOL ADDRESS'}
              <br/>
              Affiliation No.: {fill('', true)} | U-DISE Code No.: {schoolDetails.udiseNo || '27251014726'}
            </div>
            
            {/* 4. Contact Line */}
            <div className={styles.schoolContact}>{contactLine}</div>
          </div>
        </header>
          
        {/* === METADATA (SERIAL & GR NO.) === */}
        <div className={styles.preHeaderRow}>
            <div className={styles.serialBox}>
                Serial No: {fill(formData.genRegNo || student?.studentId, true)}
            </div>
            <div className={styles.grBox}>
                G. R. No: {fill(formData.regNo || schoolDetails.genRegNo, true)}
            </div>
        </div>
        {/* === END PRE-HEADER === */}
        
        {/* Title Block */}
        <div className={styles.titleBlock}>
          <h2>LEAVING CERTIFICATE</h2>
        </div>

        {/* === MAIN BLUEPRINT (TABULAR GRID) === */}
        <div className={styles.certificateGrid}>
          
          <RenderRow label="Full Name:">
            {fill(student?.name)}
          </RenderRow>
          
          {/* === UID/AADHAR CARD ROW === */}
          <RenderRow label="UID Adhar Card No.:">
            {fill(student?.aadhaarNo)}
          </RenderRow>
          {/* === END UID/AADHAR CARD ROW === */}
          
          <RenderRow label="Mother's Name:">
            {fill(formData.motherName)}
          </RenderRow>

          {/* === ROW: Religion, Caste & Sub-Caste (3-Column Fix) === */}
          <RenderRow label="Religion and Caste with sub caste:">
            <div className={styles.multiFieldRowCaste}> 
                {/* Religion */}
                <SubField label="Religion" value={formData.religion} />
                
                {/* Caste */}
                <SubField label="Caste" value={formData.caste} />
                
                {/* Sub Caste */}
                <SubField label="Sub Caste" value={formData.subCaste} />
            </div>
          </RenderRow>

          <RenderRow label="Nationality:">
            {fill(formData.nationality || 'Indian')}
          </RenderRow>
          
          <RenderRow label="Place of Birth:">
            {/* Birth Place fields into one line */}
            <div className={styles.multiFieldRowCaste}> 
                <SubField label="Place" value={formData.birthPlace} />
                <SubField label="Taluka" value={formData.birthTaluka} />
                <SubField label="Dist" value={formData.birthDistrict} />
                <SubField label="State" value={formData.birthState} />
            </div>
          </RenderRow>
          
          <RenderRow label="Date of Birth (in figures):">
            {fill(studentDobFormatted)}
          </RenderRow>
          
          <RenderRow label="Date of Birth (in words):">
            {fill(formData.dobWords)}
          </RenderRow>

          <RenderRow label="Last School Attended:">
            {fill(formData.previousSchool)}
          </RenderRow>

          {/* === ROW: Date of Admission & Class === */}
          <RenderRow label="Date of Admission & Class:">
             <div className={styles.multiFieldRow}>
                <SubField label="Date" value={dateOfAdmission} />
                <SubField label="Class" value={formData.standardAdmitted} />
             </div>
          </RenderRow>

          <RenderRow label="Progress:">
            {fill(formData.progress)}
          </RenderRow>

          <RenderRow label="Conduct:">
            {fill(formData.conduct)}
          </RenderRow>

          <RenderRow label="Date of Leaving School:">
            {fill(dateOfLeaving)}
          </RenderRow>
          
          {/* === ROW: Standard Leaving & Since When === */}
          <RenderRow label="Standard in which studying and since when:">
            <div className={styles.multiFieldRow}>
              <SubField label="Std" value={formData.standardLeaving} />
              <SubField label="Since" value={formData.sinceWhenLeaving} />
            </div>
          </RenderRow>

          <RenderRow label="Reason for Leaving School:">
            {fill(formData.reasonForLeaving)}
          </RenderRow>
          
          <RenderRow label="Remarks:" isLast={true}>
            {fill(formData.remarks)}
          </RenderRow>
          
        </div>
        {/* === BLUEPRINT KHATM === */}


        {/* Certification Text */}
        <p className={styles.certText}>
          Certified that the above information is in accordance with school register.
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
              <span>School Seal</span>
            </div>
            <div className={styles.sigBox}>
              <span>{formData.signatoryRole || 'Head Mistress / Principal'}</span>
            </div>
          </div>
        </footer>
        
      </div> {/* End outerBorder */}
    </div>
  );
};

export default LeavingCertificatePreview;
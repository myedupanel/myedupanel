import React from 'react';
import styles from './LeavingCertificatePreview.module.scss'; // Import the SCSS file

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

// --- Helper Components (Yahi hai naya structure) ---

// fillBlank ab CSS dwara handle kiya jayega, taaki line poori fail sake
const fill = (value: string | undefined | null) => {
  if (value) {
    return <span className={styles.fill}>{value}</span>;
  }
  return <span className={styles.fillBlank}>&nbsp;</span>; 
}

const SubField = ({ label, value }: { label: string, value: string | undefined | null }) => (
  <span className={styles.subField}>
    <span className={styles.subLabel}>{label}:</span> 
    {fill(value)}
  </span>
);

// Yeh naya GridRow component blueprint banayega
const GridRow: React.FC<{ num: string, label: string, children: React.ReactNode, className?: string }> = ({ num, label, children, className }) => {
  // Hum display: contents use karenge taaki yeh row DOM mein na aaye
  // aur iske children seedha CSS grid mein fit ho jaayein.
  // Isse saari lines 100% align hongi.
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
        
        {/* Header (No Change) */}
        <header className={styles.certHeader}>
          {schoolDetails.logoUrl && (
            <img 
              src={schoolDetails.logoUrl} 
              alt="School Logo" 
              className={styles.logo} 
            />
          )}
          <div className={styles.schoolInfoBlock}>
            <div className={styles.schoolNameMyEdu}>{schoolDetails.name || 'My EduPanel Trust'}</div> 
            <div className={styles.schoolName1}>{schoolDetails.name2 || 'Your School Name'}</div>
            <div className={styles.schoolAddressCode}>
              {schoolDetails.address || 'Pune'}
              <br/>
              UDISE NO: {schoolDetails.udiseNo || '987654321012'}
            </div>
          </div>
        </header>
          
        {/* Title Row (Boxed) */}
        <div className={styles.titleRow}>
          <div className={styles.headerSrNo}>
            Sr. No: {fill(formData.genRegNo)}
          </div>
          <h2>LEAVING CERTIFICATE</h2>
          <div className={styles.headerRegNo}>
            Reg. No: {fill(formData.regNo)}
          </div>
        </div>

        {/* === YEH HAI NAYA BLUEPRINT === */}
        {/* Humne <table> ko hata diya hai aur CSS Grid use kiya hai */}
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

          <GridRow num="4" label="Nationality, Mother Tongue, Religion">
            <div className={styles.multiFieldRow}>
              <SubField label="Nationality" value={formData.nationality || 'Indian'} />
              <SubField label="Mother Tongue" value={formData.motherTongue} />
              <SubField label="Religion" value={formData.religion} />
            </div>
          </GridRow>
          
          <GridRow num="5" label="Caste">
            {fill(formData.caste)}
          </GridRow>

          <GridRow num="6" label="Birth place (State/City)">
             <div className={styles.subGrid}> {/* Yeh 2x2 grid hai */}
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

          <GridRow num="10" label="Date of Admission">
             <div className={styles.multiFieldRow}>
                <SubField label="Date" value={dateOfAdmission} />
                <SubField label="Std" value={formData.standardAdmitted} />
             </div>
          </GridRow>

          <GridRow num="11" label="Progress of Study">
             <div className={styles.multiFieldRow}>
                <SubField label="Progress" value={formData.progress} /> 
                <SubField label="Conduct" value={formData.conduct} />
             </div>
          </GridRow>

          <GridRow num="12" label="Date of School Leaving">
            {fill(dateOfLeaving)}
          </GridRow>
          
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


        {/* Certification Text (No Change) */}
        <p className={styles.certText}>
          This is to certify that, Above mentioned information is as per 
          School General Register No. {fill(formData.genRegNo)}
        </p>

        {/* Footer (No Change) */}
        <footer className={styles.certFooterWrapper}>
          <div className={styles.datePlace}>
            <span>Date: {fill(null)}</span>
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
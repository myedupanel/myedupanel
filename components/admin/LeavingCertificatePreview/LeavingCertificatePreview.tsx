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
const fill = (value: string | undefined | null, minWidth = '50px') => {
  if (value) {
    return <span className={styles.fill}>{value}</span>;
  }
  // fillBlank ab CSS dwara handle kiya jayega, taaki line poori fail sake
  return <span className={styles.fillBlank}>&nbsp;</span>; 
}

const SubField = ({ label, value, minWidth = '50px' }: { label: string, value: string | undefined | null, minWidth?: string }) => (
  <span className={styles.subField}>
    {label}: {fill(value, minWidth)}
  </span>
);

// Yeh naya GridRow component blueprint banayega
const GridRow: React.FC<{ num: string, label: string, children: React.ReactNode, className?: string }> = ({ num, label, children, className }) => {
  return (
    <div className={`${styles.gridRow} ${className || ''}`}>
      <div className={styles.rowNum}>{num}</div>
      <div className={styles.rowLabel}>{label}</div>
      <div className={styles.rowValue}>{children}</div>
    </div>
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
          <div className={styles.schoolInfoBlock}>
            <div className={styles.schoolName1}>{schoolDetails.name}</div>
            <div className={styles.schoolName2}>{schoolDetails.name2 || schoolDetails.name}</div>
            <div className={styles.schoolAddressCode}>
              {schoolDetails.address}
              <br/>
              UDISE NO: {schoolDetails.udiseNo}
            </div>
          </div>
          {/* Title row ko ab SCSS se box banaya jayega */}
          <div className={styles.titleRow}>
            <div className={styles.headerSrNo}>
              Sr. No: {fill(formData.genRegNo, '100px')}
            </div>
            <h2>LEAVING CERTIFICATE</h2>
            <div className={styles.headerRegNo}>
              Reg. No: {fill(formData.regNo, '100px')}
            </div>
          </div>
        </header>

        {/* === YEH HAI NAYA BLUEPRINT === */}
        {/* Humne <table> ko hata diya hai */}
        <div className={styles.certificateGrid}>
          <GridRow num="1" label="Student's Full Name">
            {fill(student?.name, '90%')}
          </GridRow>
          
          <GridRow num="2" label="UID No (Aadhar card No.)">
            {fill(student?.aadhaarNo, '90%')}
          </GridRow>

          <GridRow num="3" label="Mother's Name">
            {fill(formData.motherName, '90%')}
          </GridRow>

          <GridRow num="4" label="Nationality, Mother Tongue, Religion">
            <div className={styles.inlineFields}>
              <SubField label="Nationality" value={formData.nationality} minWidth="100px" />
              <SubField label="Mother Tongue" value={formData.motherTongue} minWidth="80px" />
              <SubField label="Religion" value={formData.religion} minWidth="80px" />
            </div>
          </GridRow>
          
          <GridRow num="5" label="Caste">
            {fill(formData.caste, '90%')}
          </GridRow>

          <GridRow num="6" label="Birth place (State/City)">
             <div className={styles.gridWrapper}> {/* Yeh 2x2 grid hai */}
                <SubField label="Place" value={formData.birthPlace} minWidth="80px" />
                <SubField label="Taluka" value={formData.birthTaluka} minWidth="80px" />
                <SubField label="Dist" value={formData.birthDistrict} minWidth="80px" />
                <SubField label="State" value={formData.birthState} minWidth="80px" />
             </div>
          </GridRow>

          <GridRow num="7" label="Date of Birth (Figures)">
            {fill(studentDobFormatted, '90%')}
          </GridRow>
          
          <GridRow num="8" label="Date of Birth (in Words)">
            {fill(formData.dobWords, '90%')}
          </GridRow>

          <GridRow num="9" label="Previous School Name">
            {fill(formData.previousSchool, '90%')}
          </GridRow>

          <GridRow num="10" label="Date of Admission">
             <div className={styles.inlineFields}>
                <SubField label="Date" value={dateOfAdmission} minWidth="120px" />
                <SubField label="Std" value={formData.standardAdmitted} minWidth="50px" />
             </div>
          </GridRow>

          <GridRow num="11" label="Progress of Study">
             <div className={styles.inlineFields}>
                {fill(formData.progress, '100px')} 
                <SubField label="Conduct" value={formData.conduct} minWidth="80px" />
             </div>
          </GridRow>

          <GridRow num="12" label="Date of School Leaving">
            {fill(dateOfLeaving, '90%')}
          </GridRow>
          
          <GridRow num="13" label="Standard in which studying and since when (in Words)">
            <div className={styles.inlineFields}>
              {fill(formData.standardLeaving, '80px')} / {fill(formData.sinceWhenLeaving, '100px')}
            </div>
          </GridRow>

          <GridRow num="14" label="Reason for leaving school">
            {fill(formData.reasonForLeaving, '90%')}
          </GridRow>
          
          {/* Aakhri row ko alag se class di taaki border fix ho sake */}
          <GridRow num="15" label="Remarks" className={styles.lastRow}>
            {fill(formData.remarks, '90%')}
          </GridRow>
        </div>
        {/* === BLUEPRINT KHATM === */}


        {/* Certification Text (No Change) */}
        <p className={styles.certText}>
          This is to certify that, Above mentioned information is as per 
          School General Register No. {fill(formData.genRegNo, '80px')}
        </p>

        {/* Footer (No Change) */}
        <footer className={styles.certFooterWrapper}>
          <div className={styles.datePlace}>
            <span>Date: {fill(null, '50px')} / {fill(null, '50px')} / {fill(null, '70px')}</span>
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
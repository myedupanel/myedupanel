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
      return dateString;
    }
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

const LeavingCertificatePreview: React.FC<LeavingCertificatePreviewProps> = ({
  student,
  formData,
  schoolDetails
}) => {
  // --- Helper Functions ---
  const fill = (value: string | undefined | null, minWidth = '100px', isBold = true) => {
    if (value) {
      return <span className={isBold ? styles.fill : styles.fillNormal}>{value}</span>;
    }
    return <span className={styles.fillBlank} style={{ minWidth }}>&nbsp;</span>;
  }
  
  const FieldRow = ({ srNo, label, children }: { srNo?: number, label?: string, children: React.ReactNode }) => (
    <div className={styles.fieldRow}>
        {srNo && <span className={styles.srNo}>{srNo}.</span>}
        {label && <span className={styles.label}>{label}:</span>}
        <div className={styles.valueContainer}>
            {children}
        </div>
    </div>
  );

  // --- Data Formatting ---
  const dateOfAdmission = formatDate(formData.dateOfAdmission);
  const studentDobFormatted = formatDate(student?.dob);

  // Image data based on the provided photo
  const photoSrNo = '10XXXXXXHSFGBFCH';
  const photoRegNo = '10XXXXXXHSFGBFCH';
  const photoGenRegNo = '7867';
  const photoStudentName = 'Shaurya Guutam Ghodage';
  const photoMotherName = 'Sindhu';
  const photoNationality = 'Indimu'; // Assuming Indian is intended
  const photoMotherTongue = 'Marathi';
  const photoBirthPlace = 'Barshi, Tulashi, Dist: Satara, State: Maharashtra';
  const photoCaste = 'Maratha';
  const photoDob = '08/10/2002';
  const photoPreviousSchool = 'Shree Ram High School';
  const photoProgress = 'Good';
  const photoConduct = 'Good';
  const photoStandard = 'Ist / ...'; // For line 12
  const photoReason = "Parent's Application";


  return (
    <div className={styles.certificatePaper}>
      <div className={styles.outerBorder}>
        
        {/* Header */}
        <header className={styles.certHeader}>
            <div className={styles.headerTitle}>
                <div className={styles.titleLine1}>PRIME INTERNATIONAL SCHOOL</div>
                <div className={styles.titleLine2}>LEAVING CERTIFICATE</div>
            </div>
            <div className={styles.logoPlaceholder}>
              <div className={styles.logoIcon}></div>
            </div>
        </header>

        {/* --- SCHOOL INFORMATION --- */}
        <div className={styles.infoSection}>
            <h3 className={styles.sectionHeading}>SCHOOL INFORMATION</h3>
            <div className={styles.schoolInfoGrid}>
                <div className={styles.leftCol}>
                    <div className={styles.schoolField}>
                        <span className={styles.label}>SR. NO.</span> {fill(photoSrNo, '150px')}
                    </div>
                    <div className={styles.schoolField}>
                        <span className={styles.label}>REG. NO.</span> {fill(photoRegNo, '150px')}
                    </div>
                </div>
                <div className={styles.rightCol}>
                    <div className={styles.schoolField}>
                        <span className={styles.label}>GENERAL REGISTER NO.</span> {fill(photoGenRegNo, '80px')}
                    </div>
                    <div className={styles.photoBox}>
                        PASSPORT <br/> PHOTO
                    </div>
                </div>
            </div>
        </div>

        {/* --- STUDENT'S PERSONAL INFORMATION --- */}
        <div className={styles.infoSection}>
            <h3 className={styles.sectionHeading}>STUDENT'S PERSONAL INFORMATION</h3>
            
            <FieldRow srNo={1} label="FULL NAME (AADHAR CARD NO.)">
                {fill(photoStudentName, '300px')}
            </FieldRow>
            <FieldRow srNo={3} label="MOTHER'S NAME">
                {fill(photoMotherName, '300px')}
            </FieldRow>
            <FieldRow srNo={4} label="NATIONALITY MOTHER TOUGE">
                {fill(photoNationality, '80px')}
                <span className={styles.label}>Marathi:</span>
                {fill(photoMotherTongue, '150px')}
            </FieldRow>
            <FieldRow srNo={6} label="BIRTH PLACE (STATE/CITY), Dist">
                 <span className={styles.valueLarge}>{fill(photoBirthPlace, '400px')}</span>
            </FieldRow>
             <FieldRow srNo={5} label="CASTE">
                {fill(photoCaste, '150px')}
            </FieldRow>
            <FieldRow srNo={7} label="DATE OF BIRTH (FIGURES)">
                {fill(photoDob, '150px')}
            </FieldRow>
        </div>

        {/* --- ACADEMIC & ADMISSION DETAILS --- */}
        <div className={styles.infoSection}>
            <h3 className={styles.sectionHeading}>ACADEMIC & ADMISSION DETAILS</h3>

            <FieldRow srNo={9} label="PREVIOUS SCHOOL NAME">
                {fill(photoPreviousSchool, '300px')}
            </FieldRow>
            <FieldRow srNo={10} label="DATE OF ADMISSION">
                {fill(dateOfAdmission || "N/A", '150px')}
            </FieldRow>
            <FieldRow srNo={11} label="PROGRESS OF STUDY">
                {fill(photoProgress, '100px')} 
                <span className={styles.label}>CONDUCT</span>
                {fill(photoConduct, '100px')}
            </FieldRow>
            <FieldRow srNo={12} label="STANDARD (कक्षा) IN WHICH STUDYING">
                {fill(photoStandard, '150px')}
            </FieldRow>
            <FieldRow srNo={14} label="REASON FOR LEAVING SCHOOL">
                {fill(photoReason, '350px')}
            </FieldRow>
        </div>


        {/* --- Footer --- */}
        <footer className={styles.certFooterWrapper}>
          <div className={styles.genRegLine}>
            <span className={styles.label}>GENERAL REGISTER NO:</span> 
            {fill(photoGenRegNo, '100px')}
          </div>
          <div className={styles.signatures}>
            <div className={styles.sigBox}>
              <div className={styles.sigText}>हस्ताक्षर</div>
              <div className={styles.sigRole}>SIGNATURES</div>
            </div>
            <div className={styles.sigBox}>
              <div className={styles.sigRole}>CLASS <br/> TEACHER</div>
            </div>
            <div className={styles.sigBox}>
              <div className={styles.sigRole}>CLERK <br/> HEAD MASTER</div>
            </div>
          </div>
        </footer>
        
      </div> {/* End outerBorder */}
    </div>
  );
};

export default LeavingCertificatePreview;
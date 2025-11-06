import React from 'react';
import styles from './LeavingCertificatePreview.module.scss'; // Import the SCSS file

// --- Interfaces (No Change) ---
interface Student {
// ... (Interfaces remain unchanged)
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
// ... (Interfaces remain unchanged)
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
// ... (formatDate remains unchanged)
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

const LeavingCertificatePreview: React.FC<LeavingCertificatePreviewProps> = ({
  student,
  formData,
  schoolDetails
}) => {
  // --- Helper Functions (No Change) ---
  const fill = (value: string | undefined | null, minWidth = '50px') => {
    if (value) {
      return <span className={styles.fill}>{value}</span>;
    }
    return <span className={styles.fillBlank} style={{ minWidth }}>&nbsp;</span>;
  }
  const SubField = ({ label, value, minWidth = '50px' }: { label: string, value: string | undefined | null, minWidth?: string }) => (
    <span className={styles.subField}>
      {label}: {fill(value, minWidth)}
    </span>
  );
  const dateOfAdmission = formatDate(formData.dateOfAdmission);
  const dateOfLeaving = formatDate(formData.dateOfLeaving);
  const studentDobFormatted = formatDate(student?.dob);

  return (
    <div className={styles.certificatePaper}>
      <div className={styles.outerBorder}>
        
        {/* === YAHAN FIX KIYA GAYA HAI === */}
        <header className={styles.certHeader}>
          <div className={styles.schoolInfoBlock}>
            
            {/* Trust Name (Small Text) - Ab 'name' field se aa raha hai */}
            <div className={styles.schoolNameMyEdu}>{schoolDetails.name || 'My EduPanel Trust'}</div> 
            
            {/* School Name (Big Text) - Ab 'name2' field se aa raha hai */}
            <div className={styles.schoolName1}>{schoolDetails.name2 || 'Your School Name'}</div>
            
            {/* Address (No Change) */}
            <div className={styles.schoolAddressCode}>
              {schoolDetails.address || 'Pune'}
              <br/>
              UDISE NO: {schoolDetails.udiseNo || '987654321012'}
            </div>
          </div>
          {/* === FIX ENDS HERE === */}
          

          {/* Title (No Change) */}
          <h2 className={styles.mainTitle}>LEAVING CERTIFICATE</h2>

          {/* Sr No / Reg No Row (No Change) */}
          <div className={styles.titleRow}>
            <div className={styles.headerSrNo}>
              Sr. No: {fill(formData.genRegNo, '100px')}
            </div>
            <div className={styles.headerRegNo}>
              Reg. No: {fill(formData.regNo, '100px')}
            </div>
          </div>
        </header>

        {/* --- Baaki poori file mein koi badlaav nahi hai --- */}
        
        {/* Student Info Table (REST OF THE BODY REMAINS UNCHANGED) */}
        <table className={styles.studentInfoTable}>
            {/* ... table content remains here ... */}
             <tbody>
            <tr>
              <td>1</td>
              <td>Student's Full Name</td>
              <td>{fill(student?.name, '300px')}</td>
            </tr>
            <tr>
              <td>2</td>
              <td>UID No (Aadhar card No.)</td>
              <td>{fill(student?.aadhaarNo, '200px')}</td>
            </tr>
            <tr>
              <td>3</td>
              <td>Mother's Name</td>
              <td>{fill(formData.motherName, '300px')}</td>
            </tr>
            <tr>
              <td>4</td>
              <td colSpan={2}> 
                <div className={styles.inlineFields}>
                  <SubField label="Nationality" value={formData.nationality || 'Indian'} minWidth="140px" />
                  <SubField label="Mother Tongue" value={formData.motherTongue} minWidth="85px" />
                  <SubField label="Religion" value={formData.religion} minWidth="80px" />
                </div>
              </td>
            </tr>
            <tr>
              <td>5</td>
              <td>Caste</td>
              <td>{fill(formData.caste, '150px')}</td>
            </tr>
            <tr>
              <td>6</td>
              <td>Birth place(State/City)</td>
              <td>
                <div className={styles.gridWrapper}>
                  <div className={styles.gridRow}>
                    <SubField label="Place" value={formData.birthPlace} minWidth="80px" />
                    <SubField label="Taluka" value={formData.birthTaluka} minWidth="80px" />
                  </div>
                  <div className={styles.gridRow}>
                    <SubField label="Dist" value={formData.birthDistrict} minWidth="80px" />
                    <SubField label="State" value={formData.birthState} minWidth="80px" />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td>7</td>
              <td>Date of Birth (Figures)</td>
              <td>{fill(studentDobFormatted, '150px')}</td>
            </tr>
            <tr>
              <td>8</td>
              <td>Date of Birth (in Words)</td>
              <td>{fill(formData.dobWords, '300px')}</td>
            </tr>
            <tr>
              <td>9</td>
              <td>Previous School Name</td>
              <td>{fill(formData.previousSchool, '200px')}</td>
            </tr>
            
            {/* --- YAHAN BADLAAV KIYA GAYA (ROW 10) --- */}
            <tr>
              <td>10</td>
              {/* colSpan={2} use kiya taaki label aur values ek cell mein aa jayein */}
              <td colSpan={2}>
                 <div className={styles.inlineFields}>
                  {/* Label ko SubField ke bahar, inlineFields ke andar rakha */}
                  <span style={{ marginRight: '15px' }}>Date of Admission</span>
                  <SubField label="Date" value={dateOfAdmission} minWidth="140px" />
                  <SubField label="Std" value={formData.standardAdmitted} minWidth="50px" />
                 </div>
              </td>
            </tr>
            {/* --- BADLAAV KHATM --- */}

            <tr>
              <td>11</td>
              <td>Progress of Study</td>
              <td>
                 <div className={styles.inlineFields}>
                    {fill(formData.progress, '100px')} 
                    <SubField label="Conduct" value={formData.conduct} minWidth="80px" />
                 </div>
              </td>
            </tr>
            <tr>
              <td>12</td>
              <td>Date of School Leaving</td>
              <td>{fill(dateOfLeaving, '150px')}</td>
            </tr>
            <tr>
              <td>1D3</td>
              <td>Standard in which studying and since when (in Words)</td>
              <td>
                <div className={styles.inlineFields}>
                  {fill(formData.standardLeaving, '80px')} / {fill(formData.sinceWhenLeaving, '100px')}
                </div>
              </td>
            </tr>
            <tr>
              <td>14</td>
              <td>Reason for leaving school</td>
              <td>{fill(formData.reasonForLeaving, '200px')}</td>
            </tr>
            <tr>
              <td>15</td>
              <td>Remarks</td>
              <td>{fill(formData.remarks, '200px')}</td>
            </tr>
          </tbody>
        </table>

        {/* Certification Text (No Change) */}
        <p className={styles.certText}>
          This is to certify that, Above mentioned information is as per 
          School General Register No. {fill(formData.genRegNo, '80px')}
        </p>

        {/* Footer (No Change) */}
        <footer className={styles.certFooterWrapper}>
          {/* ... (footer code) ... */}
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
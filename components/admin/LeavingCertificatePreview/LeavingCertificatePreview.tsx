import React from 'react';
import styles from './LeavingCertificatePreview.module.scss'; // Import the SCSS file

// --- Interfaces (No Change) ---
interface Student {
  id: string; 
  name: string; // Point 3
  dob?: string; // Point 8 (Figures)
  studentId?: string; // Point 1 (Sr. No)
  aadhaarNo?: string; // Point 2 (UID)
  motherName?: string; // Point 4
}
interface SchoolDetails {
  name: string; // Mandal Name
  name2?: string; // School Name
  address: string; // Address
  govtReg?: string; // Code No. (Aapke School Details se)
  logoUrl?: string; // Logo
  place?: string; // Footer
}
export interface LeavingFormData {
  regNo?: string; // Header
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
        
        {/* Header (Pehle se updated hai) */}
        <header className={styles.certHeader}>
          <div className={styles.schoolInfoBlock}>
            <div className={styles.schoolName1}>{schoolDetails.name}</div>
            <div className={styles.schoolName2}>{schoolDetails.name2 || schoolDetails.name}</div>
            <div className={styles.schoolAddressCode}>
              {schoolDetails.address}
              <br/>
              UDISE NO: {schoolDetails.govtReg}
            </div>
          </div>
          <div className={styles.titleRow}>
            <div className={styles.headerSrNo}>
              Sr. No: {fill(student?.studentId, '100px')}
            </div>
            <h2>LEAVING CERTIFICATE</h2>
            <div className={styles.headerRegNo}>
              Reg. No: {fill(formData.regNo, '100px')}
            </div>
          </div>
        </header>

        {/* Student Info Table */}
        <table className={styles.studentInfoTable}>
          <tbody>
            <tr>
              <td>1</td>
              <td>Sr. No.</td>
              <td>{fill(student?.studentId, '100px')}</td>
            </tr>
            <tr>
              <td>2</td>
              <td>UID No (Aadhar card No.)</td>
              <td>{fill(student?.aadhaarNo, '200px')}</td>
            </tr>
            <tr>
              <td>3</td>
              <td>Student's Full Name</td>
              <td>{fill(student?.name, '300px')}</td>
            </tr>
            <tr>
              <td>4</td>
              <td>Mother's Name</td>
              <td>{fill(student?.motherName, '300px')}</td>
            </tr>
            {/* Point 5 (Pehle se updated hai) */}
            <tr>
              <td>5</td>
              <td>Nationality</td>
              <td>
                <SubField label="Nationality" value={formData.nationality} minWidth="80px" />
                <SubField label="Mother Tongue" value={formData.motherTongue} minWidth="80px" />
                <SubField label="Religion" value={formData.religion} minWidth="80px" />
              </td>
            </tr>
            <tr>
              <td>6</td>
              <td>Caste</td>
              <td>{fill(formData.caste, '150px')}</td>
            </tr>
            {/* Point 7 (Pehle se updated hai) */}
            <tr>
              <td>7</td>
              <td>Birth place(State/City)</td>
              <td>
                <SubField label="Place" value={formData.birthPlace} minWidth="80px" />
                <SubField label="Taluka" value={formData.birthTaluka} minWidth="80px" />
                <br/>
                <SubField label="Dist" value={formData.birthDistrict} minWidth="80px" />
                <SubField label="State" value={formData.birthState} minWidth="80px" />
              </td>
            </tr>
            <tr>
              <td>8</td>
              <td>Date of Birth (Words)</td>
              <td>{fill(studentDobFormatted, '150px')}</td>
            </tr>
            <tr>
              <td>9</td>
              <td>Date of Birth (in Words)</td>
              <td>{fill(formData.dobWords, '300px')}</td>
            </tr>
            <tr>
              <td>10</td>
              <td>Previous School Name</td>
              <td>{fill(formData.previousSchool, '200px')}</td>
            </tr>
            <tr>
              <td>11</td>
              <td>Date of Admission</td>
              <td>
                <SubField label="Date" value={dateOfAdmission} minWidth="100px" />
                <SubField label="Std" value={formData.standardAdmitted} minWidth="50px" />
              </td>
            </tr>
            
            {/* --- FIX 1 (Point 12 Layout) --- */}
            <tr>
              <td>12</td>
              <td>Progress of Study</td>
              <td>
                {/* Blueprint jaisa: "Good" aur "Conduct: ___" */}
                {fill(formData.progress, '100px')} 
                <SubField label="Conduct" value={formData.conduct} minWidth="80px" />
              </td>
            </tr>
            {/* --- END FIX 1 --- */}

            <tr>
              <td>13</td>
              <td>Date of School Leaving</td>
              <td>{fill(dateOfLeaving, '150px')}</td>
            </tr>

            {/* --- FIX 2 (Point 14 Layout) --- */}
            <tr>
              <td>14</td>
              <td>Standard in which studying and since when (in Words)</td>
              <td>
                {/* Blueprint jaisa: "8th / 31st June 2023" */}
                {fill(formData.standardLeaving, '80px')} / {fill(formData.sinceWhenLeaving, '100px')}
              </td>
            </tr>
            {/* --- END FIX 2 --- */}

            <tr>
              <td>15</td>
              <td>Reason for leaving school</td>
              <td>{fill(formData.reasonForLeaving, '200px')}</td>
            </tr>
            <tr>
              <td>16</td>
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

        {/* Footer (Pehle se updated hai) */}
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
import React from 'react';
import styles from './LeavingCertificatePreview.module.scss'; // Import the SCSS file

// --- FIX 1: Interfaces ko Form se match karne ke liye update kiya ---

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

// Yeh interface ab LeavingCertificateForm.tsx ke interface se match karta hai
export interface LeavingFormData {
  regNo?: string; // Header
  
  // Point 5
  nationality?: string;
  motherTongue?: string;
  religion?: string;
  // Point 6
  caste?: string;
  // Point 7
  birthPlace?: string;
  birthTaluka?: string;
  birthDistrict?: string;
  birthState?: string;
  // Point 9
  dobWords?: string;
  // Point 10
  previousSchool?: string;
  // Point 11
  dateOfAdmission?: string;
  standardAdmitted?: string;
  // Point 12
  progress?: string;
  conduct?: string;
  // Point 13
  dateOfLeaving?: string;
  // Point 14
  standardLeaving?: string;
  standardLeavingWords?: string; // Iski zaroorat nahi, blueprint mein simple "8th" likha hai
  sinceWhenLeaving?: string;
  // Point 15
  reasonForLeaving?: string;
  // Point 16
  remarks?: string;
  
  // Footer
  issueDate?: string;
  signatoryRole?: string;
  genRegNo?: string; // Footer certification text ke liye
}
// --- END FIX 1 ---


const formatDate = (dateString: string | undefined): string => {

  if (!dateString) return '';

  try {

    const date = new Date(dateString);



    // --- FIX YAHAN HAI ---

    // Pehle check karein ki date valid hai ya nahi

    // Agar dateString galat hai (jaise "abc"), toh date.getTime() NaN hoga

    if (isNaN(date.getTime())) {

      console.warn("Invalid date object created from:", dateString);

      return dateString; // Agar invalid hai, toh original string waapas karein

    }

    // --- END FIX ---



    // Force DD/MM/YYYY format

    const day = String(date.getDate()).padStart(2, '0');

    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed

    const year = date.getFullYear();

    

    // Ab is line (purani line 77) ki zaroorat nahi hai, kyonki humne upar check kar liya

    // if (isNaN(day) || isNaN(month) || isNaN(year)) return dateString; 

    

    return `${day}/${month}/${year}`;

    

  } catch (e) {

      console.warn("Invalid date format for formatDate:", dateString);

      return dateString; // Fallback

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
  // Yeh helper function data ko fill karega
  // Hum ise thoda modify karenge taaki 'fill' class hamesha rahe
  const fill = (value: string | undefined | null, minWidth = '50px') => {
    // Agar value hai, toh use dikhayein
    if (value) {
      return <span className={styles.fill}>{value}</span>;
    }
    // Agar value nahi hai, toh ek blank placeholder (line) dikhayein
    return <span className={styles.fillBlank} style={{ minWidth }}>&nbsp;</span>;
  }

  // Helper function ek line mein multiple items ke liye
  const SubField = ({ label, value, minWidth = '50px' }: { label: string, value: string | undefined | null, minWidth?: string }) => (
    <span className={styles.subField}>
      {label}: {fill(value, minWidth)}
    </span>
  );

  // Dates ko format karein
  const dateOfAdmission = formatDate(formData.dateOfAdmission);
  const dateOfLeaving = formatDate(formData.dateOfLeaving);
  const issueDate = formatDate(formData.issueDate);
  const studentDobFormatted = formatDate(student?.dob);

  return (
    // --- FIX 2: poora JSX blueprint se match karne ke liye badla ---
    <div className={styles.certificatePaper}>
      <div className={styles.outerBorder}> {/* Blueprint jaisa outer border */}
        
        {/* Header */}
        <header className={styles.certHeader}>
          {schoolDetails.logoUrl && (
            <img src={schoolDetails.logoUrl} alt="School Logo" className={styles.logo} />
          )}
          
          <div className={styles.schoolInfoBlock}>
            <div className={styles.schoolName1}>{schoolDetails.name}</div>
            <div className={styles.schoolName2}>{schoolDetails.name2 || schoolDetails.name}</div>
            <div className={styles.schoolAddressCode}>
              {schoolDetails.address}
              <br/>
              Code No.: {schoolDetails.govtReg}
            </div>
          </div>
          
          <div className={styles.titleBlock}>
            <h2>LEAVING CERTIFICATE</h2>
            <div className={styles.regNo}>
              Reg. No: {fill(formData.regNo, '80px')}
            </div>
          </div>
        </header>

        {/* Student Info Table */}
        <table className={styles.studentInfoTable}>
          <tbody>
            {/* Har row ko blueprint se milaya gaya hai */}
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
            <tr>
              <td>5</td>
              <td>Nationality</td>
              <td>
                <SubField label="Nationality" value={formData.nationality || 'Indian'} minWidth="80px" />
                <SubField label="Mother Tongue" value={formData.motherTongue} minWidth="80px" />
                <SubField label="Religion" value={formData.religion} minWidth="80px" />
              </td>
            </tr>
            <tr>
              <td>6</td>
              <td>Caste</td>
              <td>{fill(formData.caste, '150px')}</td>
            </tr>
            <tr>
              <td>7</td>
              <td>Birth place(State/City)</td>
              <td>
                <SubField label="Place" value={formData.birthPlace} minWidth="80px" />
                <SubField label="Taluka" value={formData.birthTaluka} minWidth="80px" />
                <br/> {/* Nayi line par Dist/State */}
                <SubField label="Dist" value={formData.birthDistrict} minWidth="80px" />
                <SubField label="State" value={formData.birthState} minWidth="80px" />
              </td>
            </tr>
            <tr>
              <td>8</td>
              <td>Date of Birth (Words)</td>
              {/* Blueprint mein Pt 8 par figures (DD/MM/YYYY) hain */}
              <td>{fill(studentDobFormatted, '150px')}</td>
            </tr>
            <tr>
              <td>9</td>
              <td>Date of Birth (in Words)</td>
              {/* Blueprint mein Pt 9 par words hain */}
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
            <tr>
              <td>12</td>
              <td>Progress of Study</td>
              <td>
                <SubField label="Progress" value={formData.progress} minWidth="80px" />
                <SubField label="Conduct" value={formData.conduct} minWidth="80px" />
              </td>
            </tr>
            <tr>
              <td>13</td>
              <td>Date of School Leaving</td>
              <td>{fill(dateOfLeaving, '150px')}</td>
            </tr>
            <tr>
              <td>14</td>
              <td>Standard in which studying and since when (in Words)</td>
              {/* Blueprint mein yeh "8th / 31st June 2023" jaisa hai */}
              <td>
                <SubField label="Std" value={formData.standardLeaving} minWidth="50px" />
                <SubField label="Since" value={formData.sinceWhenLeaving} minWidth="100px" />
              </td>
            </tr>
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

        {/* Certification Text */}
        <p className={styles.certText}>
          This is to certify that, Above mentioned information is as per 
          School General Register No. {fill(formData.genRegNo, '80px')}
        </p>

        {/* Footer */}
        <footer className={styles.certFooter}>
          <div className={styles.datePlace}>
            Date : {fill(issueDate, '100px')}
          </div>
          <div className={styles.sigBox}>
            <span>Class Teacher</span>
          </div>
          <div className={styles.sealArea}>
            ( School Seal )
          </div>
          <div className={styles.sigBox}>
            <span>{formData.signatoryRole || 'Head Master'}</span>
          </div>
        </footer>
      </div> {/* End outerBorder */}
    </div>
  );
  // --- END FIX 2 ---
};

export default LeavingCertificatePreview;
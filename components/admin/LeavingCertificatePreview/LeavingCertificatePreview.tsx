// src/components/admin/certificates/LeavingCertificatePreview.tsx
import React from 'react';
import styles from './LeavingCertificatePreview.module.scss'; // Import the SCSS file

// Define interfaces locally or import them
// Make sure these match the ones in your page.tsx
interface Student {
  id: string; name: string; class?: string; dob?: string; address?: string;
  studentId?: string; aadhaarNo?: string; motherName?: string;
  nationality?: string; caste?: string; birthPlace?: string; dobInWords?: string;
}
interface SchoolDetails {
  name: string; name2?: string; address: string; mobNo?: string; email?: string;
  govtReg?: string; udiseNo?: string; logoUrl?: string; place?: string;
  affiliationIndex?: string; affiliationDetails?: string;
}
interface LeavingFormData {
  previousSchool?: string; dateOfAdmission?: string; standardAdmitted?: string;
  progress?: string; conduct?: string; dateOfLeaving?: string;
  standardLeaving?: string; standardLeavingWords?: string; sinceWhenLeaving?: string;
  reasonForLeaving?: string; remarks?: string; issueDate?: string;
  signatoryRole?: string;
}

// Helper function
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    // Attempt to format assuming YYYY-MM-DD input
    const [year, month, day] = dateString.split('-');
    if (year && month && day && year.length === 4) {
        return `${day}/${month}/${year}`; // Format to DD/MM/YYYY
    }
    // Fallback for potentially different date formats or already formatted dates
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  } catch (e) {
      console.warn("Invalid date format for formatDate:", dateString);
      return dateString; // Return original string if formatting fails
   }
};

// Function to convert number to words (simple implementation)
// You might need a more robust library for complex cases (e.g., large numbers, locales)
const numberToWords = (numStr: string | undefined): string => {
    if (!numStr) return '';
    // Basic conversion logic (example)
    const num = parseInt(numStr.replace(/[^0-9]/g,''), 10); // Extract number
    if (isNaN(num)) return numStr; // Return original if not a simple number

    const words = ['Zero', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth'];
    if (num >= 0 && num < words.length) {
        return words[num];
    }
    // Add more logic for higher numbers if needed
    return numStr; // Fallback
}

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
  // Use blank span placeholders for missing data
  const fill = (value: string | undefined | null, minWidth = '50px') =>
    value ? <span className={styles.fillIn}>{value}</span> : <span className={styles.fillInBlank} style={{ minWidth }}>&nbsp;</span>;

  const dateOfAdmission = formData.dateOfAdmission ? formatDate(formData.dateOfAdmission) : '';
  const dateOfLeaving = formData.dateOfLeaving ? formatDate(formData.dateOfLeaving) : '';
  const issueDate = formData.issueDate ? formatDate(formData.issueDate) : '';
  const studentDobFormatted = student?.dob ? formatDate(student.dob) : '';
  // Attempt to generate dobInWords if not provided
  const studentDobInWords = student?.dobInWords || (studentDobFormatted ? `( ${studentDobFormatted} )` : ''); // Simple fallback
  const standardLeavingWords = formData.standardLeavingWords || numberToWords(formData.standardLeaving); // Try auto-conversion

  return (
    <div className={styles.certificatePaper}>
      {/* Header */}
      <header className={styles.certHeader}>
        {schoolDetails.logoUrl && (
          <img src={schoolDetails.logoUrl} alt="School Logo" className={styles.logo} />
        )}
        <div className={styles.schoolInfoBlock}>
          <h3 className={styles.schoolName1}>{schoolDetails.name}</h3>
          <h2 className={styles.schoolName2}>{schoolDetails.name2 || schoolDetails.name}</h2>
          <p className={styles.schoolAddress}>{schoolDetails.address}</p>
          <p className={styles.schoolContact}>
            {schoolDetails.mobNo && `Mob. No.: ${schoolDetails.mobNo} `}
            {schoolDetails.email && `Email: ${schoolDetails.email}`}
          </p>
          <p className={styles.schoolReg}>
             {schoolDetails.govtReg && `Govt Reg. No.: ${schoolDetails.govtReg}`}
             {/* Added space for alignment if one is missing */}
             {schoolDetails.udiseNo && ` ${'\u00A0'.repeat(5)} UDISE No.: ${schoolDetails.udiseNo}`}
          </p>
        </div>
        <div className={styles.affiliationInfo}>
            {schoolDetails.affiliationIndex && <p>INDEX No.: {schoolDetails.affiliationIndex}</p>}
            {schoolDetails.affiliationDetails && <p>{schoolDetails.affiliationDetails}</p>}
        </div>
      </header>

       {/* Title */}
      <div className={styles.certTitle}>
        <h2>LEAVING CERTIFICATE</h2>
      </div>

       {/* Student Info Table */}
      <table className={styles.studentInfoTable}>
        <tbody>
          <tr><td>1</td><td>S.No.</td><td>{fill(student?.studentId)}</td></tr>
          <tr><td>2</td><td>U.I.D No (Aadhar Card)</td><td>{fill(student?.aadhaarNo, '150px')}</td></tr>
          <tr><td>3</td><td>Student's Full Name</td><td>{fill(student?.name, '200px')}</td></tr>
          <tr><td>4</td><td>Mother's Name</td><td>{fill(student?.motherName, '150px')}</td></tr>
          <tr><td>5</td><td>Nationality</td><td>{fill(student?.nationality || 'Indian')}</td></tr>
          <tr><td>6</td><td>Caste</td><td>{fill(student?.caste)}</td></tr>
          <tr><td>7</td><td>Birth place(Village/City)</td><td>{fill(student?.birthPlace, '200px')}</td></tr>
          <tr><td>8</td><td>Date of Birth</td><td>{fill(studentDobFormatted)}</td></tr>
          <tr><td>9</td><td>Date of Birth(In Words)</td><td>{fill(studentDobInWords, '250px')}</td></tr>
          <tr><td>10</td><td>Previous School Name</td><td>{fill(formData.previousSchool, '150px')}</td></tr>
          <tr><td>11</td><td>Date of Admission</td><td>{fill(dateOfAdmission)} std {fill(formData.standardAdmitted)}</td></tr>
          <tr><td>12</td><td>Progress of Study</td><td>{fill(formData.progress)} Conduct : {fill(formData.conduct)}</td></tr>
          <tr><td>13</td><td>Date of School Leaving</td><td>{fill(dateOfLeaving)}</td></tr>
          <tr><td>14</td><td>Standard in which studying and since when(In Words)</td><td>{fill(formData.standardLeaving)} {fill(standardLeavingWords)} {fill(formData.sinceWhenLeaving)}</td></tr>
          <tr><td>15</td><td>Reason for leaving School</td><td>{fill(formData.reasonForLeaving, '200px')}</td></tr>
          <tr><td>16</td><td>Remarks</td><td>{fill(formData.remarks, '200px')}</td></tr>
        </tbody>
      </table>

      {/* Certification Text */}
      <p className={styles.certText}>
        This is certify that, Above mentioned information is as per School General Register.
      </p>

      {/* Footer */}
      <footer className={styles.certFooter}>
        <div className={styles.datePlace}>
          <p>Date : {fill(issueDate, '100px')}</p>
          <p>Place : {fill(schoolDetails.place, '100px')}</p>
        </div>
        <div className={styles.signatures}>
          <div className={styles.sigBox}>
            <span>Class Teacher</span>
          </div>
          <div className={styles.sealArea}>
            ( School Seal )
          </div>
          <div className={styles.sigBox}>
            <span>{formData.signatoryRole || 'Head Master'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LeavingCertificatePreview;
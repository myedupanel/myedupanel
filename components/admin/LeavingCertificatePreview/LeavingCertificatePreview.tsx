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
  birthPlace?: string; // Place/City
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
    return `${day} - ${month} - ${year}`; // Format changed to match image
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
      return <span className={isBold ? styles.fill : styles.fillNormal} style={{ minWidth: minWidth }}>{value}</span>;
    }
    return <span className={styles.fillBlank} style={{ minWidth }}>&nbsp;</span>;
  }
  
  const dateOfAdmission = formatDate(formData.dateOfAdmission);
  const dateOfLeaving = formatDate(formData.dateOfLeaving);
  const studentDobFormatted = formatDate(student?.dob);
  const issueDateFormatted = formatDate(formData.issueDate);

  // Consolidated Birth Place String
  const birthPlaceDetails = [
    formData.birthPlace,
    formData.birthTaluka ? `Tal: ${formData.birthTaluka}` : null,
    formData.birthDistrict ? `Dist: ${formData.birthDistrict}` : null,
    formData.birthState ? `State: ${formData.birthState}` : null
  ].filter(Boolean).join(', ');
  
  // Use a generic placeholder for the original Marathi Header text
  const schoolMandalText = "SHREE CHHATRAPATI SHIKSHAN PRASARAK MANDAL";

  return (
    <div className={styles.certificatePaper}>
      <div className={styles.outerBorder}>
        
        {/* --- Header (Matches Marathi Image) --- */}
        <header className={styles.certHeader}>
            <div className={styles.schoolMandalText}>{schoolMandalText}</div>
            
            <div className={styles.schoolMainTitle}>
                <div className={styles.schoolName}>{schoolDetails.name || "SCHOOL NAME HERE"}</div>
                <div className={styles.schoolAddress}>{schoolDetails.address || "Address Here"}</div>
            </div>
            
            <div className={styles.certTitleBlock}>
                <div className={styles.registerNo}>Register No: {fill(schoolDetails.genRegNo || '1889', '80px', false)}</div>
                <div className={styles.issueNo}>Dispatch No: {fill(formData.regNo || '2435', '80px', false)}</div>
                <h2 className={styles.mainTitle}>LEAVING CERTIFICATE</h2>
                <div className={styles.subtitle}>(Original Copy)</div>
            </div>
            
            <div className={styles.headerLine}></div>
        </header>

        {/* --- Student Information Fields --- */}
        <div className={styles.infoGrid}>
            <div className={styles.infoLeft}>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>1.</span>
                    <span className={styles.label}>Student ID</span>
                    <span className={styles.dataDigits}>{fill(student?.studentId || '20015272006604070497', '300px', false)}</span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>2.</span>
                    <span className={styles.label}>Aadhaar No.</span>
                    <span className={styles.dataDigits}>{fill(student?.aadhaarNo || '476425789231', '300px', false)}</span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>3.</span>
                    <span className={styles.label}>Full Name of Student</span>
                    <span className={styles.dataValue}>{fill(student?.name, '200px')}</span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>4.</span>
                    <span className={styles.label}>Mother's Name</span>
                    <span className={styles.dataValue}>{fill(formData.motherName, '200px')}</span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>5.</span>
                    <span className={styles.label}>Mother Tongue</span>
                    <span className={styles.dataValue}>{fill(formData.motherTongue, '200px')}</span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>6.</span>
                    <span className={styles.label}>Religion and Caste</span>
                    <span className={styles.dataValue}>
                      {fill(formData.religion || 'Muslim - Fakir', '120px')}
                    </span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>7.</span>
                    <span className={styles.label}>Birth Place</span>
                    <span className={styles.dataValue}>{fill(birthPlaceDetails, '200px')}</span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>8.</span>
                    <span className={styles.label}>Date of Birth (Figures & Words)</span>
                    <span className={styles.dataDigits}>{fill(studentDobFormatted || '05-09-2008', '120px', false)}</span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>9.</span>
                    <span className={styles.label}>Previous School Name (if applicable)</span>
                    <span className={styles.dataValue}>{fill(formData.previousSchool, '200px')}</span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>10.</span>
                    <span className={styles.label}>Date of Admission & Standard</span>
                    <span className={styles.dataValue}>
                       {fill(dateOfAdmission, '120px')}
                       <span style={{marginLeft: '10px'}}>Std:</span>
                       {fill(formData.standardAdmitted || '5th', '50px')}
                    </span>
                </div>
            </div>
            
            <div className={styles.infoRight}>
                {/* Right column fields (as per image, these are secondary) */}
                 <div className={styles.rightField}>
                    <span className={styles.rightLabel}>Nationality:</span>
                    {fill(formData.nationality || 'Indian', '100px')}
                 </div>
            </div>
        </div>

        {/* --- Academic & Leaving Details --- */}
        <div className={styles.infoGrid} style={{marginTop: '15px'}}>
            <div className={styles.infoLeft}>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>11.</span>
                    <span className={styles.label}>Progress of Study</span>
                    <span className={styles.dataValue}>{fill(formData.progress || 'Good', '100px')}</span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>12.</span>
                    <span className={styles.label}>Conduct in School</span>
                    <span className={styles.dataValue}>{fill(formData.conduct || 'Good', '100px')}</span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.srNo}>13.</span>
                    <span className={styles.label}>Date of School Leaving</span>
                    <span className={styles.dataDigits}>{fill(dateOfLeaving, '120px', false)}</span>
                </div>
                 <div className={styles.fieldRow}>
                    <span className={styles.srNo}>14.</span>
                    <span className={styles.label}>Standard Leaving & Since When</span>
                    <span className={styles.dataValue}>
                      {fill(formData.standardLeaving || '10th', '50px')}
                      <span style={{marginLeft: '10px'}}>/</span>
                      {fill(formData.sinceWhenLeaving || 'June 2024 Onwards', '150px')}
                    </span>
                </div>
                 <div className={styles.fieldRow}>
                    <span className={styles.srNo}>15.</span>
                    <span className={styles.label}>Reason for Leaving School</span>
                    <span className={styles.dataValue}>{fill(formData.reasonForLeaving || 'S.S.C. Exam Passed', '250px')}</span>
                </div>
                 <div className={styles.fieldRow}>
                    <span className={styles.srNo}>16.</span>
                    <span className={styles.label}>Remarks</span>
                    <span className={styles.dataValue}>{fill(formData.remarks || 'None', '250px')}</span>
                </div>
            </div>
        </div>


        {/* --- Footer --- */}
        <footer className={styles.certFooterWrapper}>
            <div className={styles.certNote}>
                This certificate confirms that the above information matches the School Register No. {fill(schoolDetails.genRegNo || '1889', '80px', false)}.
            </div>

            <div className={styles.signatureBlock}>
                <div className={styles.dateInfo}>
                   Date: {fill(issueDateFormatted || '26-05-2025', '120px', false)}
                </div>
                <div className={styles.signatures}>
                    <div className={styles.sigBox}>
                        <span>(Class Teacher)</span>
                    </div>
                    <div className={styles.sigBox}>
                        <span>(Clerk)</span>
                    </div>
                    <div className={styles.sigBox}>
                        <span>(Head Master)</span>
                    </div>
                </div>
            </div>
        </footer>
        
      </div> {/* End outerBorder */}
    </div>
  );
};

export default LeavingCertificatePreview;
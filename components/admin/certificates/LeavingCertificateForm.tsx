// File: LeavingCertificateForm.tsx (UPDATED for Data Consistency)

import React from 'react';
import styles from './LeavingCertificate.module.scss';

// --- Interfaces (UPDATED: subCaste added, aadhar field renamed) ---
export interface LeavingFormData {
  genRegNo?: string;
  regNo?: string;
  studentName?: string; // NEW: To display for reference if needed
  motherName?: string; // NEW: To display for reference if needed
  aadhaarNo?: string; // Renamed for consistency
  nationality?: string;
  motherTongue?: string;
  religion?: string;
  caste?: string;
  subCaste?: string; // Added for the fixed layout
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
}

interface LeavingCertificateFormProps {
  formData: LeavingFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeavingFormData>>;
  // Note: In a real app, 'student' object would be passed here for reference/initial mapping.
}

const LeavingCertificateForm: React.FC<LeavingCertificateFormProps> = ({
  formData,
  setFormData
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form className={styles.form}>
      
      <h2>Student Data (Auto-Fetched & Editable)</h2>
      
      {/* Student Profile Data (Assuming pre-filled from selected student) */}
      <div className={styles.formGroup}>
        <label htmlFor="studentName">Full Name (From Student Profile)</label>
        <input type="text" id="studentName" name="studentName" value={formData.studentName || ''} onChange={handleChange} disabled />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="motherName">Mother's Name (From Student Profile)</label>
        <input type="text" id="motherName" name="motherName" value={formData.motherName || ''} onChange={handleChange} disabled />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="aadhaarNo">UID Adhar Card No. (From Student Profile)</label>
        <input type="text" id="aadhaarNo" name="aadhaarNo" value={formData.aadhaarNo || ''} onChange={handleChange} />
      </div>
      
      <hr/>
      <h2>Certificate Fields (Manual / Overrides)</h2>
      
      <div className={styles.formGroup}>
        <label htmlFor="genRegNo">Serial No. (Header - School Profile)</label>
        <input type="text" id="genRegNo" name="genRegNo" value={formData.genRegNo || ''} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="regNo">G. R. No. (Header - School Profile)</label>
        <input type="text" id="regNo" name="regNo" value={formData.regNo || ''} onChange={handleChange} />
      </div>
      
      <fieldset className={styles.fieldGroup}>
        <legend>Religion, Caste & Nationality</legend>
        <div className={styles.formGroup}>
          <label htmlFor="nationality">Nationality</label>
          <input type="text" id="nationality" name="nationality" value={formData.nationality || 'Indian'} onChange={handleChange} />
        </div>
         <div className={styles.formGroup}>
          <label htmlFor="religion">Religion</label>
          <input type="text" id="religion" name="religion" value={formData.religion || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="caste">Caste</label>
          <input type="text" id="caste" name="caste" value={formData.caste || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="subCaste">Sub Caste</label>
          <input type="text" id="subCaste" name="subCaste" value={formData.subCaste || ''} onChange={handleChange} />
        </div>
      </fieldset>

      {/* Birth Place & Other Fields follow... (Rest of the form logic) */}
      
      <fieldset className={styles.fieldGroup}>
        <legend>Birth Place Details</legend>
        <div className={styles.formGroup}>
          <label htmlFor="birthPlace">Birth Place (Village/City)</label>
          <input type="text" id="birthPlace" name="birthPlace" value={formData.birthPlace || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="birthTaluka">Taluka</label>
          <input type="text" id="birthTaluka" name="birthTaluka" value={formData.birthTaluka || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="birthDistrict">District</label>
          <input type="text" id="birthDistrict" name="birthDistrict" value={formData.birthDistrict || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="birthState">State</label>
          <input type="text" id="birthState" name="birthState" value={formData.birthState || ''} onChange={handleChange} />
        </div>
      </fieldset>
      
      <div className={styles.formGroup}>
        <label htmlFor="dobWords">Date of Birth (in Words)</label>
        <input type="text" id="dobWords" name="dobWords" value={formData.dobWords || ''} onChange={handleChange} placeholder="e.g., Twenty Fifth March Two Thousand Fourteen" />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="previousSchool">Previous School Name</label>
        <input type="text" id="previousSchool" name="previousSchool" value={formData.previousSchool || ''} onChange={handleChange} />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="dateOfAdmission">Date of Admission</label>
        <input type="date" id="dateOfAdmission" name="dateOfAdmission" value={formData.dateOfAdmission || ''} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="standardAdmitted">Std Admitted To</label>
        <input type="text" id="standardAdmitted" name="standardAdmitted" value={formData.standardAdmitted || ''} onChange={handleChange} placeholder="e.g., 1st" />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="progress">Progress</label>
        <input type="text" id="progress" name="progress" value={formData.progress || ''} onChange={handleChange} placeholder="e.g., Good"/>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="conduct">Conduct</label>
        <input type="text" id="conduct" name="conduct" value={formData.conduct || ''} onChange={handleChange} placeholder="e.g., Good"/>
      </div>

      <div className={styles.formGroup}>
          <label htmlFor="dateOfLeaving">Date of School Leaving</label>
          <input type="date" id="dateOfLeaving" name="dateOfLeaving" value={formData.dateOfLeaving || ''} onChange={handleChange} />
      </div>
       
      <fieldset className={styles.fieldGroup}>
        <legend>Leaving Standard Details</legend>
        <div className={styles.formGroup}>
              <label htmlFor="standardLeaving">Std Leaving</label>
              <input type="text" id="standardLeaving" name="standardLeaving" value={formData.standardLeaving || ''} onChange={handleChange} placeholder="e.g., 5th"/>
          </div>
          <div className={styles.formGroup}>
              <label htmlFor="standardLeavingWords">Std Leaving (Words)</label>
              <input type="text" id="standardLeavingWords" name="standardLeavingWords" value={formData.standardLeavingWords || ''} onChange={handleChange} placeholder="e.g., Fifth"/>
          </div>
            <div className={styles.formGroup}>
              <label htmlFor="sinceWhenLeaving">Since When</label>
              <input type="text" id="sinceWhenLeaving" name="sinceWhenLeaving" value={formData.sinceWhenLeaving || ''} onChange={handleChange} placeholder="e.g., June 2025"/>
          </div>
      </fieldset>

      <div className={styles.formGroup}>
          <label htmlFor="reasonForLeaving">Reason for Leaving</label>
          <textarea id="reasonForLeaving" name="reasonForLeaving" value={formData.reasonForLeaving || ''} onChange={handleChange} rows={2} placeholder="e.g., Parent's Application" />
      </div>
      
      <div className={styles.formGroup}>
          <label htmlFor="remarks">Remarks</label>
          <textarea id="remarks" name="remarks" value={formData.remarks || ''} onChange={handleChange} rows={2} />
      </div>
       
      <div className={styles.formGroup}>
            <label htmlFor="issueDate">Issue Date (Footer)</label>
            <input type="date" id="issueDate" name="issueDate" value={formData.issueDate || ''} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
            <label htmlFor="signatoryRole">Signatory Role (Footer)</label>
            <select id="signatoryRole" name="signatoryRole" value={formData.signatoryRole || 'Head Master'} onChange={handleChange}>
                <option value="Head Master">Head Master</option>
                <option value="Principal">Principal</option>
            </select>
        </div>
    </form>
  );
};

export default LeavingCertificateForm;
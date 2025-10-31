// src/components/admin/certificates/LeavingCertificateForm.tsx
import React from 'react';
// ✅ Import the SCSS file for styling
import styles from './LeavingCertificate.module.scss';

// --- FIX 1: Interface ko image ke hisaab se update kiya ---
export interface LeavingFormData {
  // Fields from image header
  genRegNo?: string;
  regNo?: string;
  
  // Fields from image body
  studentAadharNo?: string; // Point 2
  nationality?: string;     // Point 5
  motherTongue?: string;    // Point 5
  religion?: string;        // Point 5
  caste?: string;           // Point 5
  birthPlace?: string;      // Point 6
  birthTaluka?: string;     // Point 6
  birthDistrict?: string;   // Point 6
  birthState?: string;      // Point 6
  dobWords?: string;        // Point 8

  // Aapke existing fields (Points 9-16 & Footer)
  previousSchool?: string;    // Point 9
  dateOfAdmission?: string;   // Point 10
  standardAdmitted?: string;  // Point 10
  progress?: string;          // Point 11
  conduct?: string;           // Point 12
  dateOfLeaving?: string;     // Point 13
  standardLeaving?: string;   // Point 14
  standardLeavingWords?: string; // Point 14
  sinceWhenLeaving?: string;  // Point 14
  reasonForLeaving?: string;  // Point 15
  remarks?: string;           // Point 16
  issueDate?: string;         // Footer
  signatoryRole?: string;     // Footer
}
// --- END FIX ---

interface LeavingCertificateFormProps {
  formData: LeavingFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeavingFormData>>;
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
    // ✅ Use the SCSS module class names
    <form className={styles.form}>
    
      {/* --- FIX 2: Naye fields add kiye (Header & Points 2-8) --- */}
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="genRegNo">General Register No. (Header)</label>
          <input type="text" id="genRegNo" name="genRegNo" value={formData.genRegNo || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="regNo">Reg. No. (Header)</label>
          <input type="text" id="regNo" name="regNo" value={formData.regNo || ''} onChange={handleChange} />
        </div>
      </div>
      
      {/* Note: Points 1 (Student Id), 3 (Name), 4 (Mother's Name), 7 (DOB Fig) 
          student ke main data se aayenge, isliye form mein nahi pooche. */}

      <div className={styles.formGroup}>
        <label htmlFor="studentAadharNo">U/D No. (Aadhar card No.) (Point 2)</label>
        <input type="text" id="studentAadharNo" name="studentAadharNo" value={formData.studentAadharNo || ''} onChange={handleChange} />
      </div>

      <div className={styles.formGrid4}> {/* 4-column grid for Point 5 */}
        <div className={styles.formGroup}>
          <label htmlFor="nationality">Nationality (Point 5)</label>
          <input type="text" id="nationality" name="nationality" value={formData.nationality || 'Indian'} onChange={handleChange} />
        </div>
         <div className={styles.formGroup}>
          <label htmlFor="motherTongue">Mother-Tongue (Point 5)</label>
          <input type="text" id="motherTongue" name="motherTongue" value={formData.motherTongue || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="religion">Religion (Point 5)</label>
          <input type="text" id="religion" name="religion" value={formData.religion || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="caste">Caste (Point 5)</label>
          <input type="text" id="caste" name="caste" value={formData.caste || ''} onChange={handleChange} />
        </div>
      </div>

      <div className={styles.formGrid4}> {/* 4-column grid for Point 6 */}
        <div className={styles.formGroup}>
          <label htmlFor="birthPlace">Birth Place (Village/City) (Point 6)</label>
          <input type="text" id="birthPlace" name="birthPlace" value={formData.birthPlace || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="birthTaluka">Taluka (Point 6)</label>
          <input type="text" id="birthTaluka" name="birthTaluka" value={formData.birthTaluka || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="birthDistrict">District (Point 6)</label>
          <input type="text" id="birthDistrict" name="birthDistrict" value={formData.birthDistrict || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="birthState">State (Point 6)</label>
          <input type="text" id="birthState" name="birthState" value={formData.birthState || ''} onChange={handleChange} />
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="dobWords">Date of Birth (in Words) (Point 8)</label>
        <input type="text" id="dobWords" name="dobWords" value={formData.dobWords || ''} onChange={handleChange} placeholder="e.g., Twenty Fifth March Two Thousand Fourteen" />
      </div>
      {/* --- END Naye Fields --- */}


      {/* --- FIX 3: Aapke existing fields ke labels update kiye --- */}
      <div className={styles.formGroup}>
        <label htmlFor="previousSchool">Previous School Name (Point 9)</label>
        <input type="text" id="previousSchool" name="previousSchool" value={formData.previousSchool || ''} onChange={handleChange} />
      </div>
      <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="dateOfAdmission">Date of Admission (Point 10)</label>
            <input type="date" id="dateOfAdmission" name="dateOfAdmission" value={formData.dateOfAdmission || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="standardAdmitted">Std Admitted To (Point 10)</label>
            <input type="text" id="standardAdmitted" name="standardAdmitted" value={formData.standardAdmitted || ''} onChange={handleChange} placeholder="e.g., 1st" />
          </div>
      </div>
       <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="progress">Progress (Point 11)</label>
            <input type="text" id="progress" name="progress" value={formData.progress || ''} onChange={handleChange} placeholder="e.g., Good"/>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="conduct">Conduct (Point 12)</label>
            <input type="text" id="conduct" name="conduct" value={formData.conduct || ''} onChange={handleChange} placeholder="e.g., Good"/>
          </div>
       </div>
        <div className={styles.formGroup}>
            <label htmlFor="dateOfLeaving">Date of School Leaving (Point 13)</label>
            <input type="date" id="dateOfLeaving" name="dateOfLeaving" value={formData.dateOfLeaving || ''} onChange={handleChange} />
        </div>
       <div className={styles.formGrid3}> {/* Renamed to formGrid3 */}
           <div className={styles.formGroup}>
                <label htmlFor="standardLeaving">Std Leaving (Point 14)</label>
                <input type="text" id="standardLeaving" name="standardLeaving" value={formData.standardLeaving || ''} onChange={handleChange} placeholder="e.g., 5th"/>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="standardLeavingWords">Std Leaving (Words) (Point 14)</label>
                <input type="text" id="standardLeavingWords" name="standardLeavingWords" value={formData.standardLeavingWords || ''} onChange={handleChange} placeholder="e.g., Fifth"/>
            </div>
             <div className={styles.formGroup}>
                <label htmlFor="sinceWhenLeaving">Since When (Point 14)</label>
                <input type="text" id="sinceWhenLeaving" name="sinceWhenLeaving" value={formData.sinceWhenLeaving || ''} onChange={handleChange} placeholder="e.g., June 2025"/>
            </div>
       </div>
       <div className={styles.formGroup}>
            <label htmlFor="reasonForLeaving">Reason for Leaving (Point 15)</label>
            <textarea id="reasonForLeaving" name="reasonForLeaving" value={formData.reasonForLeaving || ''} onChange={handleChange} rows={2} placeholder="e.g., Parent's Application" />
       </div>
        <div className={styles.formGroup}>
            <label htmlFor="remarks">Remarks (Point 16)</label>
            <textarea id="remarks" name="remarks" value={formData.remarks || ''} onChange={handleChange} rows={2} />
       </div>
       <div className={styles.formGrid}> {/* Use grid for last 2 items */}
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
        </div>
       {/* --- END FIX --- */}
    </form>
  );
};

export default LeavingCertificateForm;
import React from 'react';
import styles from './LeavingCertificate.module.scss'; // SCSS file wahi rahegi

// Interface waisa hi hai, perfect.
export interface LeavingFormData {
  genRegNo?: string;
  regNo?: string;
  studentAadharNo?: string;
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
}

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
    <form className={styles.form}>
      
      {/* --- FIX: formGrid wrapper hata diya --- */}
      <div className={styles.formGroup}>
        <label htmlFor="genRegNo">General Register No. (Header)</label>
        <input type="text" id="genRegNo" name="genRegNo" value={formData.genRegNo || ''} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="regNo">Reg. No. (Header)</label>
        <input type="text" id="regNo" name="regNo" value={formData.regNo || ''} onChange={handleChange} />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="studentAadharNo">U/D No. (Aadhar card No.) (Point 2)</label>
        <input type="text" id="studentAadharNo" name="studentAadharNo" value={formData.studentAadharNo || ''} onChange={handleChange} />
      </div>

      {/* --- FIX: formGrid4 ko fieldset se replace kiya --- */}
      <fieldset className={styles.fieldGroup}>
        <legend>Point 5 Details</legend>
        <div className={styles.formGroup}>
          <label htmlFor="nationality">Nationality</label>
          <input type="text" id="nationality" name="nationality" value={formData.nationality || 'Indian'} onChange={handleChange} />
        </div>
         <div className={styles.formGroup}>
          <label htmlFor="motherTongue">Mother-Tongue</label>
          <input type="text" id="motherTongue" name="motherTongue" value={formData.motherTongue || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="religion">Religion</label>
          <input type="text" id="religion" name="religion" value={formData.religion || ''} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="caste">Caste</label>
          <input type="text" id="caste" name="caste" value={formData.caste || ''} onChange={handleChange} />
        </div>
      </fieldset>

      {/* --- FIX: formGrid4 ko fieldset se replace kiya --- */}
      <fieldset className={styles.fieldGroup}>
        <legend>Point 6 Details (Birth Place)</legend>
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
        <label htmlFor="dobWords">Date of Birth (in Words) (Point 8)</label>
        <input type="text" id="dobWords" name="dobWords" value={formData.dobWords || ''} onChange={handleChange} placeholder="e.g., Twenty Fifth March Two Thousand Fourteen" />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="previousSchool">Previous School Name (Point 9)</label>
        <input type="text" id="previousSchool" name="previousSchool" value={formData.previousSchool || ''} onChange={handleChange} />
      </div>

      {/* --- FIX: formGrid wrapper hata diya --- */}
      <div className={styles.formGroup}>
        <label htmlFor="dateOfAdmission">Date of Admission (Point 10)</label>
        <input type="date" id="dateOfAdmission" name="dateOfAdmission" value={formData.dateOfAdmission || ''} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="standardAdmitted">Std Admitted To (Point 10)</label>
        <input type="text" id="standardAdmitted" name="standardAdmitted" value={formData.standardAdmitted || ''} onChange={handleChange} placeholder="e.g., 1st" />
      </div>
      
      {/* --- FIX: formGrid wrapper hata diya --- */}
      <div className={styles.formGroup}>
        <label htmlFor="progress">Progress (Point 11)</label>
        <input type="text" id="progress" name="progress" value={formData.progress || ''} onChange={handleChange} placeholder="e.g., Good"/>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="conduct">Conduct (Point 12)</label>
        <input type="text" id="conduct" name="conduct" value={formData.conduct || ''} onChange={handleChange} placeholder="e.g., Good"/>
      </div>

      <div className={styles.formGroup}>
          <label htmlFor="dateOfLeaving">Date of School Leaving (Point 13)</label>
          <input type="date" id="dateOfLeaving" name="dateOfLeaving" value={formData.dateOfLeaving || ''} onChange={handleChange} />
      </div>
       
      {/* --- FIX: formGrid3 ko fieldset se replace kiya --- */}
      <fieldset className={styles.fieldGroup}>
        <legend>Point 14 Details (Leaving Standard)</legend>
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
          <label htmlFor="reasonForLeaving">Reason for Leaving (Point 15)</label>
          <textarea id="reasonForLeaving" name="reasonForLeaving" value={formData.reasonForLeaving || ''} onChange={handleChange} rows={2} placeholder="e.g., Parent's Application" />
      </div>
      
      <div className={styles.formGroup}>
          <label htmlFor="remarks">Remarks (Point 16)</label>
          <textarea id="remarks" name="remarks" value={formData.remarks || ''} onChange={handleChange} rows={2} />
      </div>
       
      {/* --- FIX: formGrid wrapper hata diya --- */}
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
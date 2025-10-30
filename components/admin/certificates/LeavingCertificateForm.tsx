// src/components/admin/certificates/LeavingCertificateForm.tsx
import React from 'react';
// ✅ Import the SCSS file for styling
import styles from './LeavingCertificate.module.scss';

// Define interfaces locally or import them
export interface LeavingFormData {
  previousSchool?: string; dateOfAdmission?: string; standardAdmitted?: string;
  progress?: string; conduct?: string; dateOfLeaving?: string;
  standardLeaving?: string; standardLeavingWords?: string; sinceWhenLeaving?: string;
  reasonForLeaving?: string; remarks?: string; issueDate?: string;
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
    // ✅ Use the SCSS module class names
    <form className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="previousSchool">Previous School Name (Point 10)</label>
        <input type="text" id="previousSchool" name="previousSchool" value={formData.previousSchool || ''} onChange={handleChange} />
      </div>
      <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="dateOfAdmission">Date of Admission (Point 11)</label>
            <input type="date" id="dateOfAdmission" name="dateOfAdmission" value={formData.dateOfAdmission || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="standardAdmitted">Std Admitted To (Point 11)</label>
            <input type="text" id="standardAdmitted" name="standardAdmitted" value={formData.standardAdmitted || ''} onChange={handleChange} placeholder="e.g., 1st" />
          </div>
      </div>
       <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="progress">Progress (Point 12)</label>
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
       <div className={styles.formGrid}> {/* Made 3 columns for Point 14 */}
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
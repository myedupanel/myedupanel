"use client";
import React from 'react';
import styles from './LeavingCertificatePreview.module.scss';

// ✨ FIX: Define an interface for the form data
interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string; // You could use string or Date
  placeOfBirth: string;
  nationality: string;
  lastSchoolAttended: string;
  joiningDate: string; // You could use string or Date
  leavingDate: string; // You could use string or Date
  joiningGrade: string;
  progress: string;
  conduct: string;
  promotionStatus: string;
  reasonForLeaving: string;
  generalRemark: string;
  certificateDate: string; // You could use string or Date
}

// ✨ FIX: Define an interface for school details
interface SchoolDetails {
  name?: string;     // The '?' makes this property optional
  address?: string;  // The '?' makes this property optional
}

// ✨ FIX: Define an interface for the component's props
interface Props {
  student: any; // 'any' is fine here since you only check if it exists
  formData: FormData;
  schoolDetails: SchoolDetails;
}

// ✨ FIX (Applied): Use the Props interface here
const LeavingCertificatePreview = ({ student, formData, schoolDetails }: Props) => {
  if (!student) {
    return <div className={styles.placeholder}>Select a student to see a preview</div>;
  }

  return (
    <div className={styles.certificateWrapper}>
      <header className={styles.letterhead}>
        {/* These optional checks (?.) are great! */}
        <h1>{schoolDetails?.name || "School Name"}</h1>
        <p>{schoolDetails?.address || "School Address"}</p>
      </header>

      <h2 className={styles.title}>LEAVING CERTIFICATE</h2>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.label}>Student's Name:</span>
          <span>{`${formData.firstName} ${formData.middleName} ${formData.lastName}`}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Date of Birth:</span>
          <span>{formData.birthDate}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Place of Birth:</span>
          <span>{formData.placeOfBirth}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Nationality:</span>
          <span>{formData.nationality}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Last School Attended:</span>
          <span>{formData.lastSchoolAttended}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Date of Joining:</span>
          <span>{formData.joiningDate}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Date of Leaving:</span>
          <span>{formData.leavingDate}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Joining Grade:</span>
          <span>{formData.joiningGrade}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Progress:</span>
          <span>{formData.progress}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Conduct:</span>
          <span>{formData.conduct}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Promotion Status:</span>
          <span>{formData.promotionStatus}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Reason for Leaving:</span>
          <span>{formData.reasonForLeaving}</span>
        </div>
      </div>

      <div className={styles.remarks}>
        <p><strong>Remarks:</strong> {formData.generalRemark}</p>
      </div>

      <div className={styles.footer}>
        <div className={styles.date}>
          <strong>Date:</strong> {formData.certificateDate}
        </div>
        <div className={styles.signature}>
          <p>___________________</p>
          <p>Signature of Principal</p>
        </div>
      </div>
    </div>
  );
};

export default LeavingCertificatePreview;
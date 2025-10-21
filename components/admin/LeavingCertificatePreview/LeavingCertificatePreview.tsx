"use client";
import React from 'react';
import styles from './LeavingCertificatePreview.module.scss';

const LeavingCertificatePreview = ({ student, formData, schoolDetails }) => {
  if (!student) {
    return <div className={styles.placeholder}>Select a student to see a preview</div>;
  }

  return (
    <div className={styles.certificateWrapper}>
      <header className={styles.letterhead}>
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
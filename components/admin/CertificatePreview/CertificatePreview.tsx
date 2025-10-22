"use client";
import React from 'react';
import styles from './CertificatePreview.module.scss';

// FIX 1: Define interfaces for the props
interface Student {
  name?: string;
  class?: string;
  parentName?: string;
  rollNo?: string;
  dob?: string;
  caste?: string;
  aadhaar?: string;
  // Add any other student properties used
}

interface FormData {
  noSchoolHeader: boolean;
  paragraphText: string;
  includeCaste: boolean;
  includeAadhaar: boolean;
  includeCharacter: boolean;
  characterText: string;
  includeReason: boolean;
  reasonText: string;
  principalRole?: string; // Made optional as it has a fallback
  // Add any other formData properties used
}

interface SchoolDetails {
  name: string;
  address: string;
  code?: string; // Made optional as it has a fallback
}

// FIX 2: Define the props interface for the component itself
interface CertificatePreviewProps {
  student: Student | null;
  formData: FormData;
  schoolDetails: SchoolDetails;
}

// FIX 3: Apply the props interface to the component
const CertificatePreview = ({ student, formData, schoolDetails }: CertificatePreviewProps) => {
  if (!student) {
    return <div className={styles.placeholder}>Select a student to see a preview</div>;
  }

  // FIX 4: Add type 'string' to the 'text' parameter
  const parseParagraph = (text: string) => {
    const academicYear = `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(2)}`;
    // Using optional chaining (?.) and nullish coalescing (??) for safety
    return text
      .replace(/__studentName__/g, student?.name ?? '[Student Name]')
      .replace(/__class__/g, student?.class ?? '[Class]')
      .replace(/__parentName__/g, student?.parentName ?? '[Parent Name]')
      .replace(/__academicYear__/g, academicYear);
  };
  
  return (
    <div className={styles.certificateWrapper}>
      {/* 1. School Letterhead */}
      {!formData.noSchoolHeader && (
        <header className={styles.letterhead}>
          <div className={styles.logoPlaceholder}>(School Logo)</div>
          <h1>{schoolDetails.name}</h1>
          <p>{schoolDetails.address}</p>
        </header>
      )}

      {/* 2. Certificate Title */}
      <h2 className={styles.title}>BONAFIDE CERTIFICATE</h2>

      {/* 3. Date and Reference Number */}
      <div className={styles.headerInfo}>
        <span>Ref No: {schoolDetails?.code ?? 'SIS'}/{new Date().getFullYear()}/{student?.rollNo ?? '...'}</span>
        <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
      </div>

      {/* 4. Main Body */}
      <div className={styles.body}>
        <p className={styles.salutation}>To Whomsoever It May Concern,</p>
        <p className={styles.mainText}>
          {parseParagraph(formData.paragraphText)}
        </p>
      </div>

      {/* 5. Additional Details */}
      <ul className={styles.detailsList}>
        <li><strong>Date of Birth:</strong> {student?.dob ?? 'Not Available'}</li>
        {formData.includeCaste && <li><strong>Caste:</strong> {student?.caste ?? 'Not Available'}</li>}
        {formData.includeAadhaar && <li><strong>Aadhaar No:</strong> {student?.aadhaar ?? 'Not Available'}</li>}
        {formData.includeCharacter && <li><strong>Character:</strong> {formData.characterText}</li>}
        {formData.includeReason && <li className={styles.reason}><strong>Reason:</strong> {formData.reasonText}</li>}
      </ul>

      <p className={styles.wishes}>We wish him/her all the best for their future endeavors.</p>

      {/* 6. Signature Area */}
      <div className={styles.signatureArea}>
        <div className={styles.signatureBlock}>
          <p>___________________</p>
          <p>{formData?.principalRole ?? '[Principal/Headmaster]'}</p>
          <p>{schoolDetails.name}</p>
        </div>
        <div className={styles.stampPlaceholder}>
          (School Seal / Stamp Here)
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
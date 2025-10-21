"use client";
import React from 'react';
import styles from './BonafideForm.module.scss';

const BonafideForm = ({ student, formData, setFormData }) => {

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form className={styles.form}>
      {/* Basic Student Info Display */}
      <div className={styles.studentInfo}>
        <p><strong>Student:</strong> {student.name}</p>
        <p><strong>Class:</strong> {student.class}</p>
        <p><strong>Roll No:</strong> {student.rollNo}</p>
      </div>

      <hr className={styles.divider} />

      {/* Checkbox Options */}
      <div className={styles.checkboxOption}>
        <input type="checkbox" id="includeCaste" name="includeCaste" checked={formData.includeCaste} onChange={handleCheckboxChange} />
        <label htmlFor="includeCaste">Caste of child</label>
      </div>
      <div className={styles.checkboxOption}>
        <input type="checkbox" id="includeAadhaar" name="includeAadhaar" checked={formData.includeAadhaar} onChange={handleCheckboxChange} />
        <label htmlFor="includeAadhaar">Aadhaar number of child</label>
      </div>
      <div className={styles.checkboxOption}>
        <input type="checkbox" id="includeUdise" name="includeUdise" checked={formData.includeUdise} onChange={handleCheckboxChange} />
        <label htmlFor="includeUdise">Udise / Government Reg. No of child</label>
      </div>
      <div className={styles.checkboxOption}>
        <input type="checkbox" id="noSchoolHeader" name="noSchoolHeader" checked={formData.noSchoolHeader} onChange={handleCheckboxChange} />
        <label htmlFor="noSchoolHeader">Do Not Need School Header</label>
      </div>
      
      <hr className={styles.divider} />

      {/* Options with Text Inputs */}
      <div className={styles.formGroup}>
        <div className={styles.checkboxWithInput}>
          <input type="checkbox" id="includeCharacter" name="includeCharacter" checked={formData.includeCharacter} onChange={handleCheckboxChange} />
          <label htmlFor="includeCharacter">Character of child</label>
        </div>
        <input
          type="text"
          name="characterText"
          value={formData.characterText}
          onChange={handleInputChange}
          className={styles.inlineInput}
          disabled={!formData.includeCharacter}
        />
      </div>

      <div className={styles.formGroup}>
        <div className={styles.checkboxWithInput}>
          <input type="checkbox" id="includeSchoolRecInfo" name="includeSchoolRecInfo" checked={formData.includeSchoolRecInfo} onChange={handleCheckboxChange} />
          <label htmlFor="includeSchoolRecInfo">School recognition information</label>
        </div>
        <input
          type="text"
          name="schoolRecInfoText"
          value={formData.schoolRecInfoText}
          onChange={handleInputChange}
          className={styles.inlineInput}
          placeholder="e.g., Recognized by Govt. of Maharashtra"
          disabled={!formData.includeSchoolRecInfo}
        />
      </div>
      
      <div className={styles.formGroup}>
        <div className={styles.checkboxWithInput}>
          <input type="checkbox" id="includeReason" name="includeReason" checked={formData.includeReason} onChange={handleCheckboxChange} />
          <label htmlFor="includeReason">Specific reason for bonafide</label>
        </div>
        <input
          type="text"
          name="reasonText"
          value={formData.reasonText}
          onChange={handleInputChange}
          className={styles.inlineInput}
          placeholder="e.g., For Bank Account Opening"
          disabled={!formData.includeReason}
        />
      </div>

      <hr className={styles.divider} />

      {/* Paragraph Customization */}
      <div className={styles.formGroup}>
        <label htmlFor="paragraphText">Certificate Body Text</label>
        {/* ===== BADLAV YAHAN HAI ===== */}
        <p className={styles.helpText}>Use placeholders like '__studentName__' or '__class__'</p>
        <textarea
            id="paragraphText"
            name="paragraphText"
            value={formData.paragraphText}
            onChange={handleInputChange}
            className={styles.textarea}
            rows={6}
        ></textarea>
      </div>

      {/* Dropdown Options */}
      <div className={styles.formGroup}>
          <label htmlFor="template">Template Selection</label>
          <select id="template" name="template" value={formData.template} onChange={handleInputChange} className={styles.select}>
              <option value="1">Bonafide Format 1</option>
              <option value="2">Bonafide Format 2</option>
              <option value="3">Bonafide Format 3</option>
          </select>
      </div>

      <div className={styles.formGroup}>
          <label htmlFor="principalRole">Select Principal Role for Signature</label>
          <select id="principalRole" name="principalRole" value={formData.principalRole} onChange={handleInputChange} className={styles.select}>
              <option value="">Select Role</option>
              <option value="Principal">Principal</option>
              <option value="Headmaster">Headmaster</option>
              <option value="Director">Director</option>
          </select>
      </div>
    </form>
  );
};

export default BonafideForm;
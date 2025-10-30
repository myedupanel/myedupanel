"use client";
import React, { useState, useEffect } from 'react';
import styles from './FeeImportForm.module.scss';
import Accordion from '@/components/common/Accordion/Accordion';
import { FiInfo, FiDownload, FiFile, FiUpload } from 'react-icons/fi';
import api from '@/backend/utils/api';
import FeeExportForm from '@/components/admin/FeeExportForm/FeeExportForm';

// ===== FORM FOR OPTION 1 =====
const NewRecordsForm = () => {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [status, setStatus] = useState('notpaid');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await api.get('/fees/templates');
                setTemplates(res.data);
            } catch (error) { console.error("Failed to fetch templates", error); }
            finally { setLoadingTemplates(false); }
        };
        fetchTemplates();
    }, []);
    
    const handleDownloadSample = async () => {
        // This logic is for a different sample sheet, specific to this option
        alert("Downloading sample for new record creation...");
    };

    const handleSubmit = async () => {
        if (!selectedTemplateId) {
            alert('Please select a fee structure.');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = { templateId: selectedTemplateId, status, startDate, endDate };
            // Note: The backend logic for this is currently a placeholder
            const res = await api.post('/fees/import/generate-records', payload);
            alert(res.data.message);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to generate records.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.panelContent}>
            {/* FORM AREA */}
            <div className={styles.formArea}>
                <div className={styles.formGroup}>
                    <label>Select Fee Structure</label>
                    <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} disabled={loadingTemplates}>
                        <option value="">{loadingTemplates ? 'Loading...' : 'Select Template'}</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                 <div className={styles.formGroup}>
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="notpaid">Not Paid</option>
                        <option value="paid">Paid</option>
                    </select>
                </div>
                <div className={styles.dateGroup}>
                    <div className={styles.formGroup}>
                        <label>Start Date</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>End Date</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>
                <button className={styles.submitButton} onClick={handleSubmit} disabled={isSubmitting}>
                    <FiUpload /> {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>
            {/* HELP AREA */}
            <div className={styles.helpArea}>
                <h4><FiInfo /> Help</h4>
                <hr/>
                <ol>
                    <li>Select Fee Structure for importing paid or non-paid data.</li>
                    <li>If uploading paid records, payment date must be in <strong>DD-MM-YYYY</strong> format.</li>
                    <li>Download template sheet without student data. <a href="#" onClick={handleDownloadSample}>Click Here</a></li>
                </ol>
            </div>
        </div>
    );
};


// ===== FORM FOR OPTION 2 =====
const UpdateRecordsForm = () => {
    const [file, setFile] = useState<File | null>(null);
    const [updatePaid, setUpdatePaid] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async () => {
        if (!file) {
            alert('Please select a file to upload.');
            return;
        }
        setIsUploading(true);
        const formData = new FormData();
        formData.append('feeRecordFile', file);
        formData.append('updatePaid', String(updatePaid));

        try {
            const res = await api.post('/fees/import/update-records', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert(res.data.message);
        } catch (error: any) {
            alert(error.response?.data?.message || 'File import failed.');
        } finally {
            setIsUploading(false);
        }
    };
    
    return (
        <div className={styles.panelContent}>
            <div className={styles.formArea}>
                <div className={styles.formGroup}>
                    <label>Select Exported File</label>
                    <label className={styles.fileUploadLabel}>
                        <FiFile />
                        <span>{file ? file.name : 'Choose file...'}</span>
                        <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} accept=".xlsx, .xls, .csv" />
                    </label>
                </div>
                <div className={styles.checkboxGroup}>
                    <input type="checkbox" id="updatePaid" checked={updatePaid} onChange={(e) => setUpdatePaid(e.target.checked)} />
                    <label htmlFor="updatePaid">Update Paid Records</label>
                </div>
                <button className={styles.submitButton} onClick={handleSubmit} disabled={isUploading}>
                    <FiUpload /> {isUploading ? 'Uploading...' : 'Submit'}
                </button>
            </div>
            <div className={styles.helpArea}>
                <h4><FiInfo /> Help</h4><hr/>
                <ol>
                    <li>While using this option, the excel sheet must have 'RecordId'.</li>
                    <li>The format of the import file is as follows:</li>
                </ol>
                <ul className={styles.columnList}>
                    <li><strong>Column 1:</strong> SrNo</li>
                    <li><strong>Column 2:</strong> StudentId</li>
                    <li><strong>Column 3:</strong> First Name</li>
                    <li><strong>Column 4:</strong> Last Name</li>
                    <li><strong>Column 5:</strong> Class</li>
                    <li><strong>Column 6:</strong> Amount</li>
                    <li><strong>Column 7:</strong> Payment Date</li>
                    <li><strong>Column 8:</strong> Record Name</li>
                    <li><strong>Column 9:</strong> Record Id</li>
                    <li><strong>Column 10:</strong> Last Date Or Transaction Date</li>
                    <li><strong>Column 11:</strong> P = Paid/ Unp = Unpaid</li>
                    <li><strong>Column 12:</strong> Transaction Type</li>
                    <li><strong>Column 13:</strong> Bank Name</li>
                    <li><strong>Column 14:</strong> Transaction No</li>
                    <li><strong>Column 15:</strong> Cheque No</li>
                </ul>
            </div>
        </div>
    );
};

// ===== MAIN ACCORDION COMPONENT =====
const FeeImportForm = () => {
    return (
        <Accordion>
            <Accordion.Item title="1. Import Option 1 : Create New Student Fee Records">
                <NewRecordsForm />
            </Accordion.Item>
            <Accordion.Item title="2. Import Option 2 : By Existing Student Fee RecordId">
                <UpdateRecordsForm />
            </Accordion.Item>
            <Accordion.Item title="3. Import Option 3 : Import new fee template and records">
                <p>Yeh feature hum agle step mein banayenge.</p>
            </Accordion.Item>
        </Accordion>
    );
};
const FeeImportExportPage = () => {
  const [activeTab, setActiveTab] = useState('import');

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fee Import / Export</h1>
      </header>
      <div className={styles.tabNav}>
        {/* ... tab buttons ... */}
      </div>
      <div className={styles.tabContent}>
        {activeTab === 'import' && <FeeImportForm />}
        {activeTab === 'export' && (
            // Placeholder ki jagah naya component istemal karein
            <FeeExportForm />
        )}
        {activeTab === 'reports' && (
          <div><h3>Generate Fee Reports</h3><p>Yeh feature hum agle step mein banayenge.</p></div>
        )}
      </div>
    </div>
  );
};

export default FeeImportForm;


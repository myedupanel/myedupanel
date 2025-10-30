"use client";
import React, { useState, useEffect } from 'react';
import styles from './NewRecordsImport.module.scss';
import api from '@/backend/utils/api';
import { FiDownload, FiFile, FiUpload } from 'react-icons/fi';

const NewRecordsImport = () => {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Form states
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [status, setStatus] = useState('notpaid');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await api.get('/fees/templates');
                setTemplates(res.data);
            } catch (error) { console.error("Failed to fetch templates", error); }
            finally { setLoading(false); }
        };
        fetchTemplates();
    }, []);

    const handleDownloadSample = async () => { /* ... iski logic hum pehle bana chuke hain ... */ };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
    const handleImport = () => { /* ... */ };

    return (
        <div className={styles.container}>
            <div className={styles.formGrid}>
                {/* Form Fields */}
                <div className={styles.formFields}>
                    <div className={styles.formGroup}>
                        <label>Select Fee Structure</label>
                        <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} disabled={loading}>
                            <option value="">{loading ? 'Loading...' : 'Select Template'}</option>
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
                    <div className={styles.formGroup}>
                        <label>Upload Filled Sheet</label>
                        <label className={styles.fileUploadLabel}>
                            <FiFile />
                            <span>{selectedFile ? selectedFile.name : 'Choose a file...'}</span>
                            <input type="file" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                        </label>
                    </div>
                    <button className={styles.submitButton} onClick={handleImport}><FiUpload /> Submit</button>
                </div>

                {/* Help Section */}
                <div className={styles.helpSection}>
                    <h4>Help:</h4>
                    <ol>
                        <li>Select Fee Structure for importing paid or non-paid data.</li>
                        <li>If uploading paid records, the payment date in the Excel must be in <strong>DD-MM-YYYY</strong> format.</li>
                        <li>Download a template sheet without student data. <a href="#" onClick={handleDownloadSample}>Click Here</a></li>
                    </ol>
                </div>
            </div>
        </div>
    );
};
export default NewRecordsImport;
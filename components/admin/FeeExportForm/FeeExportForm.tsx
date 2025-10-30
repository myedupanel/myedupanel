"use client";
import React, { useState, useEffect } from 'react';
import styles from './FeeExportForm.module.scss';
import api from '@/backend/utils/api'; // Sahi path ka istemal karein
import { FiDownload, FiRefreshCw } from 'react-icons/fi';

const FeeExportForm = () => {
    // Sabhi filters ke liye ek state object
    const [filters, setFilters] = useState({
        classId: '',
        gradeId: '',
        divisionId: '',
        templateId: '',
        status: '',
        startDate: '',
        endDate: ''
    });
    // Dropdowns ke data ke liye states
    const [classes, setClasses] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const loadDropdownData = async () => {
            try {
                // Sabhi APIs ko ek saath call karein
                const [classRes, templateRes] = await Promise.all([
                    api.get('/classes'),
                    api.get('/fees/templates')
                ]);
                setClasses(classRes.data);
                setTemplates(templateRes.data);
            } catch (error) {
                console.error("Failed to load filter data", error);
            } finally {
                setLoading(false);
            }
        };
        loadDropdownData();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };
    
    const handleReset = () => {
        setFilters({ classId: '', gradeId: '', divisionId: '', templateId: '', status: '', startDate: '', endDate: '' });
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await api.post('/fees/export/detail', filters, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'FeeDetailReport.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            alert('Failed to export report.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* ===== Section 1: Student Group ===== */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}><span className={styles.sectionNumber}>1</span> Select Student Group</h3>
                <div className={styles.filterGrid}>
                    <select name="classId" value={filters.classId} onChange={handleFilterChange} disabled={loading}>
                        <option value="">{loading ? 'Loading...' : 'Select Class'}</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select name="gradeId" value={filters.gradeId} onChange={handleFilterChange} disabled>
                        <option value="">Select Grade</option>
                    </select>
                    <select name="divisionId" value={filters.divisionId} onChange={handleFilterChange} disabled>
                        <option value="">Select Division</option>
                    </select>
                </div>
            </div>

            {/* ===== Section 2: Fee Details ===== */}
            <div className={styles.section}>
                 <h3 className={styles.sectionTitle}><span className={styles.sectionNumber}>2</span> Select Fee Details</h3>
                 <div className={styles.filterGrid}>
                    <select name="templateId" value={filters.templateId} onChange={handleFilterChange} disabled={loading}>
                        <option value="">{loading ? 'Loading...' : 'Select Template'}</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select name="status" value={filters.status} onChange={handleFilterChange}>
                        <option value="">Select Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Late">Late</option>
                    </select>
                 </div>
            </div>

            {/* ===== Section 3: Date Range ===== */}
            <div className={styles.section}>
                 <h3 className={styles.sectionTitle}><span className={styles.sectionNumber}>3</span> Select Date Range Filter</h3>
                 <div className={styles.filterGrid}>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                 </div>
            </div>

            {/* ===== Action Buttons ===== */}
            <div className={styles.actions}>
                <button className={`${styles.actionButton} ${styles.primary}`}>Show Data</button>
                <button className={`${styles.actionButton} ${styles.secondary}`} onClick={handleExport} disabled={isExporting}>
                    <FiDownload /> {isExporting ? 'Exporting...' : 'Detail Excel Report'}
                </button>
                <button className={`${styles.actionButton} ${styles.secondary}`}>Consolidated Excel Report</button>
                <button className={`${styles.actionButton} ${styles.tertiary}`} onClick={handleReset}>
                    <FiRefreshCw /> Reset Filter
                </button>
            </div>
        </div>
    );
};
export default FeeExportForm;
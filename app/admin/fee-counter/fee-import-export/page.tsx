// components/admin/FeeExportForm/FeeExportForm.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import styles from './FeeExportForm.module.scss';
import { FiDownload, FiInfo, FiCalendar } from 'react-icons/fi';
import api from '@/backend/utils/api';
import * as XLSX from 'xlsx';

// --- Interfaces for Data ---
interface SelectOption {
    id: number | string;
    name: string;
}

interface FilterState {
    classId: number | string;
    templateId: number | string;
    status: string; // Paid, Not Paid, Partial
    startDate: string;
    endDate: string;
}

const FeeExportForm = () => {
    const [filters, setFilters] = useState<FilterState>({
        classId: '',
        templateId: '',
        status: 'Paid',
        startDate: '',
        endDate: new Date().toISOString().split('T')[0],
    });

    const [classes, setClasses] = useState<SelectOption[]>([]);
    const [templates, setTemplates] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        try {
            const [classRes, templateRes] = await Promise.all([
                api.get('/api/classes'),
                api.get('/api/fees/templates')
            ]);

            // FIX: Ensure class IDs are consistent (assuming backend sends numeric IDs)
            const classOptions = (classRes.data || []).map((c: any) => ({
                id: c.classid,
                name: c.class_name,
            }));
            
            // FIX: Ensure template IDs are consistent
            const templateOptions = (templateRes.data || []).map((t: any) => ({
                id: t.id,
                name: t.name,
            }));

            setClasses(classOptions);
            setTemplates(templateOptions);

        } catch (err) {
            console.error("Error fetching data for export form:", err);
            setError("Failed to load classes or templates.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Handler for all selects/inputs ---
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: name === 'classId' || name === 'templateId' ? (Number(value) || value) : value,
        }));
    };
    
    // --- Export Logic ---
    const handleExport = async () => {
        setError(null);
        setExporting(true);
        
        // Basic date validation
        if (!filters.startDate || !filters.endDate) {
            setError("Please select both Start and End Dates.");
            setExporting(false);
            return;
        }

        const params = new URLSearchParams(filters as any).toString();
        
        try {
            const res = await api.get(`/fees/export-data?${params}`);
            
            if (res.data && res.data.length > 0) {
                 const worksheet = XLSX.utils.json_to_sheet(res.data);
                 const workbook = XLSX.utils.book_new();
                 XLSX.utils.book_append_sheet(workbook, worksheet, "FeeData");
                 XLSX.writeFile(workbook, `Fee_Records_${filters.startDate}_to_${filters.endDate}.xlsx`);
            } else {
                alert("No data found matching your filters.");
            }

        } catch (err: any) {
             console.error("Export failed:", err);
             setError(err.response?.data?.message || "Export failed. Check console for details.");
        } finally {
            setExporting(false);
        }
    };


    return (
        <div className={styles.exportFormContainer}>
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <FiInfo className={styles.icon} />
                    <h2 className={styles.sectionTitle}>Filter Records for Export</h2>
                </div>
                
                {error && <p className={styles.errorMessage}>{error}</p>}

                <div className={styles.sectionContent}>
                    {/* --- Filter Row 1 (Class Filter) --- */}
                    <div className={styles.filterGroup}>
                        <label htmlFor="classId">Class Filter:</label>
                        <select 
                            name="classId" 
                            id="classId" 
                            value={filters.classId} 
                            onChange={handleFilterChange} 
                            disabled={loading}
                            className={styles.selectInput}
                        >
                            <option value="">{loading ? 'Loading...' : 'All Classes'}</option>
                            {classes.map(c => (
                                <option value={c.id} key={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* --- Filter Row 2 (Fee Structure) --- */}
                    <div className={styles.filterGroup}>
                        <label htmlFor="templateId">Fee Structure:</label>
                        <select 
                            name="templateId" 
                            id="templateId" 
                            value={filters.templateId} 
                            onChange={handleFilterChange} 
                            disabled={loading}
                            className={styles.selectInput}
                        >
                            <option value="">{loading ? 'Loading...' : 'All Templates'}</option>
                            {templates.map(t => (
                                <option value={t.id} key={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* --- Filter Row 3 (Record Status) --- */}
                    <div className={styles.filterGroup}>
                        <label htmlFor="status">Record Status:</label>
                        <select 
                            name="status" 
                            id="status" 
                            value={filters.status} 
                            onChange={handleFilterChange} 
                            disabled={loading}
                            className={styles.selectInput}
                        >
                            <option value="All">All Records</option>
                            <option value="Paid">Only Paid Records (Success/Complete)</option>
                            <option value="Not Paid">Only Not Paid (Demand Created)</option>
                            <option value="Partial">Only Partial Payments</option>
                            <option value="Void">Only Void/Failed Transactions</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- Date Range Section --- */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <FiCalendar className={styles.icon} />
                    <h2 className={styles.sectionTitle}>Date Range</h2>
                </div>
                <div className={`${styles.sectionContent} ${styles.dateContent}`}>
                    
                    <div className={styles.dateGroup}>
                        <label htmlFor="startDate">Start Date:</label>
                        <input 
                            type="date"
                            name="startDate"
                            id="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className={styles.dateInput}
                            required
                        />
                    </div>
                    
                    <div className={styles.dateGroup}>
                        <label htmlFor="endDate">End Date:</label>
                        <input 
                            type="date"
                            name="endDate"
                            id="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className={styles.dateInput}
                            required
                        />
                    </div>
                </div>
            </div>

            {/* --- Action --- */}
            <div className={styles.actions}>
                <button 
                    className={styles.exportButton} 
                    onClick={handleExport}
                    disabled={exporting || loading}
                >
                    <FiDownload /> {exporting ? 'Preparing File...' : 'Export Data to XLSX'}
                </button>
            </div>
        </div>
    );
};

export default FeeExportForm;
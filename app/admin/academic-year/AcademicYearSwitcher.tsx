// src/components/admin/AcademicYearSwitcher/AcademicYearSwitcher.tsx

"use client";

import React, { useState } from 'react';
import { useAcademicYear } from '@/app/context/AcademicYearContext';
import styles from './AcademicYearSwitcher.module.scss';
import { MdCalendarToday, MdSettings } from 'react-icons/md';

const AcademicYearSwitcher: React.FC = () => {
    const { 
        currentYearId, 
        currentYearName, 
        availableYears, 
        loading, 
        switchAcademicYear 
    } = useAcademicYear();

    const [isSwitching, setIsSwitching] = useState(false);
    
    // Dropdown change handle karna
    const handleYearChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newYearId = parseInt(event.target.value);
        if (newYearId === currentYearId) return;

        setIsSwitching(true);
        // By default, hum sirf cookie set kar rahe hain (setAsDefault: false)
        await switchAcademicYear(newYearId, false); 
        setIsSwitching(false);
    };

    return (
        <div className={styles.switcherContainer}>
            <MdCalendarToday size={20} className={styles.icon} />
            
            {loading ? (
                <span className={styles.loadingText}>Loading Years...</span>
            ) : (
                <select
                    className={styles.yearSelect}
                    value={currentYearId || ''}
                    onChange={handleYearChange}
                    disabled={isSwitching || loading}
                >
                    {availableYears.length === 0 ? (
                         <option>No Years Found</option>
                    ) : (
                         availableYears.map((year) => (
                            <option key={year.id} value={year.id}>
                                {year.yearName} {year.isCurrent && '(Default)'}
                            </option>
                        ))
                    )}
                </select>
            )}

            <button 
                className={styles.settingsButton} 
                title="Manage Academic Years"
                onClick={() => alert("Redirect to Academic Year Management Page (Not Implemented Yet)")}
            >
                <MdSettings size={18} />
            </button>
            {isSwitching && <div className={styles.spinner}></div>}
        </div>
    );
};

export default AcademicYearSwitcher;
"use client";

import React from 'react';
import { useAcademicYear } from '@/app/context/AcademicYearContext';
import styles from './AcademicYearSwitcher.module.scss';
import { MdCalendarToday, MdExpandMore } from 'react-icons/md';

const AcademicYearSwitcher: React.FC = () => {
  const { currentYearName, availableYears, switchAcademicYear, loading } = useAcademicYear();

  const handleYearChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yearId = parseInt(e.target.value);
    if (yearId && yearId !== availableYears.find(y => y.yearName === currentYearName)?.id) {
      await switchAcademicYear(yearId, false);
    }
  };

  if (loading || availableYears.length === 0) {
    return null;
  }

  const currentYear = availableYears.find(y => y.yearName === currentYearName);

  return (
    <div className={styles.switcher}>
      <MdCalendarToday className={styles.icon} />
      <select 
        value={currentYear?.id || ''} 
        onChange={handleYearChange}
        className={styles.select}
        title="Switch Academic Year"
      >
        {availableYears.map((year) => (
          <option key={year.id} value={year.id}>
            {year.yearName} {year.isCurrent ? '(Default)' : ''}
          </option>
        ))}
      </select>
      <MdExpandMore className={styles.arrow} />
    </div>
  );
};

export default AcademicYearSwitcher;

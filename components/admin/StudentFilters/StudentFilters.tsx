"use client";
import React from 'react';
import styles from './StudentFilters.module.scss';
import { FiSearch } from 'react-icons/fi';

// --- 1. 'onSort' ko interface se hata diya gaya hai ---
interface FilterProps {
  onSearch: (query: string) => void;
}

// --- 2. 'onSort' ko yahan se bhi hata diya gaya hai ---
const StudentFilters: React.FC<FilterProps> = ({ onSearch }) => {
  return (
    // Ab 'controls' mein sirf search bar hai
    <div className={styles.controls}>
      <div className={styles.searchBar}>
        <FiSearch />
        <input 
          type="text" 
          placeholder="Search by name, roll no..." 
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      {/* --- 3. 'Sort by Name' wala div yahan se remove kar diya gaya hai --- */}
    </div>
  );
};

export default StudentFilters;
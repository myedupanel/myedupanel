"use client";
import React from 'react';
import styles from './StudentFilters.module.scss';
import { FiSearch } from 'react-icons/fi';

interface FilterProps {
  onSearch: (query: string) => void;
  onSort: (order: 'asc' | 'desc') => void;
}

const StudentFilters: React.FC<FilterProps> = ({ onSearch, onSort }) => {
  return (
    <div className={styles.controls}>
      <div className={styles.searchBar}>
        <FiSearch />
        <input 
          type="text" 
          placeholder="Search by name, roll no..." 
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className={styles.sort}>
        <label htmlFor="sort">Sort by Name:</label>
        <select id="sort" onChange={(e) => onSort(e.target.value as 'asc' | 'desc')}>
          <option value="asc">Ascending (A-Z)</option>
          <option value="desc">Descending (Z-A)</option>
        </select>
      </div>
    </div>
  );
};

export default StudentFilters;
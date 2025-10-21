"use client";
import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api';
import styles from './StudentSearch.module.scss';
import { FiSearch } from 'react-icons/fi';

interface Student {
  _id: string;
  name: string;
  class: string;
}

interface StudentSearchProps {
  onStudentSelect: (student: Student) => void;
}

const StudentSearch: React.FC<StudentSearchProps> = ({ onStudentSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      
      const searchStudents = async () => {
        setIsLoading(true);
        try {
          const res = await api.get(`/students/search?name=${query}`);
          setResults(res.data);
        } catch (error) {
          console.error("Failed to search students", error);
        } finally {
          setIsLoading(false);
        }
      };
      searchStudents();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (student: Student) => {
    setQuery(student.name);
    setResults([]);
    onStudentSelect(student);
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.inputWrapper}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search student by name..."
          className={styles.searchInput}
        />
      </div>
      {results.length > 0 && (
        <ul className={styles.resultsList}>
          {results.map((student) => (
            <li key={student._id} onClick={() => handleSelect(student)}>
              <strong>{student.name}</strong> - Class {student.class}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentSearch;
// src/components/admin/StudentSearch/StudentSearch.tsx
"use client";
import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api'; // Ensure correct path
import styles from './StudentSearch.module.scss';
import { FiSearch, FiLoader } from 'react-icons/fi'; // Import Loader icon

// --- INTERFACES ---

// Interface for initial search results
interface StudentSearchResult {
  id: string; // Prisma's studentid
  name: string;
  class: string;
}

// Interface for the full student profile (passed to parent)
// --- FIX 1: Saare missing fields ko interface mein add kiya ---
interface StudentFullProfile {
  id: string;
  name: string;
  class: string;
  dob?: string;
  address?: string;
  studentId?: string; 
  aadhaarNo?: string; 
  motherName?: string; 
  // --- YEH SAB ADD KIYA ---
  nationality?: string; 
  motherTongue?: string; 
  religion?: string; 
  caste?: string; 
  birthPlace?: string; 
  birthTaluka?: string; 
  birthDistrict?: string; 
  birthState?: string; 
  dobInWords?: string; 
  dateOfAdmission?: string; // <-- Sabse zaroori
  standardAdmitted?: string; 
  previousSchool?: string; 
}

interface StudentSearchProps {
  // Prop type wahi hai (perfect)
  onStudentSelect: (student: StudentFullProfile | null) => void; // Allow null to reset
}

const StudentSearch: React.FC<StudentSearchProps> = ({ onStudentSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false); // Loading for search results
  const [isFetchingDetails, setIsFetchingDetails] = useState(false); // Loading for full details
  const [fetchError, setFetchError] = useState<string | null>(null); // Error message state

  // --- useEffect for Searching (No change) ---
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setFetchError(null);
      onStudentSelect(null);
      return;
    }

    const timer = setTimeout(() => {
      const searchStudents = async () => {
        setIsSearching(true);
        setFetchError(null);
        try {
          const res = await api.get(`/students/search?name=${query}`);
          setResults(res.data || []);
        } catch (error) {
          console.error("Failed to search students", error);
          setFetchError('Search failed. Please try again.');
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      };
      searchStudents();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // --- MODIFIED handleSelect ---
  const handleSelect = async (selectedResult: StudentSearchResult) => {
    setQuery(selectedResult.name);
    setResults([]);
    setIsFetchingDetails(true);
    setFetchError(null);

    try {
      // 2. Fetch FULL details using the ID
      console.log(`Fetching full details for student ID: ${selectedResult.id}`);
      const res = await api.get(`/students/${selectedResult.id}`);

      if (!res.data) {
          throw new Error("Student data not found.");
      }

      // --- FIX 2: 'fullProfile' object mein saare data ko map kiya ---
      // (Yeh API response names aapke Network tab se match hone chahiye)
      const fullProfile: StudentFullProfile = {
        id: res.data.id,
        name: res.data.name,
        class: res.data.class,
        dob: res.data.dob,
        address: res.data.address,
        
        // Purane fields
        studentId: res.data.roll_number,
        aadhaarNo: res.data.uid_number,
        motherName: res.data.mother_name,

        // --- YEH SAB NAAYA ADD KIYA ---
        dateOfAdmission: res.data.admission_date, // <-- Sabse zaroori
        nationality: res.data.nationality,
        motherTongue: res.data.mother_tongue,
        religion: res.data.religion,
        caste: res.data.caste,
        birthPlace: res.data.birth_place,
        birthTaluka: res.data.taluka,
        birthDistrict: res.data.district,
        birthState: res.data.state,
        dobInWords: res.data.dob_in_words,
        standardAdmitted: res.data.standard_admitted,
        previousSchool: res.data.previous_school,
      };
      console.log("Full details fetched:", fullProfile);
      // --- END FIX ---

      // 4. Pass the COMPLETE profile to the parent component
      onStudentSelect(fullProfile);

    } catch (error: any) {
      console.error("Failed to fetch full student details", error);
      setFetchError(error.response?.data?.message || error.message || 'Could not load student details.');
    } finally {
      setIsFetchingDetails(false); // Stop loading indicator
    }
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
          disabled={isFetchingDetails}
        />
        {isSearching && <FiLoader className={`${styles.loadingIcon} ${styles.searchLoader}`} />}
      </div>

      {isFetchingDetails && <div className={styles.fetchingMessage}>Fetching student details...</div>}
      {fetchError && !isFetchingDetails && <div className={styles.errorMessage}>{fetchError}</div>}

      {!isFetchingDetails && results.length > 0 && (
        <ul className={styles.resultsList}>
          {results.map((student) => (
            <li key={student.id} onClick={() => handleSelect(student)}>
              <strong>{student.name}</strong> - Class {student.class}
            </li>
          ))}
        </ul>
      )}
       {!isSearching && !isFetchingDetails && query.length >= 2 && results.length === 0 && !fetchError && (
            <div className={styles.noResults}>No students found matching "{query}".</div>
       )}
    </div>
  );
};

export default StudentSearch;
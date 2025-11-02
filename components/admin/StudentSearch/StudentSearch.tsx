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
// --- FIX 1: Missing fields ko interface mein add kiya ---
interface StudentFullProfile {
  id: string;
  name: string;
  class: string;
  dob?: string;       // Date of Birth
  address?: string;    // Address
  studentId?: string;  // Yeh aapka Roll No / Sr. No hai
  aadhaarNo?: string;  // Aadhaar Number
  motherName?: string; // Mother's Name
  // ... baaki fields jo aapko baad mein chahiye
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
      // 🚨 IMPORTANT: Hum maan rahe hain ki /students/:id endpoint yeh sab data bhej raha hai
      console.log(`Fetching full details for student ID: ${selectedResult.id}`);
      const res = await api.get(`/students/${selectedResult.id}`);

      if (!res.data) {
          throw new Error("Student data not found.");
      }

      // --- FIX 2: 'fullProfile' object mein missing data ko map kiya ---
      // (Aapko check karna hoga ki API se yeh fields aa rahi hain ya nahi)
      const fullProfile: StudentFullProfile = {
        id: res.data.id,
        name: res.data.name,
        class: res.data.class,
        dob: res.data.dob,
        address: res.data.address,
        
        // YEH HAIN NAAYE ADDITIONS
        // (Yeh 'res.data' ke names aapke API response se match hone chahiye)
        studentId: res.data.roll_number, // Maan rahe hain ki 'roll_number' hi 'studentId' hai
        aadhaarNo: res.data.uid_number, // Maan rahe hain ki 'uid_number' hi 'aadhaarNo' hai
        motherName: res.data.mother_name, // Maan rahe hain ki 'mother_name' hi 'motherName' hai
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
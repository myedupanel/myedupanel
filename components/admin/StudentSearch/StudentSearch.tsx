// src/components/admin/StudentSearch/StudentSearch.tsx
"use client";
import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api'; // Ensure correct path
import styles from './StudentSearch.module.scss';
import { FiSearch, FiLoader } from 'react-icons/fi'; // Import Loader icon

// --- INTERFACES ---
// Interface for initial search results
interface StudentSearchResult {
  id: string;
  name: string;
  class: string;
}

// Interface for the full student profile (passed to parent)
interface StudentFullProfile {
  id: string;
  name: string;
  class: string;
  dob?: string;    // Date of Birth
  address?: string; // Address
  // Add any other fields your Bonafide/Leaving cert might eventually need
  // studentId?: string;
  // aadhaarNo?: string;
  // fatherName?: string;
  // surname?: string;
  // motherName?: string;
  // ... etc.
}

interface StudentSearchProps {
  // ✅ UPDATE PROP TYPE: Expect the full profile
  onStudentSelect: (student: StudentFullProfile | null) => void; // Allow null to reset
}

const StudentSearch: React.FC<StudentSearchProps> = ({ onStudentSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false); // Loading for search results
  const [isFetchingDetails, setIsFetchingDetails] = useState(false); // Loading for full details
  const [fetchError, setFetchError] = useState<string | null>(null); // Error message state

  // --- useEffect for Searching (No major change) ---
  useEffect(() => {
    // Clear results and error immediately if query is short
    if (query.length < 2) {
      setResults([]);
      setFetchError(null); // Clear previous errors
      onStudentSelect(null); // Notify parent that selection is cleared
      return;
    }

    const timer = setTimeout(() => {
      const searchStudents = async () => {
        setIsSearching(true);
        setFetchError(null); // Clear previous errors
        try {
          // Assuming search endpoint only returns basic details
          const res = await api.get(`/students/search?name=${query}`);
          setResults(res.data || []); // Use empty array if data is null/undefined
        } catch (error) {
          console.error("Failed to search students", error);
          setFetchError('Search failed. Please try again.');
          setResults([]); // Clear results on error
        } finally {
          setIsSearching(false);
        }
      };
      searchStudents();
    }, 500); // Increased debounce time slightly

    return () => clearTimeout(timer);
    // Removed onStudentSelect from dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // --- ✅ MODIFIED handleSelect ---
  const handleSelect = async (selectedResult: StudentSearchResult) => {
    // 1. Update UI immediately
    setQuery(selectedResult.name); // Keep name in input
    setResults([]); // Close dropdown
    setIsFetchingDetails(true); // Start loading indicator for details
    setFetchError(null); // Clear previous errors

    try {
      // 2. Fetch FULL details using the ID
      // 🚨 IMPORTANT: Ensure you have a backend endpoint like GET /students/:id
      //    that returns the *complete* student profile including dob, address, etc.
      console.log(`Fetching full details for student ID: ${selectedResult.id}`);
      const res = await api.get(`/students/${selectedResult.id}`);

      if (!res.data) {
          throw new Error("Student data not found.");
      }

      // 3. Prepare the full profile object (adjust fields based on your API response)
      const fullProfile: StudentFullProfile = {
        id: res.data.id,
        name: res.data.name,
        class: res.data.class,
        dob: res.data.dob,       // Make sure backend sends 'dob'
        address: res.data.address, // Make sure backend sends 'address'
        // Map other fields if needed from res.data
      };
      console.log("Full details fetched:", fullProfile);

      // 4. Pass the COMPLETE profile to the parent component
      onStudentSelect(fullProfile);

    } catch (error: any) {
      console.error("Failed to fetch full student details", error);
      setFetchError(error.response?.data?.message || error.message || 'Could not load student details.');
      // Optionally clear selection in parent if fetch fails?
      // onStudentSelect(null);
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
          disabled={isFetchingDetails} // Disable input while fetching details
        />
        {/* Loading indicator for search results */}
        {isSearching && <FiLoader className={`${styles.loadingIcon} ${styles.searchLoader}`} />}
      </div>

      {/* Show message while fetching full details */}
      {isFetchingDetails && <div className={styles.fetchingMessage}>Fetching student details...</div>}

      {/* Show error message if fetching full details failed */}
      {fetchError && !isFetchingDetails && <div className={styles.errorMessage}>{fetchError}</div>}

      {/* Show search results only if not fetching full details */}
      {!isFetchingDetails && results.length > 0 && (
        <ul className={styles.resultsList}>
          {results.map((student) => (
            <li key={student.id} onClick={() => handleSelect(student)}>
              <strong>{student.name}</strong> - Class {student.class}
            </li>
          ))}
        </ul>
      )}
       {/* Show no results message only if not loading and query is long enough */}
       {!isSearching && !isFetchingDetails && query.length >= 2 && results.length === 0 && !fetchError && (
            <div className={styles.noResults}>No students found matching "{query}".</div>
       )}
    </div>
  );
};

export default StudentSearch;
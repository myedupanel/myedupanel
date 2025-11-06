"use client";
import React, { useState } from 'react';
import styles from './ImportStudentsForm.module.scss';
import { MdUploadFile, MdDownload } from 'react-icons/md';
import Papa from 'papaparse';
import * as XLSX from 'xlsx'; // XLSX library ko import karein

interface ImportStudentsFormProps {
  onClose: () => void;
  onImport: (data: any[]) => void;
}

// === YAHAN FIX KIYA (1/3): "Smart Mapping" ko Super Intelligent Banaya ===
/**
 * Yeh function user ki file se raw data lega aur headers ko
 * hamare database ke 'clean' keys (jaise first_name) mein map karega.
 */
const normalizeData = (data: any[]) => {
  // Yahan humne AddStudentForm ke saare fields aur aapki Excel file ke messy headers add kar diye hain
  const headerMapping: { [key: string]: string[] } = {
    // Hamare 'Clean' Keys -> User ke 'Messy' Header options
    
    'first_name': [
      'first_name', 'firstname', 'first name', 'student name', 'name', 'f name', 
      '', // <-- CSV se khaali header ke liye
      '__empty', // <-- XLSX se khaali header ke liye (default)
      '__empty_1', // <-- XLSX se khaali header ke liye (Col B)
    ],
    'last_name': [
      'last_name', 'lastname', 'last name', 'l name', 'surname', 
      'last' // <-- Aapki Excel file (Col C) se
    ],
    'roll_number': [
      'roll_number', 'roll no', 'student id', 'roll number', 'roll', 
      'student id (f name' // <-- Aapki Excel file (Col A) se (TYPO FIX)
    ],
    'class_name': [
      'class_name', 'class', 'std', 'standard' // <-- 'class' aapki file se
    ],
    'father_name': [
      'father_name', 'father name', 'parent name', 'parent' // <-- 'parent name' aapki file se
    ],
    'guardian_contact': [
      'guardian_contact', 'parent contact', 'contact', 'mobile', 'phone' // <-- 'parent contact' aapki file se
    ],
    
    // Optional Fields
    'mother_name': ['mother_name', 'mother name'],
    'dob': ['dob', 'date of birth', 'birth date'],
    'admission_date': ['admission_date', 'admission date', 'date of admission', 'doj', 'date of joining'],
    'email': ['email', 'email id', 'student email'],
    'uid_number': ['uid_number', 'aadhar', 'uid', 'uid number', 'aadhaar no'],
    'nationality': ['nationality'],
    'caste': ['caste'],
    'birth_place': ['birth_place', 'birth place'],
    'previous_school': ['previous_school', 'previous school'],
    'address': ['address', 'home address']
  };

  // Ek reverse map banate hain taaki 'first name' ko 'first_name' se map kar sakein
  const aliasMap = new Map<string, string>();
  for (const cleanKey in headerMapping) {
    for (const alias of headerMapping[cleanKey]) {
      // Sabko lowercase aur trim karke map mein store karein
      aliasMap.set(alias.toLowerCase().trim(), cleanKey);
    }
  }

  // Ab har row ko process karein
  return data.map(row => {
    const cleanRow: { [key: string]: any } = {};
    for (const rawKey in row) {
      // User ke header ko clean karein (lowercase, trim)
      const lowerRawKey = rawKey.toLowerCase().trim();
      
      // Smart mapping se clean key dhoondein
      const cleanKey = aliasMap.get(lowerRawKey);
      
      if (cleanKey) {
        cleanRow[cleanKey] = row[rawKey];
      }
    }
    return cleanRow;
  });
};
// === FIX (1/3) ENDS HERE ===


const ImportStudentsForm: React.FC<ImportStudentsFormProps> = ({ onClose, onImport }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'text/csv', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        setError('Please upload a valid .csv or .xlsx file.');
        setSelectedFile(null);
      }
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }
    setIsLoading(true);

    const processData = (data: any[]) => {
      try {
        // === YAHAN FIX KIYA (2/3): Data ko pehle normalize karein ===
        const normalizedData = normalizeData(data);
        
        // Check karein ki data hai ya nahi
        if (normalizedData.length === 0) {
            setError("No data rows found in the file.");
            setIsLoading(false);
            return;
        }

        // Yeh check karega ki kam se kam ek row mein koi valid data mila ya nahi
        const hasValidData = normalizedData.some(row => Object.keys(row).length > 0);
        if (!hasValidData) {
            setError("Could not detect any valid headers. Please check your file's column names.");
            setIsLoading(false);
            return;
        }

        // Clean data ko parent component (page.tsx) ko bhej dein
        onImport(normalizedData);
        // Modal ko parent component band karega
      } catch (e) {
        setError("Error processing file data.");
        setIsLoading(false);
      }
    };

    if (selectedFile.name.endsWith('.csv')) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data); // Raw data ko process karein
        },
        error: (err) => {
          setError("Failed to parse CSV file.");
          setIsLoading(false);
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          
          processData(json); // Raw data ko process karein

        } catch (e) {
            setError("Failed to parse Excel file.");
            setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Error reading the file.");
        setIsLoading(false);
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.instructions}>
        {/* === YAHAN FIX KIYA (3/3): Instruction ko simple rakha === */}
        <p>Upload a CSV or Excel file with student details. The system will try to auto-detect your columns.</p>
        <p style={{fontSize: '0.8rem', color: '#666'}}>Required fields are: <strong>Roll Number, First Name, Last Name, Class, Parent Name, Parent Contact.</strong> Other fields are optional.</p>
        <a href="/sample-students.csv" download className={styles.sampleLink}>
          <MdDownload /> Download Sample CSV
        </a>
      </div>

      <label htmlFor="import-file-upload" className={styles.uploadArea}>
        <MdUploadFile size={40} />
        {selectedFile ? <p>Selected file: <strong>{selectedFile.name}</strong></p> : <p>Drag & drop your file here, or click to browse</p>}
      </label>
      <input id="import-file-upload" type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} className={styles.hiddenInput} />
      
      {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.footer}>
        <button onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancel</button>
        <button onClick={handleImport} className={styles.importButton} disabled={isLoading}>
          {isLoading ? 'Importing...' : 'Import Students'}
        </button>
      </div>
    </div>
  );
};

export default ImportStudentsForm;
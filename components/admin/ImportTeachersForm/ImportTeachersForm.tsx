"use client";
import React, { useState } from 'react';
// --- YAHAN BADLAV HUA HAI ---
// Path ko theek kar diya gaya hai taaki woh sahi folder mein dhoondhe
import styles from '../ImportStudentsForm/ImportStudentsForm.module.scss'; 
import { MdUploadFile, MdDownload } from 'react-icons/md';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ImportTeachersFormProps {
  onClose: () => void;
  onImport: (data: any[]) => void;
}

const ImportTeachersForm: React.FC<ImportTeachersFormProps> = ({ onClose, onImport }) => {
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

    if (selectedFile.name.endsWith('.csv')) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => { onImport(results.data); },
        error: (err) => { setError("Failed to parse CSV file."); setIsLoading(false); }
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
          onImport(json);
        } catch (e) {
            setError("Failed to parse Excel file.");
            setIsLoading(false);
        }
      };
      reader.onerror = () => { setError("Error reading the file."); setIsLoading(false); };
      reader.readAsBinaryString(selectedFile);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.instructions}>
        <p>Upload a CSV or Excel file. Headers must include: <strong>teacherId, name, subject, contactNumber, email</strong></p>
        <a href="/sample-teachers.csv" download className={styles.sampleLink}>
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
          {isLoading ? 'Importing...' : 'Import Teachers'}
        </button>
      </div>
    </div>
  );
};

export default ImportTeachersForm;
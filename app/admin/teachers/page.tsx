"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styles from './TeachersPage.module.scss';
import { useAuth } from '@/app/context/AuthContext';
import TeachersTable from '@/components/admin/TeachersTable/TeachersTable';
import Modal from '@/components/common/Modal/Modal';
import AddTeacherForm from '@/components/admin/AddTeacherForm/AddTeacherForm';
import { FiPlus, FiUpload, FiDownload } from 'react-icons/fi';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import StudentFilters from '@/components/admin/StudentFilters/StudentFilters';
import ImportTeachersForm from '@/components/admin/ImportTeachersForm/ImportTeachersForm';

// ✨ STEP 1: Socket.IO client ko import karein
import { io } from "socket.io-client";

// Step 1: Define the data structure for a Teacher
interface Teacher {
  _id: string;
  teacherId: string;
  name: string;
  subject: string;
  contactNumber: string;
  email: string;
  schoolId?: string;
  schoolName?: string;
}

// ✨ STEP 2: Apne backend ka URL define karein
// YEH LINE AAPKE CODE MEIN PEHLE SE THI, MAINE ISE CHHUA NAHI HAI
const socket = io("https://myedupanel.onrender.com");

const TeachersPage = () => {
  // Get the logged-in admin's data from AuthContext
  const { user } = useAuth();
  
  // State for controlling modals and data
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  
  // State for search and sort functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Step 2: Function to fetch teachers specifically for the logged-in admin's school
  const fetchTeachers = async () => {
    // Only fetch if we have the admin's school ID
    if (!user?._id) return; 
    try {
      const res = await axios.get('/api/teachers', {
        params: { schoolId: user._id } // Send schoolId to the backend
      });
      setTeachers(res.data);
    } catch (error) {
      console.error("Failed to fetch teachers", error);
    }
  };

  // Step 3: useEffect hook to run `fetchTeachers` when the component loads or the user changes
  useEffect(() => {
    fetchTeachers();
  }, [user]); // The dependency array [user] means this runs again if the user logs in/out

  // ✨ STEP 3: Real-time events ko "sunne" ke liye naya socket setup karein
  useEffect(() => {
    // 1. Backend se connect karein
    // --- YAHAN ERROR THA ---
    // Original: const socket = io(SOCKET_SERVER_URL);
    // Fixed:
    const socket = io("https://myedupanel.onrender.com");

    // 2. 'teacher_added' event ko sunein
    socket.on('teacher_added', (newTeacher: Teacher) => {
      console.log("SOCKET: Naya teacher add hua!", newTeacher);
      // State update: Purani list mein naya teacher jod dein
      setTeachers((prevTeachers) => [...prevTeachers, newTeacher]);
    });

    // 3. 'teacher_updated' event ko sunein
    socket.on('teacher_updated', (updatedTeacher: Teacher) => {
      console.log("SOCKET: Teacher update hua!", updatedTeacher);
      // State update: List mein puraane teacher ko naye se badal dein
      setTeachers((prevTeachers) =>
        prevTeachers.map((t) =>
          t._id === updatedTeacher._id ? updatedTeacher : t
        )
      );
    });

    // 4. 'teacher_deleted' event ko sunein
    socket.on('teacher_deleted', (deletedTeacherId: string) => {
      console.log("SOCKET: Teacher delete hua!", deletedTeacherId);
      // State update: List se uss ID waale teacher ko hata dein
      setTeachers((prevTeachers) =>
        prevTeachers.filter((t) => t._id !== deletedTeacherId)
      );
    });

    // 5. Clean-up: Jab component hatega, toh connection band kar dein
    return () => {
      socket.disconnect();
    };
  }, []); // [] ka matlab yeh effect sirf ek baar component load par chalega


  // Function to close modals and reset the editing state
  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingTeacher(null);
  };

  // Step 4: Handle the submission for both creating a new teacher and updating an existing one
  const handleFormSubmit = async (data: Omit<Teacher, '_id'>) => {
    // Attach the admin's schoolId and schoolName to the data being sent
    const dataToSend = {
      ...data,
      schoolId: user?._id, 
      schoolName: user?.schoolName
    };
    try {
      if (editingTeacher) {
        // If we are editing, send a PUT request
        await axios.put(`/api/teachers/${editingTeacher._id}`, dataToSend);
      } else {
        // If we are creating, send a POST request
        await axios.post('/api/teachers', dataToSend);
      }
      // ✨ FIX: fetchTeachers() yahaan se hata diya. Socket update ka intezar karega.
      closeModal();   // Close the modal
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save teacher.';
      alert(errorMessage);
    }
  };

  // Step 5: Handle Edit and Delete actions passed down to the TeachersTable component
  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await axios.delete(`/api/teachers/${id}`);
        // ✨ FIX: fetchTeachers() yahaan se hata diya. Socket update ka intezar karega.
      } catch (error) {
        console.error('Failed to delete teacher', error);
      }
    }
  };

  // Step 6: Memoize the filtered and sorted list to optimize performance
  const filteredAndSortedTeachers = useMemo(() => {
    if (!teachers) return [];
    return teachers
      .filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (t.teacherId && t.teacherId.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  }, [teachers, searchQuery, sortOrder]);

  // --- Import / Export Logic ---
  const csvHeaders = [
    { label: "Teacher ID", key: "teacherId" },
    { label: "Name", key: "name" },
    { label: "Subject", key: "subject" },
    { label: "Contact", key: "contactNumber" },
    { label: "Email", key: "email" },
  ];
  
  const handleXlsxExport = () => {
    const dataToExport = filteredAndSortedTeachers.map(({ _id, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
    XLSX.writeFile(workbook, "TeachersData.xlsx");
    setIsExportModalOpen(false);
  };

  const handleDataImport = async (importedData: any[]) => {
    const dataWithSchoolInfo = importedData.map(teacher => ({
      ...teacher,
      schoolId: user?._id,
      schoolName: user?.schoolName
    }));
    try {
      // Hum bulk import ke baad fetchTeachers() call karenge, 
      // kyunki backend/bulk route shayad ek-ek karke event emit na kare.
      const response = await axios.post('/api/teachers/bulk', dataWithSchoolInfo);
      alert(response.data.message);
      fetchTeachers(); // Bulk operation ke baad list ko refresh karein
      setIsImportModalOpen(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Error importing teachers.";
      alert(errorMessage);
    }
  };

  // Step 7: Render the component's JSX
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Teacher Management</h1>
        <div className={styles.headerActions}>
          <button onClick={() => setIsExportModalOpen(true)} className={`${styles.actionButton} ${styles.exportButton}`}>
            <FiDownload /> Export
          </button>
          <button onClick={() => setIsImportModalOpen(true)} className={`${styles.actionButton} ${styles.importButton}`}>
            <FiUpload /> Import Teachers
          </button>
          <button onClick={() => { setEditingTeacher(null); setIsAddModalOpen(true); }} className={`${styles.actionButton} ${styles.addButton}`}>
            <FiPlus /> Add New Teacher
          </button>
        </div>
      </header>
      
      <StudentFilters onSearch={setSearchQuery} onSort={setSortOrder} />

      <main>
        {/* Pass the functions and data down to the table component */}
        <TeachersTable teachers={filteredAndSortedTeachers} onEdit={handleEdit} onDelete={handleDelete} />
      </main>

      {/* Modals for different actions */}
      <Modal isOpen={isAddModalOpen} onClose={closeModal} title={editingTeacher ? "Edit Teacher" : "Add a New Teacher"}>
        <AddTeacherForm onClose={closeModal} onSubmit={handleFormSubmit} existingTeacher={editingTeacher}/>
      </Modal>

      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Teachers from File">
        <ImportTeachersForm onClose={() => setIsImportModalOpen(false)} onImport={handleDataImport} />
      </Modal>

      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Choose Export Format">
        <div className={styles.exportOptionsContainer}>
          <CSVLink data={filteredAndSortedTeachers} headers={csvHeaders} filename={"TeachersData.csv"} className={styles.exportOptionButton} onClick={() => setIsExportModalOpen(false)}>
            <FiDownload /> Export to CSV
          </CSVLink>
          <button className={`${styles.exportOptionButton} ${styles.xlsx}`} onClick={handleXlsxExport}>
            <FiDownload /> Export to XLSX (Excel)
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TeachersPage;
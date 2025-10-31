// app/admin/teachers/page.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // useCallback add karein
import styles from './TeachersPage.module.scss';
import { useAuth } from '@/app/context/AuthContext';
import TeachersTable from '@/components/admin/TeachersTable/TeachersTable';
import Modal from '@/components/common/Modal/Modal';
import AddTeacherForm from '@/components/admin/AddTeacherForm/AddTeacherForm';
import { FiPlus, FiUpload, FiDownload } from 'react-icons/fi';
import api from '@/backend/utils/api'; // axios ke bajaye api instance
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import StudentFilters from '@/components/admin/StudentFilters/StudentFilters';
import ImportTeachersForm from '@/components/admin/ImportTeachersForm/ImportTeachersForm';
import { io } from "socket.io-client";
import Link from 'next/link';
import { MdGridView } from 'react-icons/md';

// --- YEH HAI AAPKA FIX ---
// Step 1: Define the data structure for a Teacher (Prisma se match kiya)
interface TeacherData {
  teacher_dbid: number; // FIX: 'id: string' ko 'teacher_dbid: number' se badla
  teacherId: string;
  name: string;
  subject: string;
  contactNumber: string;
  email: string;
  schoolId?: string;
  schoolName?: string;
}
// --- FIX ENDS HERE ---

// Form data ka type (AddTeacherForm se match hona chahiye)
interface TeacherFormData {
  teacherId: string;
  name: string;
  subject: string;
  contactNumber: string;
  email: string;
}

// API se aaye data ko transform karne ke liye helper
// (Maan rahe hain ki API seedha data bhej raha hai)
const transformApiData = (apiTeacher: any): TeacherData => {
  return {
    teacher_dbid: apiTeacher.teacher_dbid, // Yeh database ID hai
    teacherId: apiTeacher.teacherId, // Yeh "T-101" jaisi ID hai
    name: apiTeacher.name,
    subject: apiTeacher.subject,
    contactNumber: apiTeacher.contactNumber,
    email: apiTeacher.email,
    schoolId: apiTeacher.schoolId,
    schoolName: apiTeacher.schoolName,
  };
};

const TeachersPage = () => {
  const { user } = useAuth();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // FIX: State ko naye 'TeacherData' interface se update kiya
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [editingTeacher, setEditingTeacher] = useState<TeacherData | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // FIX: fetchTeachers ko naya 'transformApiData' use karne ke liye update kiya
  const fetchTeachers = useCallback(async () => {
    if (!user?.schoolId) return; // 'user.id' ke bajaye 'user.schoolId' use karein
    try {
      const res = await api.get('/teachers', {
        // School ID ko params mein bhejna (agar backend expect kar raha hai)
        // params: { schoolId: user.schoolId } 
      });
      // API se aaye data ko format karke state mein save karein
      const formattedData = res.data.map(transformApiData);
      setTeachers(formattedData);
    } catch (error) {
      console.error("Failed to fetch teachers", error);
    }
  }, [user?.schoolId]); // Dependency ko 'user.schoolId' kiya

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]); 

  // FIX: Socket events ko naye 'teacher_dbid' ke liye update kiya
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://myedupanel.onrender.com");
    
    socket.on('teacher_added', (newApiTeacher: any) => {
      console.log("SOCKET: Naya teacher add hua!", newApiTeacher);
      if (newApiTeacher.schoolId !== user?.schoolId) return;
      const newTeacher = transformApiData(newApiTeacher);
      setTeachers((prevTeachers) => [...prevTeachers, newTeacher]);
    });

    socket.on('teacher_updated', (updatedApiTeacher: any) => {
      console.log("SOCKET: Teacher update hua!", updatedApiTeacher);
      if (updatedApiTeacher.schoolId !== user?.schoolId) return;
      const updatedTeacher = transformApiData(updatedApiTeacher);
      setTeachers((prevTeachers) =>
        prevTeachers.map((t) =>
          // 'id' ke bajaye 'teacher_dbid' se check karein
          t.teacher_dbid === updatedTeacher.teacher_dbid ? updatedTeacher : t
        )
      );
    });

    socket.on('teacher_deleted', (deletedInfo: { id: number, schoolId: string }) => {
      console.log("SOCKET: Teacher delete hua!", deletedInfo.id);
      if (deletedInfo.schoolId !== user?.schoolId) return;
      setTeachers((prevTeachers) =>
        // 'id' (string) ke bajaye 'deletedInfo.id' (number) se check karein
        prevTeachers.filter((t) => t.teacher_dbid !== deletedInfo.id)
      );
    });
    
    return () => {
      socket.disconnect();
    };
  }, [user?.schoolId]); // Dependency 'user.schoolId' add kiya


  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingTeacher(null);
  };

  // FIX: handleFormSubmit ko naye 'teacher_dbid' ke liye update kiya
  const handleFormSubmit = async (data: TeacherFormData) => {
    // School ID ko token se (backend par) lena behtar hai,
    // lekin agar frontend se bhej rahe hain:
    const dataToSend = {
      ...data,
      schoolId: user?.schoolId, 
      schoolName: user?.schoolName
    };

    try {
      if (editingTeacher) {
        // FIX: 'editingTeacher.id' (undefined) ke bajaye 'editingTeacher.teacher_dbid' (number) bhejein
        await api.put(`/api/teachers/${editingTeacher.teacher_dbid}`, dataToSend);
      } else {
        await api.post('/api/teachers', dataToSend);
      }
      // fetchTeachers(); // Socket handle kar lega
      closeModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save teacher.';
      alert(errorMessage);
    }
  };

  // FIX: 'handleEdit' ab 'TeacherData' type expect karega
  const handleEdit = (teacher: TeacherData) => {
    setEditingTeacher(teacher);
    setIsAddModalOpen(true);
  };

  // FIX: 'handleDelete' ab 'number' ID expect karega
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        // FIX: API call ab 'number' ID ke saath jaayega
        await api.delete(`/api/teachers/${id}`);
        // Socket delete ko handle kar lega
      } catch (error) {
        console.error('Failed to delete teacher', error);
      }
    }
  };

  // Filter/Sort logic (Yeh pehle se sahi lag raha hai)
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
    // FIX: 'teacher_dbid' ko export se hataya
    const dataToExport = filteredAndSortedTeachers.map(({ teacher_dbid, schoolId, schoolName, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
    XLSX.writeFile(workbook, "TeachersData.xlsx");
    setIsExportModalOpen(false);
  };

  const handleDataImport = async (importedData: any[]) => {
    const dataWithSchoolInfo = importedData.map(teacher => ({
      ...teacher,
      schoolId: user?.schoolId, // 'user.id' ke bajaye 'user.schoolId'
      schoolName: user?.schoolName
    }));
    try {
      const response = await api.post('/api/teachers/bulk', dataWithSchoolInfo);
      alert(response.data.message);
      fetchTeachers(); 
      setIsImportModalOpen(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Error importing teachers.";
      alert(errorMessage);
    }
  };

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
        {/* WARNING: Yeh component abhi error dega! */}
        <TeachersTable teachers={filteredAndSortedTeachers} onEdit={handleEdit} onDelete={handleDelete} />
      </main>

      <Modal isOpen={isAddModalOpen} onClose={closeModal} title={editingTeacher ? "Edit Teacher" : "Add a New Teacher"}>
        {/* WARNING: Yeh component bhi error dega! */}
        <AddTeacherForm 
          onClose={closeModal} 
          // FIX: 'onSubmit' ab 'TeacherFormData' type bhejega
          onSubmit={handleFormSubmit as (data: TeacherFormData) => void} 
          existingTeacher={editingTeacher}
        />
      </Modal>

      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Teachers from File">
        <ImportTeachersForm onClose={() => setIsImportModalOpen(false)} onImport={handleDataImport} />
      </Modal>

      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Choose Export Format">
        <div className={styles.exportOptionsContainer}>
          <CSVLink 
            data={filteredAndSortedTeachers} 
            headers={csvHeaders} 
            filename={"TeachersData.csv"} 
            className={styles.exportOptionButton} 
            onClick={() => setIsExportModalOpen(false)}
          >
            <FiDownload /> Export to CSV
          </CSVLink>
          <button className={`${styles.exportOptionButton} ${styles.xlsx}`} onClick={handleXlsxExport}>
            <FiDownload /> Export to XLSX (Excel)
          </button>
        </div>
      </Modal>

      <Link href="/admin/school" className={styles.dashboardLinkButton}>
        <MdGridView />
        Go to Dashboard
      </Link>

    </div>
  );
};

export default TeachersPage;
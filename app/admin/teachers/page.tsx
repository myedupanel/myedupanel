// app/admin/teachers/page.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
import styles from './TeachersPage.module.scss';
import { useAuth } from '@/app/context/AuthContext';
// FIX: Session Context (Teachers Global हैं, इसलिए इसे हटा दिया गया है)
import TeachersTable from '@/components/admin/TeachersTable/TeachersTable';
import Modal from '@/components/common/Modal/Modal';
import AddTeacherForm from '@/components/admin/AddTeacherForm/AddTeacherForm';
import { FiPlus, FiUpload, FiDownload } from 'react-icons/fi';
import api from '@/backend/utils/api'; 
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import StudentFilters from '@/components/admin/StudentFilters/StudentFilters';
import ImportTeachersForm from '@/components/admin/ImportTeachersForm/ImportTeachersForm';
import { io } from "socket.io-client";
import Link from 'next/link';
import { MdGridView } from 'react-icons/md';

interface TeacherData {
  teacher_dbid: number; 
  teacherId: string;
  name: string;
  subject: string;
  contactNumber: string;
  email: string;
  schoolId?: string;
  schoolName?: string;
}

interface TeacherFormData {
  teacherId: string;
  name: string;
  subject: string;
  contactNumber: string;
  email: string;
}

const transformApiData = (apiTeacher: any): TeacherData => {
  return {
    teacher_dbid: apiTeacher.teacher_dbid, 
    teacherId: apiTeacher.teacherId, 
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
  
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [editingTeacher, setEditingTeacher] = useState<TeacherData | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // FIX 1: sortOrder state को हटा दिया गया
  // const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchTeachers = useCallback(async () => {
    if (!user?.schoolId) return;
    try {
      const res = await api.get('/teachers');
      const formattedData = res.data.map(transformApiData);
      setTeachers(formattedData);
    } catch (error) {
      console.error("Failed to fetch teachers", error);
    }
  }, [user?.schoolId]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]); 

  // Socket events (No Change)
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://myedupanel.onrender.com");
    
    socket.on('teacher_added', (newApiTeacher: any) => {
      if (newApiTeacher.schoolId !== user?.schoolId) return;
      const newTeacher = transformApiData(newApiTeacher);
      setTeachers((prevTeachers) => [...prevTeachers, newTeacher]);
    });

    socket.on('teacher_updated', (updatedApiTeacher: any) => {
      if (updatedApiTeacher.schoolId !== user?.schoolId) return;
      const updatedTeacher = transformApiData(updatedApiTeacher);
      setTeachers((prevTeachers) =>
        prevTeachers.map((t) =>
          t.teacher_dbid === updatedTeacher.teacher_dbid ? updatedTeacher : t
        )
      );
    });

    socket.on('teacher_deleted', (deletedInfo: { id: number, schoolId: string }) => {
      if (deletedInfo.schoolId !== user?.schoolId) return;
      setTeachers((prevTeachers) =>
        prevTeachers.filter((t) => t.teacher_dbid !== deletedInfo.id)
      );
    });
    
    return () => {
      socket.disconnect();
    };
  }, [user?.schoolId]); 


  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingTeacher(null);
  };

  const handleFormSubmit = async (data: TeacherFormData) => {
    const dataToSend = {
      ...data,
      schoolId: user?.schoolId, 
      schoolName: user?.schoolName
    };

    try {
      if (editingTeacher) {
        await api.put(`/api/teachers/${editingTeacher.teacher_dbid}`, dataToSend);
      } else {
        await api.post('/api/teachers', dataToSend);
      }
      closeModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save teacher.';
      alert(errorMessage);
    }
  };

  const handleEdit = (teacher: TeacherData) => {
    setEditingTeacher(teacher);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await api.delete(`/api/teachers/${id}`);
      } catch (error) {
        console.error('Failed to delete teacher', error);
      }
    }
  };

  // FIX 2: Sorting logic और sortOrder dependency हटा दी गई
  const filteredAndSortedTeachers = useMemo(() => {
    if (!teachers) return [];
    return teachers
      .filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (t.teacherId && t.teacherId.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      // Sorting logic हटा दिया गया
  }, [teachers, searchQuery]); 

  // --- Import / Export Logic ---
  const csvHeaders = [
    { label: "Teacher ID", key: "teacherId" },
    { label: "Name", key: "name" },
    { label: "Subject", key: "subject" },
    { label: "Contact", key: "contactNumber" },
    { label: "Email", key: "email" },
  ];
  
  const handleXlsxExport = () => {
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
      schoolId: user?.schoolId, 
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
      
      {/* FIX 3: onSort prop हटा दिया गया */}
      <StudentFilters onSearch={setSearchQuery} />

      <main>
        <TeachersTable teachers={filteredAndSortedTeachers} onEdit={handleEdit} onDelete={handleDelete} />
      </main>

      <Modal isOpen={isAddModalOpen} onClose={closeModal} title={editingTeacher ? "Edit Teacher" : "Add a New Teacher"}>
        <AddTeacherForm 
          onClose={closeModal} 
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
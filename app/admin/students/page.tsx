// app/admin/students/page.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './StudentsPage.module.scss';
import StudentSidebar from './components/StudentSidebar';
import StudentsTable from '@/components/admin/StudentsTable/StudentsTable';
import Modal from '@/components/common/Modal/Modal';
import AddStudentForm from '@/components/admin/AddStudentForm/AddStudentForm';
import { FiDownload, FiPrinter, FiChevronDown } from 'react-icons/fi';
import api from '@/backend/utils/api';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import ImportStudentsForm from '@/components/admin/ImportStudentsForm/ImportStudentsForm';
import StudentFilters from '@/components/admin/StudentFilters/StudentFilters'; 
import { io } from "socket.io-client";
import { useAuth } from '@/app/context/AuthContext';

// --- DATA INTERFACES (KOI BADLAAV NAHI) ---
interface ApiStudent {
    studentid: number;
    first_name: string;
    last_name: string;
    father_name: string;
    guardian_contact: string;
    roll_number: string;
    class: { class_name: string } | null;
    schoolId: string;
    dob?: Date | string; 
    address?: string; 
    email?: string; 
    mother_name?: string;
    uid_number?: string;
    nationality?: string;
    caste?: string;
    birth_place?: string;
    previous_school?: string;
    admission_date?: Date | string;
}

interface StudentData {
    studentid: number; 
    roll_number: string;
    first_name: string;
    last_name: string;
    class_name: string;
    father_name: string;
    guardian_contact: string;
    dob?: string; 
    address?: string; 
    email?: string;
    mother_name?: string;
    uid_number?: string; 
    nationality?: string;
    caste?: string;
    birth_place?: string;
    previous_school?: string;
    admission_date?: string; 
    schoolId?: string; 
}

interface FormData {
    roll_number: string;
    first_name: string;
    last_name: string;
    class_name: string;
    father_name: string;
    guardian_contact: string;
    dob?: string; 
    address?: string; 
    email?: string;
    mother_name?: string;
    uid_number?: string;
    nationality?: string;
    caste?: string;
    birth_place?: string;
    previous_school?: string;
    admission_date?: string;
}
interface ClassData {
    class_id: number;
    class_name: string;
}


// --- HELPER FUNCTIONS (KOI BADLAAV NAHI) ---
const transformApiData = (apiStudent: ApiStudent): StudentData => {
    const formatDate = (dateStr?: Date | string) => {
        if (!dateStr) return '';
        try { return new Date(dateStr).toISOString().split('T')[0]; } 
        catch (e) { return ''; }
    };

    return {
        studentid: apiStudent.studentid,
        roll_number: apiStudent.roll_number,
        first_name: apiStudent.first_name,
        last_name: apiStudent.last_name,
        class_name: apiStudent.class?.class_name || 'N/A',
        father_name: apiStudent.father_name,
        guardian_contact: apiStudent.guardian_contact,
        dob: formatDate(apiStudent.dob),
        address: apiStudent.address || '',
        email: apiStudent.email || '',
        mother_name: apiStudent.mother_name || '',
        uid_number: apiStudent.uid_number || '',
        nationality: apiStudent.nationality || '',
        caste: apiStudent.caste || '',
        birth_place: apiStudent.birth_place || '',
        previous_school: apiStudent.previous_school || '',
        admission_date: formatDate(apiStudent.admission_date),
        schoolId: apiStudent.schoolId,
    };
};

const getFullName = (s: { first_name?: string, last_name?: string }) => [s.first_name, s.last_name].filter(Boolean).join(' ');


// --- 3. MAIN COMPONENT ---
const StudentsPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth(); 

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const [students, setStudents] = useState<StudentData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
    
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [isActionsOpen, setIsActionsOpen] = useState(false);

    
    useEffect(() => {
        const modalParam = searchParams.get('modal');
        if (modalParam === 'add') {
            setIsAddModalOpen(true);
        } else if (modalParam === 'import') {
            setIsImportModalOpen(true);
        } else if (modalParam === 'export') {
            setIsExportModalOpen(true);
        }
    }, [searchParams]);

    const fetchStudents = useCallback(async () => {
        try {
            const res = await api.get('/students');
            const formattedData = res.data.map(transformApiData);
            setStudents(formattedData);
        } catch (error) {
            console.error("Failed to fetch students. Token might be invalid.", error);
        }
    }, []);

    const fetchClasses = useCallback(async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data);
        } catch (error) {
            console.error("Failed to fetch classes.", error);
        }
    }, []);


    useEffect(() => {
        fetchStudents();
        fetchClasses(); 
    }, [fetchStudents, fetchClasses]); 

    // --- Socket useEffect (KOI BADLAAV NAHI) ---
    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://myedupanel.onrender.com");
        socket.on('student_added', (newApiStudent: ApiStudent) => {
            if (newApiStudent.schoolId !== user?.schoolId) return; 
            const newStudent = transformApiData(newApiStudent); 
            setStudents((prevStudents) => [...prevStudents, newStudent]);
        });
        socket.on('student_updated', (updatedApiStudent: ApiStudent) => {
            if (updatedApiStudent.schoolId !== user?.schoolId) return; 
            const updatedStudent = transformApiData(updatedApiStudent);
            setStudents((prevStudents) =>
                prevStudents.map((s) =>
                    s.studentid === updatedStudent.studentid ? updatedStudent : s
                )
            );
        });
        socket.on('student_deleted', (deletedInfo: { id: number, schoolId: string }) => {
            if (deletedInfo.schoolId !== user?.schoolId) return; 
            setStudents((prevStudents) =>
                prevStudents.filter((s) => s.studentid !== deletedInfo.id) 
            );
        });
        return () => {
            socket.disconnect();
        };
    }, [user?.schoolId]);


    const clearModalParam = () => {
        router.replace('/admin/students', { scroll: false });
    };

    const handleEditClick = (student: StudentData) => {
        setEditingStudent(student);
        setIsAddModalOpen(true);
    };

    const handleGenerateBonafide = (student: StudentData) => {
        router.push(`/admin/students/generate-bonafide?studentId=${student.studentid}`);
    };

    const closeAddModalAndReset = () => {
        setIsAddModalOpen(false);
        setEditingStudent(null);
        clearModalParam();
    };

    const closeImportModal = () => {
        setIsImportModalOpen(false);
        clearModalParam();
    };

    const closeExportModal = () => {
        setIsExportModalOpen(false);
        clearModalParam();
    };

    const handleUpdateStudent = async (updatedData: Partial<FormData>) => {
        if (!editingStudent) return;
        try {
            await api.put(`/students/${editingStudent.studentid}`, updatedData);
            closeAddModalAndReset();
        } catch (error) {
            console.error('Failed to update student', error);
            alert('Failed to update student');
            throw error; 
        }
    };

    const handleDeleteStudent = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            try {
                await api.delete(`/students/${id}`);
            } catch (error) {
                console.error('Failed to delete student', error);
            }
        }
    };

    const handleDataImport = async (importedData: any[]) => {
        try {
            const response = await api.post('/students/bulk', importedData);
            alert(response.data.message);
            fetchStudents();
            closeImportModal();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Error importing students.";
            alert(errorMessage);
        }
    };

    const csvHeaders = [
        { label: "Student ID (Roll No)", key: "roll_number" },
        { label: "First Name", key: "first_name" },
        { label: "Last Name", key: "last_name" },
        { label: "Class", key: "class_name" },
        { label: "Parent Name", key: "father_name" },
        { label: "Parent Contact", key: "guardian_contact" },
        { label: "Email", key: "email" },
        { label: "DOB", key: "dob" },
    ];

    const filteredAndSortedStudents = useMemo(() => {
        return students
            .filter(student => {
                // 1. Search query filter
                const fullName = getFullName(student).toLowerCase();
                const query = searchQuery.toLowerCase();
                const matchesSearch = fullName.includes(query) || student.roll_number.toLowerCase().includes(query);

                // 2. Class filter
                const matchesClass = (selectedClass === 'all') || (student.class_name === selectedClass);

                return matchesSearch && matchesClass;
            });
    }, [students, searchQuery, selectedClass]);

    const handleXlsxExport = () => {
        const dataToExport = filteredAndSortedStudents.map(s => ({
            "Student ID (Roll No)": s.roll_number, 
            "First Name": s.first_name, 
            "Last Name": s.last_name, 
            "Class": s.class_name,
            "Parent Name": s.father_name, 
            "Parent Contact": s.guardian_contact,
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
        XLSX.writeFile(workbook, "StudentsData.xlsx");
        setIsActionsOpen(false); 
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Students List</title><style>body{font-family:sans-serif;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #ddd; padding:8px; text-align:left;} th{background-color:#f2f2f2;}</style></head><body>');
            printWindow.document.write('<h1>Students List</h1><table><thead><tr><th>Student ID</th><th>Name</th><th>Class</th><th>Parent Name</th><th>Parent Contact</th></tr></thead><tbody>');
            filteredAndSortedStudents.forEach(s => {
                printWindow.document.write(`<tr><td>${s.roll_number}</td><td>${getFullName(s)}</td><td>${s.class_name}</td><td>${s.father_name}</td><td>${s.guardian_contact}</td></tr>`);
            });
            printWindow.document.write('</tbody></table></body></html>');
            printWindow.document.close();
            printWindow.print();
            printWindow.close();
        }
        setIsActionsOpen(false); 
    };

    return (
        <>
            <div className={styles.studentPageLayout}>
                <StudentSidebar />
                <div className={styles.mainContent}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>Student Management</h1>
                    </header>
                    
                    {/* --- YAHAN BADLAAV KIYA GAYA (Re-ordered) --- */}
                    <div className={styles.filtersContainer}>
                        
                        {/* 1. Search Bar (Note: Sort UI abhi bhi iske andar hai) */}
                        <div className={styles.searchFilter}>
                            <StudentFilters 
                                onSearch={setSearchQuery} 
                                onSort={() => {}} // Dummy function
                            />
                        </div>

                        {/* 2. Class Filter */}
                        <div className={styles.classFilter}>
                            <label htmlFor="classSelect">Class:</label>
                            <select 
                                id="classSelect" 
                                value={selectedClass} 
                                onChange={e => setSelectedClass(e.target.value)}
                                className={styles.classSelectDropdown}
                            >
                                <option value="all">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls.class_id} value={cls.class_name}>
                                        {cls.class_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Actions Button (yeh right mein align ho jayega) */}
                        <div className={styles.actionsDropdownContainer}>
                            <button 
                                onClick={() => setIsActionsOpen(!isActionsOpen)} 
                                className={styles.actionsButton}
                            >
                                <span>Actions</span>
                                <FiChevronDown />
                            </button>
                            {isActionsOpen && (
                                <div className={styles.actionsMenu}>
                                    <CSVLink
                                        data={filteredAndSortedStudents}
                                        headers={csvHeaders}
                                        filename={"StudentsData.csv"}
                                        className={styles.actionItem}
                                        onClick={() => setIsActionsOpen(false)} 
                                    >
                                        <FiDownload /> Download CSV
                                    </CSVLink>
                                    <button onClick={handleXlsxExport} className={styles.actionItem}>
                                        <FiDownload /> Download XLSX
                                    </button>
                                    <button onClick={handlePrint} className={styles.actionItem}>
                                        <FiPrinter /> Print List
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* --- BADLAAV KHATM --- */}


                    <main>
                        <StudentsTable
                            students={filteredAndSortedStudents}
                            onDelete={handleDeleteStudent}
                            onEdit={handleEditClick}
                            onGenerateBonafide={handleGenerateBonafide}
                        />
                    </main>
                </div>
            </div>

            {/* --- Modals (Koi Badlaav Nahi) --- */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={closeAddModalAndReset}
                title={editingStudent ? "Edit Student Details" : "Add a New Student"}
            >
                <AddStudentForm
                    onClose={closeAddModalAndReset}
                    onSuccess={fetchStudents} 
                    existingStudent={editingStudent}
                    onUpdate={handleUpdateStudent}
                />
            </Modal>

            <Modal
                isOpen={isImportModalOpen}
                onClose={closeImportModal}
                title="Import Students from File"
            >
                <ImportStudentsForm
                    onClose={closeImportModal}
                    onImport={handleDataImport}
                />
            </Modal>

            <Modal
                isOpen={isExportModalOpen}
                onClose={closeExportModal}
                title="Choose Action"
            >
                <div className={styles.exportOptionsContainer}>
                    <CSVLink
                        data={filteredAndSortedStudents}
                        headers={csvHeaders}
                        filename={"StudentsData.csv"}
                        className={`${styles.exportOptionButton} ${styles.csv}`}
                        onClick={closeExportModal}
                    >
                        <FiDownload /> Export to CSV
                    </CSVLink>
                    <button
                        className={`${styles.exportOptionButton} ${styles.xlsx}`}
                        onClick={handleXlsxExport}
                    >
                        <FiDownload /> Export to XLSX (Excel)
                    </button>
                    <button
                        className={`${styles.exportOptionButton} ${styles.print}`}
                        onClick={handlePrint}
                    >
                        <FiPrinter /> Print List
                    </button>
                </div>
            </Modal> 
        </>
    );
};

export default StudentsPage;
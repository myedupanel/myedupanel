// app/admin/students/page.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './StudentsPage.module.scss';
import StudentSidebar from './components/StudentSidebar';
import StudentsTable from '@/components/admin/StudentsTable/StudentsTable';
import Modal from '@/components/common/Modal/Modal';
import AddStudentForm from '@/components/admin/AddStudentForm/AddStudentForm';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import api from '@/backend/utils/api';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import ImportStudentsForm from '@/components/admin/ImportStudentsForm/ImportStudentsForm';
import StudentFilters from '@/components/admin/StudentFilters/StudentFilters';
import { io } from "socket.io-client";
import { useAuth } from '@/app/context/AuthContext'; // ✨ useAuth import kiya

// --- 1. DATA INTERFACES KO PRISMA SE SYNC KIYA ---

// Yeh hai raw data jo API se (GET /api/students) aayega
interface ApiStudent {
    studentid: number;
    first_name: string;
    last_name: string;
    father_name: string;
    guardian_contact: string;
    roll_number: string;
    class: { class_name: string } | null;
    schoolId: string;
    // Saare optional fields
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

// Yeh hai formatted data jo hum apne component state (students) mein rakhenge
// Yeh 'AddStudentForm' ke 'FormData' se bhi match karta hai
interface StudentData {
    studentid: number; // Prisma ID
    roll_number: string;
    first_name: string;
    last_name: string;
    class_name: string;
    father_name: string;
    guardian_contact: string;
    // Optional fields
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
    schoolId?: string; // Socket filtering ke liye
}

// Yeh 'AddStudentForm' ko pass kiye jaane waale data ka type hai
// Yeh file AddStudentForm.tsx se match honi chahiye
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


// --- 2. HELPER FUNCTIONS ---

// API data ko state data mein badalne ke liye
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

// Student ka poora naam paane ke liye
const getFullName = (s: { first_name?: string, last_name?: string }) => [s.first_name, s.last_name].filter(Boolean).join(' ');


// --- 3. MAIN COMPONENT ---
const StudentsPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth(); // ✨ User ko auth context se nikala

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // FIX: State ko naye 'StudentData' interface se update kiya
    const [students, setStudents] = useState<StudentData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    // FIX: State ko naye 'StudentData' interface se update kiya
    const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
    
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

    // FIX: fetchStudents ab API data ko transform karega
    const fetchStudents = useCallback(async () => {
        try {
            const res = await api.get('/students'); // API se raw data milega
            // Data ko 'transformApiData' se format karke state mein save karein
            const formattedData = res.data.map(transformApiData);
            setStudents(formattedData);
        } catch (error) {
            console.error("Failed to fetch students. Token might be invalid.", error);
        }
    }, []); // useCallback dependency array khaali rakha

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // FIX: Socket events ko naye data structure ke liye update kiya
    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://myedupanel.onrender.com");

        // 'student_added' event
        socket.on('student_added', (newApiStudent: ApiStudent) => {
            console.log("SOCKET: Naya student add hua!", newApiStudent);
            if (newApiStudent.schoolId !== user?.schoolId) return; // School check
            const newStudent = transformApiData(newApiStudent); // Data ko format kiya
            setStudents((prevStudents) => [...prevStudents, newStudent]);
        });

        // 'student_updated' event
        socket.on('student_updated', (updatedApiStudent: ApiStudent) => {
            console.log("SOCKET: Student update hua!", updatedApiStudent);
            if (updatedApiStudent.schoolId !== user?.schoolId) return; // School check
            const updatedStudent = transformApiData(updatedApiStudent); // Data ko format kiya
            setStudents((prevStudents) =>
                prevStudents.map((s) =>
                    s.studentid === updatedStudent.studentid ? updatedStudent : s // 'id' ke bajaye 'studentid' use kiya
                )
            );
        });

        // 'student_deleted' event
        socket.on('student_deleted', (deletedInfo: { id: number, schoolId: string }) => {
            console.log("SOCKET: Student delete hua!", deletedInfo.id);
            if (deletedInfo.schoolId !== user?.schoolId) return; // School check
            setStudents((prevStudents) =>
                prevStudents.filter((s) => s.studentid !== deletedInfo.id) // 'id' ke bajaye 'studentid' use kiya
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.schoolId]); // ✨ user.schoolId ko dependency mein daala


    const clearModalParam = () => {
        router.replace('/admin/students', { scroll: false });
    };

    // FIX: 'Student' type ko 'StudentData' se badla
    const handleEditClick = (student: StudentData) => {
        setEditingStudent(student);
        setIsAddModalOpen(true);
    };

    // FIX: 'Student' type ko 'StudentData' se badla
    const handleGenerateBonafide = (student: StudentData) => {
        router.push(`/admin/students/generate-bonafide?studentId=${student.studentid}`); // 'id' ke bajaye 'studentid'
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

    // FIX: 'handleUpdateStudent' ko naye 'FormData' type ke liye update kiya
    const handleUpdateStudent = async (updatedData: Partial<FormData>) => {
        if (!editingStudent) return;
        try {
            // API call backend ko 'updatedData' (jismein first_name, etc. hai) bhejega
            // API call 'studentid' ka istemaal karega
            await api.put(`/students/${editingStudent.studentid}`, updatedData);
            closeAddModalAndReset();
            // Socket event isse automatically handle kar lega
        } catch (error) {
            console.error('Failed to update student', error);
            alert('Failed to update student');
            throw error; // Error ko form par waapas bhejein
        }
    };

    // FIX: 'handleDeleteStudent' ko number ID accept karne ke liye update kiya
    const handleDeleteStudent = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            try {
                await api.delete(`/students/${id}`);
                // Socket event isse handle kar lega
            } catch (error) {
                console.error('Failed to delete student', error);
            }
        }
    };

    const handleDataImport = async (importedData: any[]) => {
        try {
            const response = await api.post('/students/bulk', importedData);
            alert(response.data.message);
            fetchStudents(); // Bulk add ke baad poori list refresh karna sahi hai
            closeImportModal();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Error importing students.";
            alert(errorMessage);
        }
    };

    // FIX: CSV Headers ko naye data structure se match kiya
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

    // FIX: Filtering aur Sorting ko naye data structure se match kiya
    const filteredAndSortedStudents = useMemo(() => {
        return students
            .filter(student => {
                const fullName = getFullName(student).toLowerCase();
                const query = searchQuery.toLowerCase();
                return fullName.includes(query) || student.roll_number.toLowerCase().includes(query);
            })
.sort((a, b) => {
    const nameA = getFullName(a);
    const nameB = getFullName(b);
    return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA); // <-- FIX YAHAN HAI
})
    }, [students, searchQuery, sortOrder]);

    const handleXlsxExport = () => {
        const dataToExport = filteredAndSortedStudents.map(s => ({
            "Student ID (Roll No)": s.roll_number, 
            "First Name": s.first_name, 
            "Last Name": s.last_name, 
            "Class": s.class_name,
            "Parent Name": s.father_name, 
            "Parent Contact": s.guardian_contact,
            // (Baaki fields bhi add kar sakte hain)
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
        XLSX.writeFile(workbook, "StudentsData.xlsx");
        closeExportModal();
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
        closeExportModal();
    };

    return (
        <>
            <div className={styles.studentPageLayout}>
                <StudentSidebar />
                <div className={styles.mainContent}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>Student Management</h1>
                    </header>
                    <StudentFilters onSearch={setSearchQuery} onSort={setSortOrder} />

                    <main>
                        {/* WARNING: Yeh component abhi bhi error dega! 
                          Humne 'StudentsTable' ko abhi update nahi kiya hai.
                          Hum 'filteredAndSortedStudents' (StudentData[]) bhej rahe hain,
                          lekin 'StudentsTable' purana 'Student[]' expect kar raha hai.
                        */}
                        <StudentsTable
                            students={filteredAndSortedStudents}
                            onDelete={handleDeleteStudent}
                            onEdit={handleEditClick}
                            onGenerateBonafide={handleGenerateBonafide}
                        />
                    </main>
                </div>
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={closeAddModalAndReset}
                title={editingStudent ? "Edit Student Details" : "Add a New Student"}
            >
                {/* FIX: Ab props match ho rahe hain!
                  'existingStudent' ab 'StudentData' type ka hai, jo 'AddStudentForm' expect karta hai.
                  'onUpdate' ab 'Partial<FormData>' expect karta hai.
                */}
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
"use client";
import React, { useState, useEffect, useMemo } from 'react';
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

// ✨ STEP 1: Socket.IO client ko import karein
import { io } from "socket.io-client";

interface Student {
    id: string;
    studentId: string;
    name: string;
    class: string;
    rollNo: string;
    parentName: string;
    parentContact: string;
}

// ✨ STEP 2: Apne backend ka URL define karein (Yeh line abhi use nahi ho rahi hai, par koi baat nahi)
const socket = io("https://myedupanel.onrender.com");

const StudentsPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const [students, setStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    
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


    const fetchStudents = async () => {
        try {
            const res = await api.get('/students');
            setStudents(res.data);
        } catch (error) {
            console.error("Failed to fetch students. Token might be invalid.", error);
        }
    };

    // Yeh aapka original 'useEffect' hai jo pehli baar data laata hai
    useEffect(() => {
        fetchStudents();
    }, []);

    // ✨ STEP 3: Real-time "smarter" events ko sunne ke liye naya 'useEffect'
    useEffect(() => {
        // 1. Backend se connect karein
        // --- YAHAN BADLAAV KIYA GAYA HAI ---
        // Humne 'SOCKET_SERVER_URL' ko asli URL se replace kar diya hai
        const socket = io("https://myedupanel.onrender.com");

        // 2. 'student_added' event ko sunein
        socket.on('student_added', (newStudent: Student) => {
            console.log("SOCKET: Naya student add hua!", newStudent);
            // State update: Purani list mein naya student jod dein
            // Isse list turant update ho jaayegi
            setStudents((prevStudents) => [...prevStudents, newStudent]);
        });

        // 3. 'student_updated' event ko sunein
        socket.on('student_updated', (updatedStudent: Student) => {
            console.log("SOCKET: Student update hua!", updatedStudent);
            // State update: List mein puraane student ko naye se badal dein
            setStudents((prevStudents) =>
                prevStudents.map((s) =>
                    s.id === updatedStudent.id ? updatedStudent : s
                )
            );
        });

        // 4. 'student_deleted' event ko sunein
        socket.on('student_deleted', (deletedStudentId: string) => {
            console.log("SOCKET: Student delete hua!", deletedStudentId);
            // State update: List se uss ID waale student ko hata dein
            setStudents((prevStudents) =>
                prevStudents.filter((s) => s.id !== deletedStudentId)
            );
        });

        // 5. Clean-up: Jab component hatega, toh connection band kar dein
        return () => {
            socket.disconnect();
        };
    }, []); // [] ka matlab yeh effect sirf ek baar component load par chalega


    const clearModalParam = () => {
        router.replace('/admin/students', { scroll: false });
    };

    const handleEditClick = (student: Student) => {
        setEditingStudent(student);
        setIsAddModalOpen(true);
    };

    const handleGenerateBonafide = (student: Student) => {
        router.push(`/admin/students/generate-bonafide?studentId=${student.id}`);
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

    const handleUpdateStudent = async (updatedData: Partial<Student>) => {
        if (!editingStudent) return;
        try {
            // Note: Jab yeh API call hoga, aapka backend 'student_updated' event bhejega.
            // Aapka socket listener usse pakad lega aur state update kar dega.
            await api.put(`/students/${editingStudent.id}`, updatedData);
            closeAddModalAndReset();
            // fetchStudents(); // Hum iski jagah socket par nirbhar kar sakte hain, lekin aapke code ke mutabik rakha hai
        } catch (error) {
            console.error('Failed to update student', error);
            alert('Failed to update student');
        }
    };

    const handleDeleteStudent = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            try {
                // Note: Jab yeh API call hoga, aapka backend 'student_deleted' event bhejega.
                await api.delete(`/students/${id}`);
                // fetchStudents(); // Socket isse handle kar lega
            } catch (error) {
                console.error('Failed to delete student', error);
            }
        }
    };

    const handleDataImport = async (importedData: any[]) => {
        try {
            // Note: Bulk import ke liye, backend ko 'student_added' multiple baar bhejna hoga
            // ya ek 'students_bulk_added' event bhejna hoga.
            // Abhi ke liye, hum 'fetchStudents' par hi nirbhar rahenge.
            const response = await api.post('/students/bulk', importedData);
            alert(response.data.message);
            fetchStudents(); // Bulk add ke baad poori list refresh karna sahi hai
            closeImportModal();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Error importing students.";
            alert(errorMessage);
        }
    };

    const csvHeaders = [
        { label: "Student ID", key: "studentId" },
        { label: "Student Name", key: "name" },
        { label: "Class", key: "class" },
        { label: "Roll No", key: "rollNo" },
        { label: "Parent Name", key: "parentName" },
        { label: "Parent Contact", key: "parentContact" },
    ];

    const filteredAndSortedStudents = useMemo(() => {
        return students
            .filter(student =>
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                String(student.rollNo).toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    }, [students, searchQuery, sortOrder]);

    const handleXlsxExport = () => {
        const dataToExport = filteredAndSortedStudents.map(s => ({
            "Student ID": s.studentId, "Name": s.name, "Class": s.class, "Roll No": s.rollNo,
            "Parent Name": s.parentName, "Parent Contact": s.parentContact,
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
            printWindow.document.write('<h1>Students List</h1><table><thead><tr><th>Student ID</th><th>Name</th><th>Class</th><th>Roll No</th><th>Parent Name</th><th>Parent Contact</th></tr></thead><tbody>');
            filteredAndSortedStudents.forEach(s => {
                printWindow.document.write(`<tr><td>${s.studentId}</td><td>${s.name}</td><td>${s.class}</td><td>${s.rollNo}</td><td>${s.parentName}</td><td>${s.parentContact}</td></tr>`);
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
                <AddStudentForm
                    onClose={closeAddModalAndReset}
                    // 'onSuccess' ab naye student ko add karne ke baad 'fetchStudents' call karega
                    // Iske saath hi socket event bhi aayega, jo state ko update karega.
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
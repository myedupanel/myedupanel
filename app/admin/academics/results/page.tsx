"use client";
import React, { useState, useEffect } from 'react';
import styles from './ResultsPage.module.scss';
import { MdAssessment, MdPrint, MdRemoveRedEye } from 'react-icons/md';
import Modal from '@/components/common/Modal/Modal';
import ReportCardDetail, { DetailedReportCard, SchoolInfo } from '@/components/admin/academics/ReportCardDetail';
import api from '@/backend/utils/api'; 

// --- REMOVED MOCK DATA ---

// Type for API response from /exam-structure
type ExamStructure = {
    type: string;
    exams: { id: string; name: string }[];
}[];

// Type for API response from /marks
type MarkResult = {
    studentId: string;
    studentName: string;
    className: string; // Backend se 'className' aata hai
    totalMarks: number;
    maxMarks: number;
    percentage: number;
    result: 'Pass' | 'Fail' | 'N/A'; // N/A aa sakta hai
    marks: { subject: string; score: number; max: number }[]; 
    rollNumber?: string;
    seatNumber?: string;
    attendance?: number;
    remarks?: string;
};

// Use DetailedReportCard for modal state, MarkResult for table state
type ReportData = DetailedReportCard;


const ResultsPage = () => {
    // --- State Management ---
    const [examStructure, setExamStructure] = useState<ExamStructure | null>(null);
    const [selectedExamType, setSelectedExamType] = useState('');
    const [selectedExamId, setSelectedExamId] = useState(''); 
    const [selectedExamName, setSelectedExamName] = useState(''); 
    const [availableClasses, setAvailableClasses] = useState<string[]>([]); 
    const [selectedClass, setSelectedClass] = useState('');
    const [reportData, setReportData] = useState<MarkResult[] | null>(null); 
    const [isLoading, setIsLoading] = useState(true); 
    const [isGenerating, setIsGenerating] = useState(false); 
    const [error, setError] = useState<string | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ReportData | null>(null); 
    const [schoolDetails, setSchoolDetails] = useState<SchoolInfo | null>(null); 

    // --- Fetch Initial Data (Exam Structure, Classes, School Info) ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch in parallel
                const [structureRes, classesRes, schoolRes] = await Promise.all([
                    api.get('/academics/exam-structure'),
                    // Assume an endpoint to get unique class names exists
                    // Replace '/students/classes' with your actual endpoint
                    api.get('/students/classes'),
                    // Assume an endpoint for school info exists
                    // Replace '/school/info' with your actual endpoint
                    api.get('/school/info')
                ]);

                const structureData = structureRes.data as ExamStructure;
                setExamStructure(structureData);
                setAvailableClasses(classesRes.data); 
                setSchoolDetails(schoolRes.data); 

                // Set initial dropdown values if data exists
                if (structureData && structureData.length > 0) {
                    setSelectedExamType(structureData[0].type);
                    if (structureData[0].exams.length > 0) {
                        setSelectedExamId(structureData[0].exams[0].id);
                         setSelectedExamName(structureData[0].exams[0].name);
                    }
                }
                if (classesRes.data && classesRes.data.length > 0) {
                    setSelectedClass(classesRes.data[0]);
                }

            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setError("Could not load necessary data. Please refresh.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // --- Update selected exam when type changes ---
    useEffect(() => {
        if (!examStructure || !selectedExamType) return;

        const currentTypeData = examStructure.find(t => t.type === selectedExamType);
        if (currentTypeData && currentTypeData.exams.length > 0) {
            const firstExam = currentTypeData.exams[0];
             const currentExamStillValid = currentTypeData.exams.some(ex => ex.id === selectedExamId);
             if (!currentExamStillValid) {
                 setSelectedExamId(firstExam.id);
                 setSelectedExamName(firstExam.name);
             }
        } else {
             setSelectedExamId(''); 
             setSelectedExamName('');
        }
    }, [selectedExamType, examStructure, selectedExamId]);


    // --- Handle Report Generation ---
    const handleGenerate = async () => {
        if (!selectedExamId || !selectedClass) {
            alert("Please select both class and exam.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        setReportData(null); 

        try {
            // Fetch marks for the selected exam and class
            const marksRes = await api.get('/academics/marks', {
                params: { examId: selectedExamId, className: selectedClass }
            });
            setReportData(marksRes.data); 

        } catch (err: any) {
            console.error("Failed to generate reports:", err);
            setError(`Could not generate reports: ${err.response?.data?.msg || err.message}`);
            setReportData([]); 
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Handle Viewing Report (Modal) ---
     const handleViewReport = async (result: MarkResult) => {
         
         // FIX: Hum 'result' (MarkResult type) ko 'ReportData' (DetailedReportCard type) mein map kar rahe hain
         const fullReportData: ReportData = {
             ...result, // Saare matching fields copy karein
             
             // Error 1 Fix: 'className' (backend) ko 'class' (component) se map karein
             class: result.className, 
             
             examName: selectedExamName, 
             
             // Error 2 Fix: 'result' ko map karein. Agar 'N/A' hai toh 'Fail' dikhayein.
             result: result.result === 'N/A' ? 'Fail' : result.result,
             
             // Placeholders (inhe aap baad mein backend se fetch kar sakte hain)
             rollNumber: result.rollNumber || 'N/A', 
             seatNumber: result.seatNumber || 'N/A', 
             attendance: result.attendance || 0, 
             remarks: result.remarks || '', 
         };

         setSelectedReport(fullReportData);
         setIsReportModalOpen(true);
     };

    // --- Prepare Dropdown Options ---
    const examTypeOptions = examStructure ? examStructure.map(t => t.type) : [];
    const examsInSelectedType = examStructure?.find(t => t.type === selectedExamType)?.exams || [];

     // --- Loading State ---
     if (isLoading) return <div className={styles.loadingMessage}>Loading Report Card Data...</div>;
     if (error) return <div className={styles.errorMessage}>{error}</div>; 

    return (
        <>
            <div className={styles.pageContainer}>
                <div className={styles.header}>
                    <h1>Results & Report Cards</h1>
                    <p>Generate and view student report cards for selected exams.</p>
                </div>

                {/* Selection Panel */}
                <div className={styles.selectionPanel}>
                    <div className={styles.formGroup}>
                        <label htmlFor="class-select">Select Class</label>
                        <select id="class-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} disabled={availableClasses.length === 0}>
                            {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                            {availableClasses.length === 0 && <option>No classes available</option>}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="exam-type-select">Select Exam Type</label>
                        <select id="exam-type-select" value={selectedExamType} onChange={(e) => setSelectedExamType(e.target.value)} disabled={examTypeOptions.length === 0}>
                            {examTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}
                             {examTypeOptions.length === 0 && <option>No exam types found</option>}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="exam-select">Select Specific Exam</label>
                        <select
                            id="exam-select"
                            value={selectedExamId} 
                            onChange={(e) => {
                                 const selectedId = e.target.value;
                                 const selectedExam = examsInSelectedType.find(ex => ex.id === selectedId);
                                 setSelectedExamId(selectedId);
                                 setSelectedExamName(selectedExam ? selectedExam.name : ''); 
                             }}
                            disabled={examsInSelectedType.length === 0}
                        >
                            {examsInSelectedType.map(exam => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
                            {examsInSelectedType.length === 0 && <option>No exams for this type</option>}
                        </select>
                    </div>
                    <button
                        className={styles.generateButton}
                        onClick={handleGenerate}
                        disabled={isGenerating || !selectedExamId || !selectedClass} 
                    >
                        <MdAssessment /> {isGenerating ? 'Generating...' : 'Generate Reports'}
                    </button>
                </div>

                 {error && !isLoading && <p className={styles.errorMessage}>{error}</p>}

                {/* Results Container */}
                <div className={styles.resultsContainer}>
                    {isGenerating ? (
                         <div className={styles.loadingMessage}>Generating Reports...</div>
                    ) : reportData ? (
                        reportData.length > 0 ? (
                            <table className={styles.resultsTable}>
                                <thead>
                                    <tr><th>Student Name</th><th>Total Marks</th><th>Percentage</th><th>Result</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {reportData.map(result => (
                                        <tr key={result.studentId}>
                                            <td>{result.studentName}</td>
                                            <td>{`${result.totalMarks} / ${result.maxMarks}`}</td>
                                            <td>{result.percentage}%</td>
                                            <td><span className={`${styles.resultBadge} ${result.result === 'Pass' ? styles.pass : styles.fail}`}>{result.result}</span></td>
                                            <td><button className={styles.viewButton} onClick={() => handleViewReport(result)}><MdRemoveRedEye /> View Report</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         ) : (
                              <div className={styles.emptyState}>
                                  <MdPrint size={60} />
                                  <h2>No Results Found</h2>
                                  <p>No marks data found for the selected class and exam.</p>
                              </div>
                         )
                    ) : (
                        <div className={styles.emptyState}>
                            <MdPrint size={60} />
                            <h2>Generate Report Cards</h2>
                            <p>Select a class and exam from the options above and click 'Generate Reports' to see the results.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* FIX: (Error 3) Hum 'schoolInfo' ko check kar rahe hain ki woh 'undefined' na ho */}
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Student Report Card">
                 {/* Hum component ko tabhi render karenge jab 'selectedReport' AUR 'schoolDetails' donon available hon. */}
                 {selectedReport && schoolDetails ? (
                    <ReportCardDetail report={selectedReport} schoolInfo={schoolDetails} />
                 ) : (
                    // Optional: Loading state dikhayein jab tak details load ho rahi hain
                    <div className={styles.loadingMessage}>Loading Report Details...</div>
                 )}
            </Modal>
            {/* === END FIX === */}
        </>
    );
};

export default ResultsPage;
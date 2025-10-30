"use client";
import React, { useState, useEffect } from 'react';
import styles from './ExamSchedulePage.module.scss';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import Modal from '@/components/common/Modal/Modal';
import AddExamForm, { ExamFormData } from '@/components/admin/academics/AddExamForm';
import api from '@/backend/utils/api'; 

// Updated Type to match Backend Exam Model (Yeh Sahi Hai)
type Exam = {
  id: string; 
  name: string; 
  className: string; 
  subject: string;
  date: string; 
  startTime?: string; 
  endTime?: string; 
  maxMarks?: number; 
  minPassMarks?: number; 
  examType?: string; 
};

const ExamSchedulePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null); 

  // Fetch data from API on load
  const fetchExams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/academics/exams'); 
      setExams(response.data);
    } catch (err) {
      console.error("Failed to fetch exams:", err);
      setError("Could not load exam schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []); 

  // Modal handlers
  const handleOpenAddModal = () => {
    setExamToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exam: Exam) => {
    setExamToEdit(exam);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setExamToEdit(null); 
  }

  // --- CRUD Functions Updated with API Calls ---
  
  // FIX 1: handleSave - Form ke 'ExamFormData' ko API ke 'Exam' type mein translate karein
  const handleSave = async (formData: ExamFormData) => {
    handleCloseModal(); 
    
    // Form se aa raha hai: examName, class, time, duration, subject, date
    // API ko chahiye: name, className, startTime, endTime, subject, date, maxMarks, etc.
    
    // Pehle, form se aane waale data ko API format mein map karein
    const apiData = {
      name: formData.examName,
      className: formData.class,
      subject: formData.subject,
      date: formData.date,
      startTime: formData.time,
      endTime: '', // Agar form 'endTime' nahi de raha hai
      examType: examToEdit?.examType || '', // Puraana examType use karein ya default
      maxMarks: examToEdit?.maxMarks || 0, // Puraana maxMarks use karein ya default
      minPassMarks: examToEdit?.minPassMarks || 0, // Puraana minPassMarks use karein ya default
      
      // Agar form se naye fields aa rahe hain, toh unhe seedha use karein
      // (Lekin error ke hisaab se form puraana hai)
    };
    
    try {
      if (examToEdit) {
        // UPDATE: 'apiData' (mapped data) ko bhejein
        const response = await api.put(`/academics/exams/${examToEdit.id}`, apiData);
        setExams(exams.map(exam => exam.id === examToEdit.id ? response.data : exam));
        console.log("Exam updated:", response.data);
      } else {
        // ADD: 'apiData' (mapped data) ko bhejein
        const response = await api.post('/academics/exams', apiData);
        setExams(prevExams => [...prevExams, response.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        console.log("Exam added:", response.data);
      }
    } catch (err: any) {
      console.error("Failed to save exam:", err);
      alert(`Error saving exam: ${err.response?.data?.msg || err.message}`);
      fetchExams(); // Error par data refresh karein
    }
  };

  const handleDeleteExam = async (idToDelete: string) => {
    const examName = exams.find(e => e.id === idToDelete)?.name || 'this exam';
    if (window.confirm(`Are you sure you want to delete "${examName}"?`)) {
      try {
        await api.delete(`/academics/exams/${idToDelete}`);
        setExams(exams.filter(exam => exam.id !== idToDelete));
        console.log("Exam deleted:", idToDelete);
      } catch (err: any) {
        console.error("Failed to delete exam:", err);
        alert(`Error deleting exam: ${err.response?.data?.msg || err.message}`);
         fetchExams();
      }
    }
  };
  // --- END CRUD Updates ---

  if (isLoading) return <div className={styles.loadingMessage}>Loading Exam Schedule...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1>Exam Schedule</h1>
          <button className={styles.addButton} onClick={handleOpenAddModal}>
            <MdAdd /> Add New Exam
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.examTable}>
            <thead>
              <tr>
                <th>Exam Name</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <tr key={exam.id}>
                      <td>{exam.name}</td>
                      <td>{exam.className}</td>
                      <td>{exam.subject}</td>
                      <td>{new Date(exam.date).toLocaleDateString('en-GB')}</td>
                      <td>{exam.startTime || 'N/A'} - {exam.endTime || 'N/Anpm'}</td>
                      <td>{exam.examType || 'N/A'}</td>
                      <td className={styles.actionsCell}>
                          <button className={styles.editButton} onClick={() => handleOpenEditModal(exam)}>
                            <MdEdit />
                          </button>
                          <button className={styles.deleteButton} onClick={() => handleDeleteExam(exam.id)}>
                            <MdDelete />
                          </button>
                      </td>
                  </tr>
                ))
              ) : (
                 <tr><td colSpan={7} className={styles.noDataCell}>No exams scheduled yet. Add one to get started!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === FIX 2: MODAL SECTION UPDATED === */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={examToEdit ? "Edit Exam" : "Add New Exam"}
      >
        <AddExamForm
          onSave={handleSave}
          onClose={handleCloseModal}
          // Hum 'examToEdit' (Exam type) ko 'ExamFormData' type mein badal rahe hain
          // Is object mein SIRF wahi fields honge jo ExamFormData expect karta hai
          initialData={examToEdit ? {
              // Map: Naya Data -> Puraana Data
              examName: examToEdit.name,
              class: examToEdit.className,
              time: examToEdit.startTime || '',
              duration: '', // Duration humare paas nahi hai, toh empty bhejein
              
              // Baaki fields jinka naam same hai (agar form expect karta hai)
              subject: examToEdit.subject,
              date: examToEdit.date ? new Date(examToEdit.date).toISOString().split('T')[0] : '', // Date format fix
              
              // Fields jaise 'maxMarks', 'minPassMarks', 'examType' yahaan NAHI bhejenge
              // kyunki error bata raha hai ki form unhe nahi jaanta.
          } : null}
        />
      </Modal>
      {/* === END FIX === */}
    </>
  );
};

export default ExamSchedulePage;
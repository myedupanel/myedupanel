"use client";
import React,  { useState, useEffect } from 'react';
import styles from './ExamSchedulePage.module.scss';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import Modal from '@/components/common/Modal/Modal';
import AddExamForm, { ExamFormData } from '@/components/admin/academics/AddExamForm';
import { v4 as uuidv4 } from 'uuid';

type Exam = { 
  id: string; 
  examName: string; 
  class: string; 
  subject: string; 
  date: string; 
  time: string; 
  duration: string; 
};

const ExamSchedulePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  // Naya state yeh track karega ki hum kaun sa exam edit kar rahe hain
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);

  useEffect(() => {
    const savedExams = localStorage.getItem('examSchedule');
    if (savedExams && savedExams !== '[]') {
      setExams(JSON.parse(savedExams));
    } else {
      setExams([
        { id: 'E001', examName: 'Mid-Term', class: 'Grade 10', subject: 'Mathematics', date: '2025-10-15', time: '09:00 AM', duration: '3 Hours' },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('examSchedule', JSON.stringify(exams));
  }, [exams]);

  // Modal kholne ke functions
  const handleOpenAddModal = () => {
    setExamToEdit(null); // Edit mode ko off karein
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exam: Exam) => {
    setExamToEdit(exam); // Edit mode on karein aur exam ka data set karein
    setIsModalOpen(true);
  };

  // Save function (Add aur Update, dono ke liye)
  const handleSave = (formData: ExamFormData) => {
    if (examToEdit) {
      // Update logic
      const updatedExams = exams.map(exam => 
        exam.id === examToEdit.id ? { ...exam, ...formData } : exam
      );
      setExams(updatedExams);
    } else {
      // Add logic
      const newExam: Exam = { id: uuidv4(), ...formData };
      setExams(prevExams => [...prevExams, newExam]);
    }
    setIsModalOpen(false);
    setExamToEdit(null);
  };

  const handleDeleteExam = (idToDelete: string) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      const updatedExams = exams.filter(exam => exam.id !== idToDelete);
      setExams(updatedExams);
    }
  };

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
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id}>
                    <td>{exam.examName}</td>
                    <td>{exam.class}</td>
                    <td>{exam.subject}</td>
                    <td>{exam.date}</td>
                    <td>{exam.time}</td>
                    <td>{exam.duration}</td>
                    <td className={styles.actionsCell}>
                        <button className={styles.editButton} onClick={() => handleOpenEditModal(exam)}>
                          <MdEdit />
                        </button>
                        <button className={styles.deleteButton} onClick={() => handleDeleteExam(exam.id)}>
                          <MdDelete />
                        </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={examToEdit ? "Edit Exam" : "Add New Exam"}
      >
        <AddExamForm 
          onSave={handleSave} 
          onClose={() => setIsModalOpen(false)} 
          initialData={examToEdit}
        />
      </Modal>
    </>
  );
};

export default ExamSchedulePage;
"use client";
import React, { useState, useEffect } from 'react';
import styles from './BrainSparkPage.module.scss';
import { MdAdd, MdEdit, MdDelete, MdQuiz, MdLibraryBooks, MdToday } from 'react-icons/md';
import { v4 as uuidv4 } from 'uuid';
import Modal from '@/components/common/Modal/Modal';
import AddQuizForm, { QuizFormData } from '@/components/admin/academics/AddQuizForm';

// Data Structures
type Question = { text: string; options: string[]; correctAnswer: string; };
type Quiz = { id: string; title: string; questions: Question[]; };

const BrainSparkAdminPage = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'library'>('today');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [todaysQuiz, setTodaysQuiz] = useState<Quiz | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<Quiz | null>(null);

  // localStorage se data load karein
  useEffect(() => {
    const savedQuizzes = localStorage.getItem('brainSparkQuizLibrary');
    if (savedQuizzes && savedQuizzes !== '[]') {
      const parsedQuizzes = JSON.parse(savedQuizzes);
      setQuizzes(parsedQuizzes);
    } else {
      const defaultQuiz = [{ id: 'QZ01', title: 'The Solar System', questions: [{ text: "Which is the Red Planet?", options: ["Earth", "Mars", "Jupiter", "Venus"], correctAnswer: "Mars" }] }];
      setQuizzes(defaultQuiz);
    }
    
    const savedTodaysQuizId = localStorage.getItem('todaysManualQuizId');
    if (savedTodaysQuizId) {
        const savedQuizzes = JSON.parse(localStorage.getItem('brainSparkQuizLibrary') || '[]');
        const foundQuiz = savedQuizzes.find((q: Quiz) => q.id === savedTodaysQuizId);
        if(foundQuiz) setTodaysQuiz(foundQuiz);
    }
  }, []);

  // Jab bhi library badle, use save karein
  useEffect(() => {
    if (quizzes.length > 0) {
      localStorage.setItem('brainSparkQuizLibrary', JSON.stringify(quizzes));
    } else {
        localStorage.removeItem('brainSparkQuizLibrary');
    }
  }, [quizzes]);

  // Automatic Quiz Logic
  const displayQuiz = todaysQuiz || (quizzes.length > 0 ? quizzes[0] : null);

  // Modal Handlers
  const handleOpenAddModal = () => { setQuizToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (quiz: Quiz) => { setQuizToEdit(quiz); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setQuizToEdit(null); };

  // CRUD Functions
  const handleSaveQuiz = (formData: QuizFormData) => {
    if (quizToEdit) {
      setQuizzes(quizzes.map(q => q.id === quizToEdit.id ? { ...quizToEdit, ...formData } : q));
    } else {
      setQuizzes(prev => [...prev, { id: uuidv4(), ...formData }]);
    }
    handleCloseModal();
  };

  const handleDeleteQuiz = (id: string) => {
    if (window.confirm("Are you sure you want to delete this quiz from the library?")) {
      setQuizzes(quizzes.filter(q => q.id !== id));
      if(todaysQuiz?.id === id) {
          setTodaysQuiz(null);
          localStorage.removeItem('todaysManualQuizId');
      }
    }
  };

  const setManualQuiz = (quiz: Quiz) => {
    setTodaysQuiz(quiz);
    localStorage.setItem('todaysManualQuizId', quiz.id);
    alert(`"${quiz.title}" has been set as Today's Quiz!`);
    setActiveTab('today');
  };

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1>Brain Spark: Control Panel ✨</h1>
        </div>
        <div className={styles.tabContainer}>
          <button className={`${styles.tabButton} ${activeTab === 'today' ? styles.active : ''}`} onClick={() => setActiveTab('today')}><MdToday /> Today's Activity</button>
          <button className={`${styles.tabButton} ${activeTab === 'library' ? styles.active : ''}`} onClick={() => setActiveTab('library')}><MdLibraryBooks /> Content Library</button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'today' && (
            <div className={styles.todayView}>
              <h2>Today's Live Quiz</h2>
              {displayQuiz ? (
                <div className={styles.activeQuizCard}>
                  <h3>{displayQuiz.title}</h3>
                  <p>{displayQuiz.questions.length} Questions</p>
                  <div className={styles.activeQuizFooter}>
                      <span>{todaysQuiz ? '(Manually Set)' : '(Automatic from Library)'}</span>
                      <button onClick={() => setActiveTab('library')}>Change Quiz</button>
                  </div>
                </div>
              ) : (
                <div className={styles.activeQuizCard} style={{background: '#f1f5f9', color: '#475569'}}>
                    <h3>No Quiz Available</h3>
                    <p>Go to the Content Library to add a new quiz.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <div className={styles.libraryView}>
              <div className={styles.libraryHeader}>
                <h2><MdQuiz /> Quiz Library</h2>
                <button className={styles.addButton} onClick={handleOpenAddModal}><MdAdd /> Add New Quiz</button>
              </div>
              <div className={styles.quizList}>
                {quizzes.map(quiz => (
                  <div key={quiz.id} className={styles.quizItem}>
                    <div className={styles.quizInfo}>
                      <h3 className={styles.quizTitle}>{quiz.title}</h3>
                      <p className={styles.quizMeta}>{quiz.questions.length} Questions</p>
                    </div>
                    <div className={styles.quizActions}>
                      <button onClick={() => setManualQuiz(quiz)}>Set as Today's</button>
                      <button onClick={() => handleOpenEditModal(quiz)}><MdEdit /></button>
                      <button onClick={() => handleDeleteQuiz(quiz.id)}><MdDelete /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={quizToEdit ? "Edit Quiz" : "Add New Quiz"}>
        <AddQuizForm onSave={handleSaveQuiz} initialData={quizToEdit} />
      </Modal>
    </>
  );
};

export default BrainSparkAdminPage;
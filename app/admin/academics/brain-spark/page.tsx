"use client";
import React, { useState, useEffect } from 'react';
import styles from './BrainSparkPage.module.scss';
import { MdAdd, MdEdit, MdDelete, MdQuiz, MdLibraryBooks, MdToday } from 'react-icons/md';
// Removed uuidv4, backend will generate IDs
import Modal from '@/components/common/Modal/Modal';
import AddQuizForm, { QuizFormData } from '@/components/admin/academics/AddQuizForm';
import api from '@/backend/utils/api'; // Import API utility

// Updated Data Structures to match backend
type Question = {
  text: string;
  options: string[];
  correctAnswer: string;
};


type Quiz = {
  id: string; // Changed from id
  title: string;
  questions: Question[];
};

const BrainSparkAdminPage = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'library'>('today');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]); // Library of quizzes
  const [todaysQuiz, setTodaysQuiz] = useState<Quiz | null>(null); // Quiz set for today
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<Quiz | null>(null);

  // --- Fetch data from API on load ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch library and today's quiz in parallel
        const [libraryResponse, todayResponse] = await Promise.all([
          api.get('/quiz/library'),
          api.get('/quiz/today') // This might return null or the quiz object
        ]);
        setQuizzes(libraryResponse.data);
        setTodaysQuiz(todayResponse.data); // Set today's quiz (can be null)
      } catch (err: any) {
        console.error("Failed to load Brain Spark data:", err);
        setError("Could not load quiz data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []); // Run only once on mount

  // --- Removed localStorage useEffect hooks ---

  // Display Logic: Show manually set quiz, otherwise null (backend handles default)
  const displayQuiz = todaysQuiz; // Directly use state which reflects API

  // Modal Handlers (No change needed)
  const handleOpenAddModal = () => { setQuizToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (quiz: Quiz) => { setQuizToEdit(quiz); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setQuizToEdit(null); };

  // --- CRUD Functions Updated with API Calls ---

  const handleSaveQuiz = async (formData: QuizFormData) => {
    try {
      if (quizToEdit) {
        // UPDATE Quiz
        const response = await api.put(`/quiz/library/${quizToEdit.id}`, formData);
        setQuizzes(quizzes.map(q => q.id === quizToEdit.id ? response.data : q));
        // If the edited quiz was today's quiz, update that state too
        if (todaysQuiz?.id === quizToEdit.id) {
            setTodaysQuiz(response.data);
        }
        console.log("Quiz updated:", response.data);
      } else {
        // ADD New Quiz
        const response = await api.post('/quiz/library', formData);
        setQuizzes(prev => [response.data, ...prev]); // Add new quiz to the top
        console.log("Quiz added:", response.data);
      }
      handleCloseModal();
    } catch (err: any) {
      console.error("Failed to save quiz:", err);
      alert(`Error saving quiz: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    // Find the quiz title for confirmation message
    const quizTitle = quizzes.find(q => q.id === id)?.title || 'this quiz';
    if (window.confirm(`Are you sure you want to delete "${quizTitle}" from the library?`)) {
      try {
        await api.delete(`/quiz/library/${id}`);
        setQuizzes(quizzes.filter(q => q.id !== id));
        // If the deleted quiz was today's quiz, clear it from state
        if (todaysQuiz?.id === id) {
          setTodaysQuiz(null);
          // No need to call another API, backend handles unsetting on delete
        }
        console.log("Quiz deleted:", id);
      } catch (err: any) {
        console.error("Failed to delete quiz:", err);
        alert(`Error deleting quiz: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  const setManualQuiz = async (quiz: Quiz) => {
    try {
      // Call API to set this quiz as today's quiz
      await api.put(`/quiz/today/${quiz.id}`);
      setTodaysQuiz(quiz); // Update the state to reflect the change immediately
      alert(`"${quiz.title}" has been set as Today's Quiz!`);
      setActiveTab('today'); // Switch tab
    } catch (err: any) {
       console.error("Failed to set today's quiz:", err);
       alert(`Error setting quiz: ${err.response?.data?.msg || err.message}`);
    }
  };

  // --- Loading and Error States ---
  if (isLoading) return <div className={styles.loadingMessage}>Loading Brain Spark...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;

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
          {/* Today's View - uses displayQuiz */}
          {activeTab === 'today' && (
            <div className={styles.todayView}>
              <h2>Today's Live Quiz</h2>
              {displayQuiz ? (
                <div className={styles.activeQuizCard}>
                  <h3>{displayQuiz.title}</h3>
                  <p>{displayQuiz.questions.length} Questions</p>
                  <div className={styles.activeQuizFooter}>
                      {/* Message is implicitly 'Manually Set' because displayQuiz === todaysQuiz state */}
                      <span>(Currently Active)</span>
                      <button onClick={() => setActiveTab('library')}>Change Quiz</button>
                  </div>
                </div>
              ) : (
                <div className={styles.activeQuizCard} style={{background: '#f1f5f9', color: '#475569'}}>
                    <h3>No Quiz Set for Today</h3>
                    <p>Go to the Content Library to set a quiz.</p>
                </div>
              )}
            </div>
          )}

          {/* Library View - uses quizzes state */}
          {activeTab === 'library' && (
            <div className={styles.libraryView}>
              <div className={styles.libraryHeader}>
                <h2><MdQuiz /> Quiz Library</h2>
                <button className={styles.addButton} onClick={handleOpenAddModal}><MdAdd /> Add New Quiz</button>
              </div>
              <div className={styles.quizList}>
                {quizzes.length > 0 ? (
                  quizzes.map(quiz => (
                   
                    <div key={quiz.id} className={styles.quizItem}>
                      <div className={styles.quizInfo}>
                        <h3 className={styles.quizTitle}>{quiz.title}</h3>
                        <p className={styles.quizMeta}>{quiz.questions.length} Questions</p>
                      </div>
                      <div className={styles.quizActions}>
                        {/* Disable button if this quiz is already set */}
                        <button onClick={() => setManualQuiz(quiz)} disabled={todaysQuiz?.id === quiz.id}>
                          {todaysQuiz?.id === quiz.id ? "Currently Set" : "Set as Today's"}
                        </button>
                        <button onClick={() => handleOpenEditModal(quiz)}><MdEdit /></button>
                        
                        <button onClick={() => handleDeleteQuiz(quiz.id)}><MdDelete /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyLibraryMessage}>Your quiz library is empty. Add a new quiz to get started!</p>
                )}
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
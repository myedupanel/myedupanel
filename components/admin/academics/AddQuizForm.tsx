"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddQuizForm.module.scss';
import { MdAdd, MdDelete } from 'react-icons/md';

// Data Structures
export type Question = {
  text: string;
  options: string[];
  correctAnswer: string;
};
export type QuizFormData = {
  title: string;
  questions: Question[];
};

interface AddQuizFormProps {
  onSave: (data: QuizFormData) => void;
  initialData?: any | null; // Purana data lene ke liye
}

const AddQuizForm = ({ onSave, initialData }: AddQuizFormProps) => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', options: ['', '', '', ''], correctAnswer: '' }
  ]);

  // Yeh useEffect form ko purane data se bharega
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setQuestions(initialData.questions);
    }
  }, [initialData]);

  const handleQuestionChange = (qIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].text = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };
  
  const handleCorrectAnswerChange = (qIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctAnswer = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const removeQuestion = (qIndex: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, index) => index !== qIndex));
    } else {
      alert("A quiz must have at least one question.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, questions });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formBody}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Quiz Title</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        
        {questions.map((q, qIndex) => (
          <div key={qIndex} className={styles.questionBox}>
            <div className={styles.questionHeader}>
              <h4>Question {qIndex + 1}</h4>
              <button type="button" onClick={() => removeQuestion(qIndex)} className={styles.deleteButton}><MdDelete /></button>
            </div>
            <textarea
              placeholder="Enter your question here"
              value={q.text}
              onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
              required
            />
            <div className={styles.optionsGrid}>
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className={styles.optionInput}>
                  <input
                    type="radio"
                    name={`correct-answer-${qIndex}`}
                    value={opt}
                    checked={q.correctAnswer === opt && opt !== ''}
                    onChange={() => handleCorrectAnswerChange(qIndex, opt)}
                    required
                  />
                  <input
                    type="text"
                    placeholder={`Option ${oIndex + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button type="button" onClick={addQuestion} className={styles.addButton}><MdAdd /> Add Another Question</button>
      </div>
      <div className={styles.formFooter}>
        <button type="submit" className={styles.submitButton}>Save Quiz</button>
      </div>
    </form>
  );
};

export default AddQuizForm;
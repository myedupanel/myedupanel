"use client";
import React from 'react';
import styles from './QuizModalContent.module.scss';

// Quiz ka sample data
const quizData = {
  title: "The Solar System",
  questions: [
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Jupiter", "Venus"],
      correctAnswer: "Mars",
    },
    {
      question: "What is the largest planet in our solar system?",
      options: ["Saturn", "Jupiter", "Neptune", "Uranus"],
      correctAnswer: "Jupiter",
    },
    // Aap yahan aur questions add kar sakte hain
  ],
};

const QuizModalContent = () => {
  // Abhi ke liye, hum sirf pehla question dikhayenge
  const currentQuestion = quizData.questions[0];

  return (
    <div className={styles.quizContainer}>
      <div className={styles.quizHeader}>
        <h3>{quizData.title}</h3>
        <p>Question 1 of {quizData.questions.length}</p>
      </div>
      <div className={styles.questionBody}>
        <p className={styles.questionText}>{currentQuestion.question}</p>
        <div className={styles.optionsGrid}>
          {currentQuestion.options.map((option, index) => (
            <button key={index} className={styles.optionButton}>
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.quizFooter}>
        <button className={styles.nextButton}>Next Question</button>
      </div>
    </div>
  );
};

export default QuizModalContent;
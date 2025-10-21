"use client";
import React from 'react';
import styles from './RecentAssignmentsList.module.scss'; // Maan rahe hain ki aapke paas style file hai

// Yeh aapka "real-time" data hai jo database se aayega
const assignmentsData = [
  { id: 1, title: 'Algebra Homework', studentName: 'Aarav Sharma' },
  { id: 2, title: 'History Essay', studentName: 'Priya Patel' },
  { id: 3, title: 'Science Project', studentName: 'Rohan Mehta' },
];

const RecentAssignmentsList = () => {
  return (
    <div className={styles.listContainer}>
      <h3 className={styles.listTitle}>Recent Assignments</h3>
      <ul className={styles.assignmentList}>
        {assignmentsData.map((assignment) => (
          <li key={assignment.id} className={styles.assignmentItem}>
            <span className={styles.title}>{assignment.title}</span>
            <span className={styles.studentName}>{assignment.studentName}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentAssignmentsList;
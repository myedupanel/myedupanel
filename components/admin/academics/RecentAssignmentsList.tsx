"use client";
import React from 'react';
import styles from './RecentAssignmentsList.module.scss';

// Data ko thoda aur "real" banate hain, status aur class ke saath
const assignmentsData = [
  { 
    id: 1, 
    title: 'Algebra Homework', 
    classInfo: 'Grade 10 - Section A', 
    status: 'Graded' 
  },
  { 
    id: 2, 
    title: 'History Essay', 
    classInfo: 'Grade 9 - Section B', 
    status: 'Pending' 
  },
  { 
    id: 3, 
    title: 'Science Project', 
    classInfo: 'Grade 10 - Section A', 
    status: 'Submitted' 
  },
];

const RecentAssignmentsList = () => {
  return (
    <div className={styles.listContainer}>
      {/* Yeh title ab aapke SCSS se match karega */}
      <h3 className={styles.listTitle}>Recent Assignments</h3>
      
      <ul className={styles.assignmentList}>
        {assignmentsData.map((assignment) => (
          <li key={assignment.id} className={styles.assignmentItem}>
            
            {/* Humne title aur class ko ek 'details' div mein daal diya hai */}
            <div className={styles.details}>
              <span className={styles.title}>{assignment.title}</span>
              <span className={styles.classInfo}>{assignment.classInfo}</span>
            </div>
            
            {/* Yeh status badge hai jo dynamic class use karega */}
            <span 
              className={`${styles.status} ${styles[assignment.status.toLowerCase()]}`}
            >
              {assignment.status}
            </span>
            
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentAssignmentsList;
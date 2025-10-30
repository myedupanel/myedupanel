// components/admin/academics/RecentAssignmentsList.tsx

"use client";
import React from 'react';
import styles from './RecentAssignmentsList.module.scss';

// 1. Parent component se mila 'Assignment' interface.
// Yeh batata hai ki data kaisa dikhega.
interface Assignment {
  id: string; // Database se
  title: string;
  classInfo: string;
  status: 'Pending' | 'Submitted' | 'Graded';
}

// 2. Component ke props ka type define karein
interface RecentAssignmentsListProps {
  assignments: Assignment[]; // Hum 'assignments' naam ka ek prop receive karenge
}

// 3. Dummy data array yahaan se poori tarah delete kar diya gaya hai

// 4. Component ab 'assignments' ko prop ke roop mein receive kar raha hai
const RecentAssignmentsList = ({ assignments }: RecentAssignmentsListProps) => {
  return (
    <div className={styles.listContainer}>
      <h3 className={styles.listTitle}>Recent Assignments</h3>
      
      <ul className={styles.assignmentList}>
        
        {/* 5. Check karein ki 'assignments' array mein data hai ya nahi */}
        {assignments.length > 0 ? (

          // 6. Dummy data ki jagah real 'assignments' prop ko map karein
          assignments.map((assignment) => (
            
            // 7. Key ko 'assignment.id' se 'assignment.id' mein badlein
            <li key={assignment.id} className={styles.assignmentItem}>
              
              <div className={styles.details}>
                <span className={styles.title}>{assignment.title}</span>
                <span className={styles.classInfo}>{assignment.classInfo}</span>
              </div>
              
              {/* Yeh status badge ab real data par chalega */}
              <span 
                className={`${styles.status} ${styles[assignment.status.toLowerCase()]}`}
              >
                {assignment.status}
              </span>
              
            </li>
          ))
        ) : (
          // 8. Agar koi assignment na ho toh yeh message dikhayein
          <li className={styles.noAssignmentsMessage}>
            No pending or submitted assignments.
          </li>
        )}
      </ul>
    </div>
  );
};

export default RecentAssignmentsList;
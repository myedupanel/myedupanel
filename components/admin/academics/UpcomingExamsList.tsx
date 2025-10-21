import React from 'react';
import styles from './UpcomingExamsList.module.scss';
import { MdReadMore } from 'react-icons/md';

// Sample data
const exams = [
  { subject: 'Mathematics', class: 'Grade 10', date: 'Oct 08, 2025' },
  { subject: 'Physics', class: 'Grade 10', date: 'Oct 10, 2025' },
  { subject: 'History', class: 'Grade 9', date: 'Oct 11, 2025' },
  { subject: 'Chemistry', class: 'Grade 10', date: 'Oct 13, 2025' },
];

const UpcomingExamsList = () => {
  return (
    <div className={styles.listContainer}>
      <h4>Upcoming Exams</h4>
      <ul className={styles.examList}>
        {exams.map((exam, index) => (
          <li key={index} className={styles.examItem}>
            <div className={styles.dateCircle}>{exam.date.split(' ')[1].replace(',', '')}<span>{exam.date.split(' ')[0]}</span></div>
            <div className={styles.examDetails}>
              <span className={styles.subject}>{exam.subject}</span>
              <span className={styles.classInfo}>{exam.class}</span>
            </div>
          </li>
        ))}
      </ul>
      <a href="/admin/academics/exam-schedule" className={styles.viewAllButton}>
        View All <MdReadMore />
      </a>
    </div>
  );
};

export default UpcomingExamsList;
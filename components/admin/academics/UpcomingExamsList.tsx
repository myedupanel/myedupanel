import React from 'react';
import styles from './UpcomingExamsList.module.scss';
import { MdReadMore } from 'react-icons/md';

// 1. Parent component se mila 'Exam' interface.
// Yeh batata hai ki data kaisa dikhega.
interface Exam {
  id: string;
  subject: string;
  className: string; // 'class' ki jagah 'className'
  date: string; // Yeh ek ISO date string hogi
}

// 2. Component ke props ka type define karein
interface UpcomingExamsListProps {
  exams: Exam[]; // Hum 'exams' naam ka ek prop receive karenge
}

// 3. Date ko format karne ke liye ek helper function
// Input: "2025-10-08T00:00:00.000Z" -> Output: { day: "08", month: "Oct" }
const formatDate = (isoDate: string) => {
  try {
    const dateObj = new Date(isoDate);
    // toLocaleDateString ka istemal karke hum time zone ki samasya se bachte hain
    const day = dateObj.toLocaleDateString('en-GB', { day: '2-digit' }); // '08'
    const month = dateObj.toLocaleDateString('en-GB', { month: 'short' }); // 'Oct'
    return { day, month };
  } catch (error) {
    return { day: '?', month: '?' };
  }
};


// 4. Component ab 'exams' ko prop ke roop mein receive kar raha hai
const UpcomingExamsList = ({ exams }: UpcomingExamsListProps) => {
  
  // 5. Dummy data array yahaan se remove kar diya gaya hai

  return (
    <div className={styles.listContainer}>
      <h4>Upcoming Exams</h4>
      <ul className={styles.examList}>

        {/* 6. Dummy data ki jagah real 'exams' prop ko map karein */}
        {exams.length > 0 ? (
          exams.map((exam) => {
            // 7. Har exam ke liye date format karein
            const formattedDate = formatDate(exam.date);
            
            return (              
              <li key={exam.id} className={styles.examItem}>
                <div className={styles.dateCircle}>
                  {formattedDate.day}
                  <span>{formattedDate.month}</span>
                </div>
                <div className={styles.examDetails}>
                  <span className={styles.subject}>{exam.subject}</span>
                  {/* 9. 'exam.class' ko 'exam.className' karein */}
                  <span className={styles.classInfo}>{exam.className}</span>
                </div>
              </li>
            );
          })
        ) : (
          // 10. Agar koi exam na ho toh message dikhayein
          <li className={styles.noExamsMessage}>
            No upcoming exams found.
          </li>
        )}
      </ul>
      <a href="/admin/academics/exam-schedule" className={styles.viewAllButton}>
        View All <MdReadMore />
      </a>
    </div>
  );
};

export default UpcomingExamsList;
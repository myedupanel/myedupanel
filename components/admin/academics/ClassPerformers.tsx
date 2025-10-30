import React from 'react';
import styles from './ClassPerformers.module.scss';
import { MdTrendingUp, MdTrendingDown } from 'react-icons/md';

// Student ka data lene ke liye
interface Performer {
  name: string;
  averageScore: number;
}

interface ClassPerformersProps {
  top: Performer[];
  bottom: Performer[];
}

const ClassPerformers = ({ top, bottom }: ClassPerformersProps) => {
  return (
    <div className={styles.container}>
      <h3>Class Performers</h3>
      <div className={styles.listsGrid}>
        <div className={styles.listSection}>
          <h4 className={styles.topHeader}><MdTrendingUp /> Top Performers</h4>
          <ul className={styles.performersList}>
            {top.map(student => (
              <li key={student.name}>
                <span>{student.name}</span>
                <span className={styles.topScore}>{student.averageScore}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.listSection}>
          <h4 className={styles.bottomHeader}><MdTrendingDown /> Bottom Performers</h4>
          <ul className={styles.performersList}>
            {bottom.map(student => (
              <li key={student.name}>
                <span>{student.name}</span>
                <span className={styles.bottomScore}>{student.averageScore}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClassPerformers;

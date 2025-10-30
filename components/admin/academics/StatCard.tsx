import React from 'react';
import styles from './StatCard.module.scss';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  title: string;
  theme: 'blue' | 'orange' | 'green'; // Hum alag-alag colors ke liye themes banayenge
}

const StatCard = ({ icon, value, title, theme }: StatCardProps) => {
  return (
    <div className={`${styles.card} ${styles[theme]}`}>
      <div className={styles.iconWrapper}>
        {icon}
      </div>
      <div className={styles.textWrapper}>
        <span className={styles.value}>{value}</span>
        <span className={styles.title}>{title}</span>
      </div>
    </div>
  );
};

export default StatCard;
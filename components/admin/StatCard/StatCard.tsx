import React from 'react';
import styles from './StatCard.module.scss';

// Defines what kind of data the card can accept
interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  title: string;
  theme: 'blue' | 'green' | 'orange' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, title, theme }) => {
  return (
    <div className={`${styles.card} ${styles[theme]}`}>
      <div className={styles.iconWrapper}>
        {icon}
      </div>
      <div className={styles.textWrapper}>
        <p className={styles.value}>{value}</p>
        <p className={styles.title}>{title}</p>
      </div>
    </div>
  );
};

export default StatCard;

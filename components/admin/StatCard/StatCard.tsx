import React from 'react';
import styles from './StatCard.module.scss';

// Defines what kind of data the card can accept
interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  title: string;
  // --- BADLAAV YAHAN HAI ---
  // Humne naye colours 'teal' aur 'sky' ko list mein add kar diya
  theme: 'blue' | 'green' | 'orange' | 'purple' | 'teal' | 'sky';
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, title, theme }) => {
  return (
    // Yeh line ab naye themes (styles[theme]) ko handle kar legi
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
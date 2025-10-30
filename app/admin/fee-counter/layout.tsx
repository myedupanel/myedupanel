import React from 'react';
import FeesSidebar from './FeesSidebar'; // Sidebar component
import styles from './FeesLayout.module.scss'; // Iski styling file

// Yeh layout 'Fees Counter' ke sabhi child pages par apply hoga
export default function FeesLayout({
  children, // 'children' aapka page (jaise Dashboard, Assign Fee, etc.) hoga
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.feesLayoutContainer}>
      {/* Left side mein hamesha FeesSidebar dikhega */}
      <FeesSidebar />
      
      {/* Right side mein aapka page content (children) dikhega */}
      <main className={styles.feesContent}>
        {children}
      </main>
    </div>
  );
}
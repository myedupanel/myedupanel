"use client";

import { createContext, useContext, ReactNode, useState } from 'react';
import { FiZap } from 'react-icons/fi'; // Icon ko yahaan import karein
import styles from '@/app/admin/dashboard/layout.module.scss'; // Style file ko reuse karein

// 1. Context banayein
interface AdminLayoutContextType {
  showUpcomingFeatureModal: () => void;
}

const AdminLayoutContext = createContext<AdminLayoutContextType | undefined>(undefined);

// 2. Custom hook banayein (jise Sidebar use karega)
export const useAdminLayout = () => {
  const context = useContext(AdminLayoutContext);
  if (!context) {
    throw new Error('useAdminLayout must be used within an AdminLayoutProvider');
  }
  return context;
};

// 3. Provider component banayein (jise layout.tsx use karega)
export const AdminLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showUpcomingFeatureModal = () => setIsModalOpen(true);
  const hideModal = () => setIsModalOpen(false);

  return (
    <AdminLayoutContext.Provider value={{ showUpcomingFeatureModal }}>
      {children}

      {/* === YEH HAI AAPKA "UPCOMING FEATURE" MODAL === */}
      {isModalOpen && (
        <div className={styles.upcomingModalOverlay} onClick={hideModal}>
          <div className={styles.upcomingModalBox} onClick={(e) => e.stopPropagation()}>
            <button onClick={hideModal} className={styles.closeButton}>&times;</button>
            <div className={styles.iconWrapper}>
              <FiZap />
            </div>
            <h3>Upcoming Feature!</h3>
            <p>This feature is under construction and will be available soon.</p>
          </div>
        </div>
      )}
      {/* === MODAL ENDS HERE === */}
    </AdminLayoutContext.Provider>
  );
};
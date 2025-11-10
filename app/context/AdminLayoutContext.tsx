"use client";

import { createContext, useContext, ReactNode, useState } from 'react';
import { FiZap } from 'react-icons/fi';
import styles from '@/app/admin/dashboard/layout.module.scss';

// 1. Context banayein
interface AdminLayoutContextType {
  showUpcomingFeatureModal: () => void;
  isSidebarOpen: boolean; // Sidebar ka current state
  toggleSidebar: () => void; // Toggle function
}

const AdminLayoutContext = createContext<AdminLayoutContextType | undefined>(undefined);

// 2. Custom hook banayein
export const useAdminLayout = () => {
  const context = useContext(AdminLayoutContext);
  if (!context) {
    throw new Error('useAdminLayout must be used within an AdminLayoutProvider');
  }
  return context;
};

// 3. Provider component banayein
export const AdminLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Mobile par sidebar ko hamesha close rakhe jab resize ho
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  
  // Naya: Desktop par sidebar hamesha open rahe
  // useEffect(() => {
  //   const handleResize = () => {
  //     if (window.innerWidth > 1024) {
  //       setIsSidebarOpen(true);
  //     } else {
  //       setIsSidebarOpen(false);
  //     }
  //   };
  //   handleResize(); // Initial call
  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);


  const showUpcomingFeatureModal = () => setIsModalOpen(true);
  const hideModal = () => setIsModalOpen(false);

  return (
    <AdminLayoutContext.Provider value={{ showUpcomingFeatureModal, isSidebarOpen, toggleSidebar }}>
      {children}

      {/* === UPCOMING FEATURE MODAL === */}
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
    </AdminLayoutContext.Provider>
  );
};
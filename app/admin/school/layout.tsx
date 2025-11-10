"use client"; 
import React, { createContext, useContext, useState, ReactNode } from 'react';
import styles from './SchoolPage.module.scss';
import SchoolSidebar from '@/app/admin/school/SchoolSidebar';
import { UpcomingFeatureProvider, useUpcomingFeature } from '@/app/context/UpcomingFeatureContext'; 
import Modal from '@/components/common/Modal/Modal';
import { MdFlashOn } from 'react-icons/md';

// === NAYA CODE START: School Layout Context (Definitions, Hooks, and Provider are correct) ===
interface SchoolLayoutContextType {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}
const SchoolLayoutContext = createContext<SchoolLayoutContextType | undefined>(undefined);
export const useSchoolLayout = () => {
    const context = useContext(SchoolLayoutContext);
    if (!context) {
        // Line 21, jahan error aa raha tha.
        throw new Error('useSchoolLayout must be used within a SchoolLayoutProvider');
    }
    return context;
};
const SchoolLayoutProvider = ({ children }: { children: ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    
    return (
        <SchoolLayoutContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
            {children}
        </SchoolLayoutContext.Provider>
    );
};
// === NAYA CODE END ===

// === UPCOMING FEATURE MODAL DEFINITION (Same) ===
const UpcomingFeatureModal = () => {
    const { showModal, setShowModal } = useUpcomingFeature();

    return (
        <Modal 
            isOpen={showModal} 
            onClose={() => setShowModal(false)} 
            title="Upcoming Feature! ✨"
        >
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <MdFlashOn size={48} style={{ color: '#6366F1', marginBottom: '1rem' }} /> 
                <h3 style={{ marginBottom: '0.5rem', color: '#333' }}>Feature Under Construction</h3>
                <p style={{ color: '#666' }}>
                    This feature is under development and will be available soon. 
                </p>
                <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                    Thank you for your patience.
                </p>
            </div>
        </Modal>
    );
};
// =================================================================

// === NAYA COMPONENT: Hook calls aur children ko render karne ke liye ===
const SchoolLayoutContent = ({ children }: { children: React.ReactNode }) => {
    // Hook calls ab yahan andar hain, jo Provider ke children hain.
    const { isSidebarOpen, toggleSidebar } = useSchoolLayout();
    
    return (
        // Main Flex Container
        <div className={styles.container}>
            
            {/* 1. School Sidebar */}
            <SchoolSidebar /> 
            
            {/* 2. Mobile Overlay */}
            {isSidebarOpen && <div className={styles.sidebarOverlay} onClick={toggleSidebar} />}

            {/* 3. Content Area (Renders page.tsx) */}
            <main className={styles.content}>
                {children}
            </main>
            
        </div>
    );
};
// =======================================================================


export default function SchoolLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Yahan sirf Providers render honge. Hook calls Content component ke andar hain.
    return (
        <UpcomingFeatureProvider>
            <SchoolLayoutProvider> {/* PROVIDER */}
                
                {/* NAYA: Content Component ko Provider ke andar wrap kiya */}
                <SchoolLayoutContent>
                    {children}
                </SchoolLayoutContent>
                
                {/* Modal Rendering (Yeh UpcomingFeatureProvider se context leta hai) */}
                <UpcomingFeatureModal /> 

            </SchoolLayoutProvider>
        </UpcomingFeatureProvider>
    );
}
"use client"; 
import React, { ReactNode } from 'react'; 
import styles from './SchoolPage.module.scss';
import SchoolSidebar from '@/app/admin/school/SchoolSidebar';
import Modal from '@/components/common/Modal/Modal';
import { MdFlashOn } from 'react-icons/md';

// CRITICAL FIX: Importing Provider and Hook from the new external context file
import { SchoolLayoutProvider, useSchoolLayout } from '@/app/context/SchoolLayoutContext'; 
import { UpcomingFeatureProvider, useUpcomingFeature } from '@/app/context/UpcomingFeatureContext'; 


// === UPCOMING FEATURE MODAL DEFINITION ===
const UpcomingFeatureModal = () => {
    // Hook call is safe here (inside a component, and Provider is used in export default)
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

// === SchoolLayoutContent (The Visual Shell Component) ===
const SchoolLayoutContent = ({ children }: { children: React.ReactNode }) => {
    // Hook call is safe here, consuming the context provided in the final export
    const { isSidebarOpen, toggleSidebar } = useSchoolLayout(); 
    
    return (
        <div className={styles.container}>
            
            <SchoolSidebar /> 
            
            {/* Mobile Overlay is conditional based on context */}
            {isSidebarOpen && <div className={styles.sidebarOverlay} onClick={toggleSidebar} />}

            <main className={styles.content}>
                {children}
            </main>
            
        </div>
    );
};
// =======================================================================


// === 🏆 FINAL EXPORT: The only part Next.js recognizes ===
export default function SchoolLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // This is the only place we use the Provider components to wrap the content
    return (
        <UpcomingFeatureProvider>
            <SchoolLayoutProvider> {/* Imported from the new context file */}
                
                <SchoolLayoutContent>
                    {children}
                </SchoolLayoutContent>
                
                <UpcomingFeatureModal /> 

            </SchoolLayoutProvider>
        </UpcomingFeatureProvider>
    );
}
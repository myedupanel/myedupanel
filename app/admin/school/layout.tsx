"use client"; 
import React, { useState, createContext, useContext, ReactNode } from 'react'; // Context-related imports kept
import styles from './SchoolPage.module.scss';
import SchoolSidebar from '@/app/admin/school/SchoolSidebar';
// मान रहे हैं कि ये दोनों context files मौजूद हैं, इसलिए उन्हें import किया गया है
import { UpcomingFeatureProvider, useUpcomingFeature } from '@/app/context/UpcomingFeatureContext'; 

// === 🛑 IMPORTANT: Context Definitions are MOVED or ASSUMED EXTERNAL 🛑 ===
// (Aapko yeh definitions ab yahan se hataakar 'app/context/SchoolLayoutContext.tsx' mein daalni hongi)

// CRITICAL FIX: To fix the build error, we define the minimal provider/hook structure here.
// Ideal way is to put this in 'app/context/SchoolLayoutContext.tsx'
interface SchoolLayoutContextType { isSidebarOpen: boolean; toggleSidebar: () => void; }
const SchoolLayoutContext = createContext<SchoolLayoutContextType | undefined>(undefined);
const SchoolLayoutProvider = ({ children }: { children: ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    
    return (
        <SchoolLayoutContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
            {children}
        </SchoolLayoutContext.Provider>
    );
};
export const useSchoolLayout = () => useContext(SchoolLayoutContext)!; // Hook for internal use.
// =======================================================================


// === UPCOMING FEATURE MODAL DEFINITION (Same) ===
const UpcomingFeatureModal = () => {
    // CRITICAL FIX: useUpcomingFeature hook call MUST be inside a component 
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

// === SchoolLayoutContent (Hook calls aur children ko render karne ke liye) ===
const SchoolLayoutContent = ({ children }: { children: React.ReactNode }) => {
    // FIX: Hook call inside the component wrapped by the provider
    const { isSidebarOpen, toggleSidebar } = useSchoolLayout(); 
    
    return (
        <div className={styles.container}>
            
            <SchoolSidebar /> 
            
            {/* FIX: Conditional rendering of overlay */}
            {isSidebarOpen && <div className={styles.sidebarOverlay} onClick={toggleSidebar} />}

            <main className={styles.content}>
                {children}
            </main>
            
        </div>
    );
};
// =======================================================================


import Modal from '@/components/common/Modal/Modal';
import { MdFlashOn } from 'react-icons/md';


// === 🏆 FINAL EXPORT: Only the Provider Wrapper ===
export default function SchoolLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Yahan sirf Providers render honge.
    return (
        <UpcomingFeatureProvider>
            <SchoolLayoutProvider> {/* School Layout Provider */}
                
                {/* SchoolLayoutContent is now the visual shell */}
                <SchoolLayoutContent>
                    {children}
                </SchoolLayoutContent>
                
                {/* Modal Rendering */}
                <UpcomingFeatureModal /> 

            </SchoolLayoutProvider>
        </UpcomingFeatureProvider>
    );
}
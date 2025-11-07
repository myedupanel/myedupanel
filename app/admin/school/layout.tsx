// File: app/admin/school/layout.tsx
"use client"; // Client-side logic ke liye zaroori

import React from 'react';
// मौजूदा AdminLayout के styles को import करें 
import styles from './SchoolPage.module.scss';
// SchoolSidebar कंपोनेंट को import करें
import SchoolSidebar from '@/app/admin/school/SchoolSidebar'; 
// === NEW CONTEXT IMPORTS ===
import { UpcomingFeatureProvider, useUpcomingFeature } from '@/app/context/UpcomingFeatureContext';
import Modal from '@/components/common/Modal/Modal';
import { MdFlashOn } from 'react-icons/md';


// === UPCOMING FEATURE MODAL DEFINITION (Yahan define kiya gaya) ===
const UpcomingFeatureModal = () => {
    // Context hook is used here to get state
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
                    We are working hard to bring you the best experience!
                </p>
                <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                    Thank you for your patience.
                </p>
            </div>
        </Modal>
    );
};
// =================================================================

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    // === WRAPPING WITH PROVIDER ===
    // Provider Sidebar aur children (page.tsx) dono ko wrap karta hai
    <UpcomingFeatureProvider>
        
        {/* Main Flex Container */}
        <div className={styles.container}>
            
            {/* 1. School Sidebar */}
            <SchoolSidebar /> 
            
            {/* 2. Content Area (Renders page.tsx) */}
            <main className={styles.content}>
                {children}
            </main>
            
        </div>
        
        {/* 3. Modal Rendering: यह Provider के अंदर कहीं भी render हो सकता है */}
        <UpcomingFeatureModal /> 

    </UpcomingFeatureProvider>
  );
}
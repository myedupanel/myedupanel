"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SchoolLayoutContextType {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

const SchoolLayoutContext = createContext<SchoolLayoutContextType | undefined>(undefined);

// Hook definition (Exported for use in Sidebar/Content)
export const useSchoolLayout = () => {
    const context = useContext(SchoolLayoutContext);
    if (!context) {
        throw new Error('useSchoolLayout must be used within a SchoolLayoutProvider');
    }
    return context;
};

// Provider definition (Exported for use in layout.tsx)
export const SchoolLayoutProvider = ({ children }: { children: ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    
    return (
        <SchoolLayoutContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
            {children}
        </SchoolLayoutContext.Provider>
    );
};
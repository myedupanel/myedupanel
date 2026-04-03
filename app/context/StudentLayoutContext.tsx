// app/context/StudentLayoutContext.tsx

import React, { useState, createContext, useContext, ReactNode } from 'react';

// === Student Layout Context ===
interface StudentLayoutContextType {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

// 1. Context Creation
const StudentLayoutContext = createContext<StudentLayoutContextType | undefined>(undefined);

// 2. Custom Hook
export const useStudentLayout = () => {
    const context = useContext(StudentLayoutContext);
    if (!context) {
        throw new Error('useStudentLayout must be used within a StudentLayoutProvider');
    }
    return context;
};

// 3. Provider Component
export const StudentLayoutProvider = ({ children }: { children: ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // State management and logic for the context
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    
    return (
        <StudentLayoutContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
            {children}
        </StudentLayoutContext.Provider>
    );
};
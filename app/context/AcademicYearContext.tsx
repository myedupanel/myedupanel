// src/app/context/AcademicYearContext.tsx

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Academic Year ke structure ke liye TypeScript Interface
interface AcademicYear {
    id: number;
    yearName: string; // e.g., "2024-2025"
    isCurrent: boolean;
}

// Context ke andar ki state aur functions
interface AcademicYearContextType {
    currentYearId: number | null;
    currentYearName: string | null;
    availableYears: AcademicYear[];
    loading: boolean;
    error: string | null;
    switchAcademicYear: (yearId: number, setAsDefault: boolean) => Promise<void>;
}

// Context Initialization (Default values)
const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export const AcademicYearProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const router = useRouter();
    const [currentYearId, setCurrentYearId] = useState<number | null>(null);
    const [currentYearName, setCurrentYearName] = useState<string | null>(null);
    const [availableYears, setAvailableYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial data fetch: Saare years aur current active year ID
    const fetchYears = useCallback(async () => {
        setLoading(true);
        try {
            // Backend API se years fetch karo
            const response = await fetch('/api/admin/academic-year');
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch academic years.');
            }
            
            const years: AcademicYear[] = await response.json();
            setAvailableYears(years);

            // Active year find karo (jo isCurrent true hai)
            const activeYear = years.find(y => y.isCurrent) || years[0]; 
            
            if (activeYear) {
                setCurrentYearId(activeYear.id);
                setCurrentYearName(activeYear.yearName);
            }

        } catch (err: any) {
            console.error("Error fetching years:", err);
            setError(err.message || "Could not load Academic Years. Please check the connection.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Year Switcher Logic
    const switchAcademicYear = useCallback(async (yearId: number, setAsDefault: boolean = false) => {
        setLoading(true);
        try {
            // Humari backend API: /api/admin/switch-year/route.js (POST)
            const response = await fetch('/api/admin/switch-year', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newAcademicYearId: yearId, setAsDefault }),
            });
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to switch academic year.');
            }
            
            // Context State Update
            const newActiveYear = availableYears.find(y => y.id === yearId);
            if (newActiveYear) {
                setCurrentYearId(newActiveYear.id);
                setCurrentYearName(newActiveYear.yearName);
            }

            // CRITICAL STEP: Pura dashboard data refresh karna taki naye cookie se data filter ho
            router.refresh(); 

        } catch (err: any) {
            console.error("Error switching year:", err);
            setError("Switch failed: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [availableYears, router]);

    useEffect(() => {
        fetchYears();
    }, [fetchYears]);

    const contextValue = {
        currentYearId,
        currentYearName,
        availableYears,
        loading,
        error,
        switchAcademicYear,
    };

    return (
        <AcademicYearContext.Provider value={contextValue}>
            {children}
        </AcademicYearContext.Provider>
    );
};

// Custom Hook to use the context easily
export const useAcademicYear = () => {
    const context = useContext(AcademicYearContext);
    if (!context) {
        throw new Error('useAcademicYear must be used within an AcademicYearProvider');
    }
    return context;
};
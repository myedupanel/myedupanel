// src/app/context/AcademicYearContext.tsx

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/backend/utils/api';

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

    // Optimized fetch: Only fetch essential data for faster loading
    const fetchYears = useCallback(async () => {
        setLoading(true);
        // Add timeout to prevent indefinite loading
        const timeoutId = setTimeout(() => {
            setLoading(false);
            setError("Loading timeout - please refresh the page");
        }, 10000); // 10 seconds timeout
        
        try {
            // Check if token exists in localStorage
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('No token found, skipping academic year fetch');
                    setAvailableYears([]);
                    clearTimeout(timeoutId);
                    setLoading(false);
                    return;
                }
            }

            // Use centralized API utility - it handles token automatically
            // Optimized: Only fetch what we need for the dropdown
            const response = await api.get('/academic-years');
            const years: AcademicYear[] = response.data;
            
            setAvailableYears(years);

            // Active year find karo (jo isCurrent true hai)
            const activeYear = years.find(y => y.isCurrent) || years[0]; 
            
            if (activeYear) {
                setCurrentYearId(activeYear.id);
                setCurrentYearName(activeYear.yearName);
            } else {
                // If no years exist, set to null
                setCurrentYearId(null);
                setCurrentYearName(null);
            }

        } catch (err: any) {
            console.error("Error fetching years:", err);
            setError(err.response?.data?.error || err.message || "Could not load Academic Years.");
            // Even if there's an error, we should stop loading to show the page
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    }, []);

    // Year Switcher Logic with improved error handling
    const switchAcademicYear = useCallback(async (yearId: number, setAsDefault: boolean = false) => {
        try {
            // If setAsDefault is true, update backend
            if (setAsDefault) {
                await api.post('/academic-years/set-current', { yearId });
            }
            
            // Set cookie for selected year (client-side)
            if (typeof window !== 'undefined') {
                document.cookie = `academicYearId=${yearId}; path=/; max-age=${30 * 24 * 60 * 60}`;
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
            setError(err.response?.data?.error || err.message || "Failed to switch year");
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
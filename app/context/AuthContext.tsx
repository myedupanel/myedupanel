"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
// FIX: Use our configured API instance instead of default axios
import api from '../../backend/utils/api';

export interface User { 
  id: number;
  name: string;        
  schoolName: string;  
  role: string;
  email: string;
  schoolId: string;
  schoolNameLastUpdated?: string; 
  
  // === YEH FIELDS ADD KIYE HAIN ===
  plan: string;                 // (e.g., 'TRIAL', 'STARTER', 'NONE')
  planExpiryDate: string | null;  // (ISO date string)
  // ===================================
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true

  useEffect(() => {
    const loadUserFromToken = async () => {
      const storedToken = localStorage.getItem('token');

      if (!storedToken) {
        setIsLoading(false);
        return; // Exit early if no token
      }

      setToken(storedToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      try {
        // FIX: Use our configured api instance instead of default axios
        const response = await api.get('/auth/me');
        // Fetched data should match the exported User interface
        // Naye fields (plan, planExpiryDate) yahaan automatically aa jayenge
        setUser(response.data);
      } catch (error: any) {
        console.error("Failed to fetch user from token:", error.response?.status, error.message);
        // Only logout on 401 errors, not on network errors
        if (error.response?.status === 401) {
          logout(); // Call logout which handles cleanup and redirect
        } else {
          // For network errors, we should still set the user as null but not redirect
          setUser(null);
        }
      } finally {
        // Always set loading to false to prevent the app from being stuck
        setIsLoading(false);
      }
    };

    loadUserFromToken();
    // Intentionally only running on mount, logout dependency removed
    // to prevent potential loops if logout clears state causing re-renders.
  }, []); // Empty dependency array: runs only once on mount

  // Login function
  const login = async (newToken: string): Promise<User | null> => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    // Note: We don't set isLoading to true here anymore to prevent flickering
    // The login page will handle its own loading state
    try {
      // API response should match the exported User interface
      // FIX: Use our configured api instance instead of default axios
      const response = await api.get('/auth/me');
      // Naye fields yahaan bhi automatically aa jayenge
      setUser(response.data);
      // We don't set isLoading to false here either
      return response.data;
    } catch (error) {
      console.error("Login failed: could not fetch user", error);
      // Clean up on failure but don't redirect immediately
      localStorage.removeItem('token');
      setToken(null);
      delete api.defaults.headers.common['Authorization'];
      // isLoading will be handled by the calling component
      return null;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    setIsLoading(false); // Ensure loading is false
    // Redirect happens here
    window.location.href = '/login';
  };

  // Provide the context value
  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, token, login, logout, isLoading }}>
      {/* Render children only when loading is complete */}
      {!isLoading ? children : null /* Or a loading spinner */}
    </AuthContext.Provider>
  );
};

// useAuth hook remains the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
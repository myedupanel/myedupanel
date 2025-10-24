// File: app/context/AuthContext.tsx

"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

// --- FIX IS HERE: Updated User interface ---
interface User {
  _id: string;
  name: string; // Changed from adminName
  schoolName: string;
  role: string;
  email: string;
}
// --- End of FIX ---

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
        return;
      }

      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      try {
        const response = await axios.get('/api/auth/me');
        setUser(response.data); // Fetched data should now match the updated User interface
      } catch (error: any) {
        console.error("Failed to fetch user from token:", error.response?.status, error.message);
        if (error.response && error.response.status === 401) {
          console.log("Token expired or invalid. Logging out.");
          logout();
        } else {
          logout();
        }
      } finally {
         // Only set loading false if we didn't logout (which causes redirect)
         if (localStorage.getItem('token')) {
             setIsLoading(false);
         }
      }
    };

    loadUserFromToken();
  }, []); // Runs once on component mount

  // Login function remains the same
  const login = async (newToken: string): Promise<User | null> => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    try {
      // API response should now match the updated User interface
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
      setIsLoading(false);
      return response.data;
    } catch (error) {
      console.error("Login failed: could not fetch user", error);
      logout();
      return null;
    }
  };

  // Logout function remains the same
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    setIsLoading(false);
    // Redirect happens here, so isLoading state might not visually matter immediately
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, token, login, logout, isLoading }}>
      {/* Render children only when loading is complete */}
      {!isLoading && children}
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
// File: app/context/AuthContext.tsx

"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Updated User interface
interface User {
  _id: string;
  adminName: string;
  schoolName: string;
  role: string;
  email: string;
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

  // --- THIS useEffect IS UPDATED ---
  useEffect(() => {
    const loadUserFromToken = async () => {
      const storedToken = localStorage.getItem('token');

      // --- FIX: Handle missing token case ---
      if (!storedToken) {
        // If no token is found, we know the user is not logged in.
        // Don't try to fetch user data.
        setIsLoading(false); // Stop loading
        // NOTE: We don't call logout() here because that forces a redirect.
        // The redirect should be handled by protected route logic
        // based on isAuthenticated being false.
        return; // Exit the function early
      }

      // If token exists, proceed to verify it
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      try {
        const response = await axios.get('http://localhost:5000/api/auth/me');
        setUser(response.data);
      } catch (error: any) {
        console.error("Failed to fetch user from token:", error.response?.status, error.message);
        // If token exists but is invalid/expired (401) or other error occurs
        if (error.response && error.response.status === 401) {
          console.log("Token expired or invalid. Logging out.");
          logout(); // Call logout which handles cleanup and redirect
        } else {
          // Handle other potential errors (like network issues) by logging out too
          logout();
        }
      } finally {
        // Ensure loading is set to false whether the API call succeeds or fails
        // (unless logout() was called, which redirects anyway)
         if (localStorage.getItem('token')) { // Check if token still exists (logout removes it)
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
      const response = await axios.get('http://localhost:5000/api/auth/me');
      setUser(response.data);
      setIsLoading(false); // Ensure loading is false after successful login fetch
      return response.data;
    } catch (error) {
      console.error("Login failed: could not fetch user", error);
      logout(); // Clean up on failure
      return null;
    }
  };

  // Logout function remains the same
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    setIsLoading(false); // Make sure loading is false after logout
    window.location.href = '/login'; // Redirect
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
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
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (show: boolean) => void;
  subscriptionModalType: 'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED' | 'SUBSCRIPTION_WARNING' | null;
  daysUntilExpiration: number | null;
  handleSubscriptionModalAction: (action: 'UPGRADE' | 'CANCEL') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalType, setSubscriptionModalType] = useState<'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED' | 'SUBSCRIPTION_WARNING' | null>(null);
  const [daysUntilExpiration, setDaysUntilExpiration] = useState<number | null>(null);

  // Check if plan is expired or expiring soon
  const checkPlanStatus = (user: User) => {
    if (!user.planExpiryDate) return;

    const expiryDate = new Date(user.planExpiryDate);
    const today = new Date();
    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Check if trial has expired (TRIAL plan after 14 days)
    if (user.plan === 'TRIAL' && daysLeft <= 0) {
      setSubscriptionModalType('TRIAL_EXPIRED');
      setDaysUntilExpiration(daysLeft);
      setShowSubscriptionModal(true);
    }
    // Check if subscription has expired (STARTER/PRO plan after 365 days)
    else if ((user.plan === 'STARTER' || user.plan === 'PRO') && daysLeft <= 0) {
      setSubscriptionModalType('SUBSCRIPTION_EXPIRED');
      setDaysUntilExpiration(daysLeft);
      setShowSubscriptionModal(true);
    }
    // Check if trial is about to expire (show warning when 3 days left)
    else if (user.plan === 'TRIAL' && daysLeft <= 3 && daysLeft > 0) {
      setSubscriptionModalType('SUBSCRIPTION_WARNING');
      setDaysUntilExpiration(daysLeft);
      setShowSubscriptionModal(true);
    }
    // Check if subscription is about to expire (12 days warning)
    else if ((user.plan === 'STARTER' || user.plan === 'PRO') && daysLeft <= 12 && daysLeft > 0) {
      setSubscriptionModalType('SUBSCRIPTION_WARNING');
      setDaysUntilExpiration(daysLeft);
      setShowSubscriptionModal(true);
    }
  };

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
        const userData = response.data;
        setUser(userData);
        
        // Check plan status after loading user data
        checkPlanStatus(userData);
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
  }, []);

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
      const userData = response.data;
      setUser(userData);
      
      // Check plan status after login
      checkPlanStatus(userData);
      
      setIsLoading(false); // Set loading false after fetching
      return userData;
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

  // Handle subscription modal actions
  const handleSubscriptionModalAction = (action: 'UPGRADE' | 'CANCEL') => {
    if (action === 'UPGRADE') {
      // Close modal and redirect to upgrade page
      setShowSubscriptionModal(false);
      window.location.href = '/upgrade';
    } else if (action === 'CANCEL') {
      // Close modal and logout user
      setShowSubscriptionModal(false);
      logout();
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
    <AuthContext.Provider value={{ 
      isAuthenticated: !!user, 
      user, 
      token, 
      login, 
      logout, 
      isLoading,
      showSubscriptionModal,
      setShowSubscriptionModal,
      subscriptionModalType,
      daysUntilExpiration,
      handleSubscriptionModalAction
    }}>
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
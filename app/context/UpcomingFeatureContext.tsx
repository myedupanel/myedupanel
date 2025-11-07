"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. Define the shape of the Context data
interface UpcomingFeatureContextType {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  triggerModal: () => void; // Function to call from sidebar
}

// 2. Create the Context with a default, non-null shape
const UpcomingFeatureContext = createContext<UpcomingFeatureContextType | undefined>(undefined);

// Custom hook to use the context easily
export const useUpcomingFeature = () => {
  const context = useContext(UpcomingFeatureContext);
  if (context === undefined) {
    throw new Error('useUpcomingFeature must be used within an UpcomingFeatureProvider');
  }
  return context;
};

// 3. Create the Provider Component
interface UpcomingFeatureProviderProps {
  children: ReactNode;
}

export const UpcomingFeatureProvider: React.FC<UpcomingFeatureProviderProps> = ({ children }) => {
  const [showModal, setShowModal] = useState(false);

  const triggerModal = () => {
    setShowModal(true);
  };

  const value = {
    showModal,
    setShowModal,
    triggerModal,
  };

  return (
    <UpcomingFeatureContext.Provider value={value}>
      {children}
    </UpcomingFeatureContext.Provider>
  );
};
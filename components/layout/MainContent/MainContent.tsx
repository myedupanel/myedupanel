// file: components/layout/MainContent/MainContent.tsx
import React from 'react';
import './MainContent.scss';

const MainContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="main-content-container">
      {children}
    </main>
  );
};

export default MainContent;
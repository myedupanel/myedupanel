// File: components/layout/Header/Header.tsx

import React from 'react';
import './Header.scss';
import PlanStatusBadge from '../PlanStatusBadge'; // Import the badge (relative path)

const Header = () => {
  return (
    <header className="header-container">
      
      {/* 1. Logo/Title Area */}
      <div className="header-logo">
        MyEduPanel
      </div>
      
      {/* 2. Plan Status Badge (Centered or aligned) */}
      <div className="header-plan-status">
        <PlanStatusBadge />
      </div>
      
      {/* 3. User Menu Area */}
      <div className="header-user-menu">
        {/* Your user profile icon, name, etc. */}
      </div>
    </header>
  );
};

export default Header;
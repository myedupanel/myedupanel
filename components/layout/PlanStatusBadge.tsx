// File: components/layout/PlanStatusBadge.tsx (UPDATED with SuperAdmin Check)

"use client";

import React from 'react';
import { useAuth } from '@/app/context/AuthContext'; 
import styles from './PlanStatusBadge.module.scss'; 
import { useRouter } from 'next/navigation'; 

// Helper function to calculate days left (No Change)
const getDaysLeft = (expiryDate: string | null): number | null => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const PlanStatusBadge = () => {
  const { user } = useAuth(); 
  const router = useRouter(); 

  // FIX 1: SuperAdmin Check
  if (!user || user.role === 'SuperAdmin') {
    return null; 
  }
  
  // FIX 2: Subscription data available hai ya nahi check karein
  if (!user.plan) {
    return null; 
  }

  const { plan, planExpiryDate } = user;
  const daysLeft = getDaysLeft(planExpiryDate);

  // Badge ka logic
  let badgeText = '';
  let badgeClass = '';
  let icon = null;

  if (plan === 'TRIAL') {
    if (daysLeft !== null && daysLeft > 0) {
      badgeText = `Trial: ${daysLeft} Days Left`;
      badgeClass = styles.trial; 
      icon = '⚡';
    } else {
      badgeText = 'Trial Ended'; 
      badgeClass = styles.expired;
      icon = '⚠️';
    }
  } else if (plan === 'STARTER') {
    if (daysLeft !== null && daysLeft <= 14 && daysLeft >= 0) {
      // 14 days ya usse kam bache hon
      badgeText = `Expires in ${daysLeft} Days`; 
      badgeClass = styles.expiring; 
      icon = '⚠️';
    } else if (daysLeft !== null && daysLeft < 0) {
      // Expiry date nikal chuki ho
      badgeText = 'Plan Expired';
      badgeClass = styles.expired; 
      icon = '❌';
    } else {
      badgeText = 'Starter Plan';
      badgeClass = styles.starter; 
      icon = '✓';
    }
  } else {
    // Other valid plans (e.g., PREMIUM)
    badgeText = `${plan} Plan`;
    badgeClass = styles.starter; 
    icon = '✓';
  }
  
  // Button kab dikhana hai
  const showUpgradeButton = 
    plan === 'TRIAL' || 
    plan === 'NONE' || // Agar plan set nahi hai
    (plan === 'STARTER' && daysLeft !== null && daysLeft <= 14); 

  // Button text
  const upgradeButtonText = plan === 'STARTER' ? 'Manage Plan' : 'Upgrade';

  // Button click par /upgrade page par bhejo
  const handleUpgradeClick = () => {
    router.push('/upgrade');
  };

  // Final rendering
  return (
    <div className={styles.badgeContainer}>
      {/* 1. Hamara Puraana Badge */}
      <div className={`${styles.planBadge} ${badgeClass}`}>
        {icon && <span style={{ marginRight: '6px' }}>{icon}</span>}
        {badgeText}
      </div>

      {/* 2. Hamara Naya "Eye-Catching" Button */}
      {showUpgradeButton && (
        <button className={styles.upgradeButton} onClick={handleUpgradeClick}>
          {upgradeButtonText}
        </button>
      )}
    </div>
  );
};

export default PlanStatusBadge;
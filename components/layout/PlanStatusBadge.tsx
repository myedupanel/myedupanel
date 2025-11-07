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

  if (plan === 'TRIAL') {
    if (daysLeft !== null && daysLeft > 0) {
      badgeText = `⏳ Trial: ${daysLeft} Days Left`;
      badgeClass = styles.trial; 
    } else {
      badgeText = 'Trial Ended'; 
      badgeClass = styles.expired;
    }
  } else if (plan === 'STARTER') {
    if (daysLeft !== null && daysLeft <= 14 && daysLeft >= 0) {
      // 14 days ya usse kam bache hon
      badgeText = `⚠️ Expires in ${daysLeft} Days`; 
      badgeClass = styles.expiring; 
    } else if (daysLeft !== null && daysLeft < 0) {
      // Expiry date nikal chuki ho
      badgeText = 'Plan Expired';
      badgeClass = styles.expired; 
    } else {
      badgeText = '✓ Starter Plan';
      badgeClass = styles.starter; 
    }
  } else {
    // Other valid plans (e.g., PREMIUM)
    badgeText = `✓ ${plan} Plan`;
    badgeClass = styles.starter; 
  }
  
  // Button kab dikhana hai
  const showUpgradeButton = 
    plan === 'TRIAL' || 
    plan === 'NONE' || // Agar plan set nahi hai
    (plan === 'STARTER' && daysLeft !== null && daysLeft <= 14); 

  // Button click par /upgrade page par bhejo
  const handleUpgradeClick = () => {
    router.push('/upgrade');
  };

  // Final rendering
  return (
    <div className={styles.badgeContainer}>
      {/* 1. Hamara Puraana Badge */}
      <div className={`${styles.planBadge} ${badgeClass}`}>
        {badgeText}
      </div>

      {/* 2. Hamara Naya "Eye-Catching" Button */}
      {showUpgradeButton && (
        <button className={styles.upgradeButton} onClick={handleUpgradeClick}>
          Upgrade
        </button>
      )}
    </div>
  );
};

export default PlanStatusBadge;
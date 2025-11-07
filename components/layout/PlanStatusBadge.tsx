// File: components/layout/PlanStatusBadge.tsx (UPDATED)

"use client";

import React from 'react';
import { useAuth } from '@/app/context/AuthContext'; // !! Path check karein
import styles from './PlanStatusBadge.module.scss'; 
import { useRouter } from 'next/navigation'; // <-- NAYA IMPORT

// Helper function to calculate days left (Bina Badlaav)
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
  const router = useRouter(); // <-- NAYA HOOK

  if (!user || !user.plan) {
    return null; 
  }

  const { plan, planExpiryDate } = user;
  const daysLeft = getDaysLeft(planExpiryDate);

  // Badge ka logic (Bina Badlaav)
  let badgeText = '';
  let badgeClass = '';

  if (plan === 'TRIAL') {
    if (daysLeft !== null && daysLeft > 0) {
      badgeText = `⏳ Trial: ${daysLeft} Days Left`;
      badgeClass = styles.trial; 
    } else {
      badgeText = 'Trial Ended'; // Text chhota kar diya
      badgeClass = styles.expired;
    }
  } else if (plan === 'STARTER') {
    if (daysLeft !== null && daysLeft <= 14) {
      badgeText = `⚠️ Expires in ${daysLeft} Days`; // Text chhota kar diya
      badgeClass = styles.expiring; 
    } else {
      badgeText = '✓ Starter Plan';
      badgeClass = styles.starter; 
    }
  } else {
    return null;
  }
  
  // === NAYA LOGIC: Button kab dikhana hai? ===
  const showUpgradeButton = 
    plan === 'TRIAL' || // Trial par hamesha dikhao
    (plan === 'STARTER' && daysLeft !== null && daysLeft <= 14); // Ya jab plan expire ho raha ho

  // Button click par /upgrade page par bhejo
  const handleUpgradeClick = () => {
    router.push('/upgrade');
  };

  // === NAYA RETURN: Ab ek container mein dono cheezein hain ===
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
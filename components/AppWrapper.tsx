// components/AppWrapper.tsx
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import SubscriptionExpirationModal from '@/components/common/SubscriptionExpirationModal';

const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    showSubscriptionModal,
    setShowSubscriptionModal,
    subscriptionModalType,
    daysUntilExpiration,
    handleSubscriptionModalAction
  } = useAuth();

  // Determine modal props based on subscriptionModalType
  const getModalProps = () => {
    if (!subscriptionModalType) return null;

    let planType: 'TRIAL' | 'SUBSCRIPTION' = 'SUBSCRIPTION';
    let isExpired = false;
    let daysLeft = daysUntilExpiration;

    switch (subscriptionModalType) {
      case 'TRIAL_EXPIRED':
        planType = 'TRIAL';
        isExpired = true;
        break;
      case 'SUBSCRIPTION_EXPIRED':
        planType = 'SUBSCRIPTION';
        isExpired = true;
        break;
      case 'SUBSCRIPTION_WARNING':
        planType = 'SUBSCRIPTION';
        isExpired = false;
        break;
    }

    return {
      isOpen: showSubscriptionModal,
      onClose: () => setShowSubscriptionModal(false),
      onUpgrade: () => handleSubscriptionModalAction('UPGRADE'),
      onCancel: () => handleSubscriptionModalAction('CANCEL'),
      planType,
      daysLeft,
      isExpired
    };
  };

  const modalProps = getModalProps();

  return (
    <>
      {children}
      {modalProps && (
        <SubscriptionExpirationModal
          isOpen={modalProps.isOpen}
          onClose={modalProps.onClose}
          onUpgrade={modalProps.onUpgrade}
          onCancel={modalProps.onCancel}
          planType={modalProps.planType}
          daysLeft={modalProps.daysLeft}
          isExpired={modalProps.isExpired}
        />
      )}
    </>
  );
};

export default AppWrapper;
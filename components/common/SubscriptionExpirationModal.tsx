// components/common/SubscriptionExpirationModal.tsx
"use client";

import React from 'react';
import Modal from '@/components/common/Modal/Modal';
import styles from './SubscriptionExpirationModal.module.scss';
import { MdWarning, MdCheckCircle, MdCancel } from 'react-icons/md';
import Link from 'next/link';

interface SubscriptionExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onCancel: () => void;
  planType: 'TRIAL' | 'SUBSCRIPTION';
  daysLeft: number | null;
  isExpired: boolean;
}

const SubscriptionExpirationModal: React.FC<SubscriptionExpirationModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  onCancel,
  planType,
  daysLeft,
  isExpired
}) => {
  const getTitle = () => {
    if (isExpired) {
      return planType === 'TRIAL' ? 'Trial Has Expired' : 'Subscription Has Expired';
    } else {
      return planType === 'TRIAL' ? 'Trial Expiring Soon' : 'Subscription Expiring Soon';
    }
  };

  const getMessage = () => {
    if (isExpired) {
      return planType === 'TRIAL'
        ? 'Your 14-day free trial has expired. To continue using all features of MyEduPanel, please upgrade to a paid plan.'
        : 'Your subscription has expired. To continue using MyEduPanel, please renew your subscription.';
    } else {
      return planType === 'TRIAL'
        ? `Your 14-day free trial will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade now to continue enjoying all features.`
        : `Your subscription will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Renew now to continue using MyEduPanel.`;
    }
  };

  const getIcon = () => {
    if (isExpired) {
      return <MdWarning size={40} className={styles.warningIcon} />;
    } else {
      return <MdWarning size={40} className={styles.warningIcon} />;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={getTitle()}
      modalClassName={styles.expirationModal}
    >
      <div className={styles.modalContent}>
        <div className={styles.iconContainer}>
          {getIcon()}
        </div>
        <p className={styles.message}>{getMessage()}</p>
        <div className={styles.modalActions}>
          <Link href="/upgrade" className={styles.upgradeButton} onClick={onUpgrade}>
            Upgrade Now
          </Link>
          <button 
            onClick={isExpired ? onCancel : onClose} 
            className={isExpired ? styles.cancelButton : styles.dismissButton}
          >
            {isExpired ? 'Cancel & Logout' : 'Continue Anyway'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SubscriptionExpirationModal;
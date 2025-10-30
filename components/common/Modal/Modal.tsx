// components/common/Modal.tsx
"use client";
import React, { useEffect } from 'react'; // <-- Step 1: useEffect ko import karein
import styles from './Modal.module.scss';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Step 2: useEffect hook add karein
  useEffect(() => {
    // Function to handle key down event
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Add event listener when the modal is open
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup function: remove event listener when the modal closes
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]); // Dependencies: re-run effect if these change

  if (!isOpen) return null;

  return (
    // ... baaki ka code same rahega
    <div className={styles.backdrop} onClick={onClose} data-modal-backdrop="true"> {/* <-- YEH ADD KAREIN */}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <FiX />
          </button>
        </header>
        <main className={styles.body}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Modal;
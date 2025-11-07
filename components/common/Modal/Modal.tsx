// components/common/Modal.tsx
"use client";
import React, { useEffect } from 'react';
import styles from './Modal.module.scss';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  // [FIX 1]: modalClassName prop को जोड़ा गया
  modalClassName?: string; 
}

// [FIX 2]: modalClassName prop को destructure किया गया
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, modalClassName }) => {
  // Functionality for ESC key to close modal (as you added)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Backdrop allows clicking outside to close
    <div className={styles.backdrop} onClick={onClose} data-modal-backdrop="true">
      {/* [FIX 3]: styles.modalContent के साथ modalClassName को apply किया गया */}
      <div 
        className={`${styles.modalContent} ${modalClassName || ''}`} 
        onClick={(e) => e.stopPropagation()} // Stop click from bubbling to backdrop
      >
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
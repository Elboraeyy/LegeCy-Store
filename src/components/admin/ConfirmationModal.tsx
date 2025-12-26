import React from 'react';
import styles from './ConfirmationModal.module.css';
import { clsx } from 'clsx';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'default' | 'danger';
}

export function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  isLoading, 
  variant = 'default' 
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        
        <div className={styles.actions}>
          <button 
            onClick={onCancel} 
            className={clsx(styles.btn, styles.cancelBtn)}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={clsx(styles.btn, styles.confirmBtn, {
              [styles.danger]: variant === 'danger'
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

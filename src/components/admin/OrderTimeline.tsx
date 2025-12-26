import React from 'react';
import { OrderStatus } from '@/types/order';
import styles from './OrderTimeline.module.css';
import { clsx } from 'clsx';

const STEPS = [
  { id: OrderStatus.Pending, label: 'Placed' },
  { id: OrderStatus.Paid, label: 'Paid' },
  { id: OrderStatus.Shipped, label: 'Shipped' },
  { id: OrderStatus.Delivered, label: 'Delivered' },
];

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const isCancelled = status === OrderStatus.Cancelled;

  // Calculate current step index
  let currentIndex = STEPS.findIndex((s) => s.id === status);
  
  // Handle Cancelled Case uniquely
  if (isCancelled) {
    currentIndex = -1; 
  }

  return (
    <div className={styles.timelineContainer}>
      {STEPS.map((step, idx) => {
        const isCompleted = !isCancelled && idx < currentIndex;
        const isActive = !isCancelled && idx === currentIndex;
        
        return (
          <div 
            key={step.id} 
            className={clsx(styles.step, {
              [styles.completed]: isCompleted,
              [styles.active]: isActive,
            })}
          >
            <div className={styles.dot} />
            <span className={styles.label}>{step.label}</span>
          </div>
        );
      })}
      
      {isCancelled && (
        <div className={clsx(styles.step, styles.cancelled, styles.active)}>
           <div className={styles.dot} />
           <span className={styles.label}>Cancelled</span>
        </div>
      )}
    </div>
  );
}

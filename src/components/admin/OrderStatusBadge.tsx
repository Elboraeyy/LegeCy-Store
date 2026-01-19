import React from 'react';
import { OrderStatus } from '@/types/order';

const STATUS_COLORS: Record<OrderStatus, { bg: string; color: string }> = {
  [OrderStatus.Pending]: { bg: '#fff4e5', color: '#b76e00' },   // Orange-ish
  [OrderStatus.Paid]: { bg: '#e6f4ea', color: '#137333' },      // Green
  [OrderStatus.Shipped]: { bg: '#e8f0fe', color: '#1967d2' },   // Blue
  [OrderStatus.Delivered]: { bg: '#ceead6', color: '#0d652d' }, // Darker Green
  [OrderStatus.CashReceived]: { bg: '#c6f7e2', color: '#0d652d' }, // Green (COD completed)
  [OrderStatus.Cancelled]: { bg: '#fce8e6', color: '#c5221f' }, // Red
  [OrderStatus.PaymentPending]: { bg: '#fff8e1', color: '#f57c00' }, // Amber
  [OrderStatus.PaymentFailed]: { bg: '#ffebee', color: '#d32f2f' },  // Light Red
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const styles = STATUS_COLORS[status] || { bg: '#f1f3f4', color: '#3c4043' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 8px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      backgroundColor: styles.bg,
      color: styles.color,
    }}>
      {status}
    </span>
  );
}

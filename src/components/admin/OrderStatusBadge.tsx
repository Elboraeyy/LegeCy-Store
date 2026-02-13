import React from 'react';
import { OrderStatus } from '@/types/order';

const STATUS_COLORS: Record<OrderStatus, { bg: string; color: string }> = {
  [OrderStatus.Pending]: { bg: 'bg-yellow-100', color: 'text-yellow-800' },
  [OrderStatus.PaymentPending]: { bg: 'bg-purple-100', color: 'text-purple-800' },
  [OrderStatus.Confirmed]: { bg: 'bg-cyan-100', color: 'text-cyan-800' },
  [OrderStatus.Preparing]: { bg: 'bg-amber-100', color: 'text-amber-800' },
  [OrderStatus.Paid]: { bg: 'bg-green-100', color: 'text-green-800' },
  [OrderStatus.Shipped]: { bg: 'bg-indigo-100', color: 'text-indigo-800' },
  [OrderStatus.Delivered]: { bg: 'bg-green-100', color: 'text-green-800' },
  [OrderStatus.CashReceived]: { bg: 'bg-emerald-100', color: 'text-emerald-800' },
  [OrderStatus.Cancelled]: { bg: 'bg-red-100', color: 'text-red-800' },
  [OrderStatus.Refunded]: { bg: 'bg-gray-100', color: 'text-gray-800' },
  [OrderStatus.PaymentFailed]: { bg: 'bg-red-50', color: 'text-red-600' },
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

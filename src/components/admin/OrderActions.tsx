'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Order, OrderStatus } from '@/types/order';
import { ConfirmationModal } from './ConfirmationModal';

interface OrderActionsProps {
  order: Order;
}

export function OrderActions({ order }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'pay' | 'ship' | 'deliver' | 'cancel' | null>(null);

  const requestAction = (action: 'pay' | 'ship' | 'deliver' | 'cancel') => {
    setPendingAction(action);
    setModalOpen(true);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;

    const action = pendingAction;
    setLoading(action);
    setError(null);
    try {
      // Use specific action endpoints instead of generic /status
      const endpoint = `/api/admin/orders/${order.id}/${action}`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }

      router.refresh();
      setModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(null);
      setPendingAction(null);
    }
  };

  const btnStyle = (variant: 'primary' | 'danger' | 'default'): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: 'var(--radius)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    backgroundColor: variant === 'primary' ? 'var(--primary)' 
      : variant === 'danger' ? '#c5221f' 
      : '#f1f3f4',
    color: variant === 'default' ? 'var(--text-on-light)' : '#fff',
    opacity: loading ? 0.7 : 1,
    pointerEvents: loading ? 'none' : 'auto',
  });

  if (order.status === OrderStatus.Cancelled || order.status === OrderStatus.Delivered) {
    return null;
  }

  const getConfirmationMessage = (action: string | null) => {
    switch (action) {
      case 'pay': return 'Are you sure you want to mark this order as PAID?';
      case 'ship': return 'Are you sure you want to mark this order as SHIPPED?';
      case 'deliver': return 'Are you sure you want to mark this order as DELIVERED?';
      case 'cancel': return 'Are you sure you want to CANCEL this order? This action cannot be undone.';
      default: return 'Are you sure?';
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {order.status === OrderStatus.Pending && (
          <>
            <button onClick={() => requestAction('pay')} style={btnStyle('primary')}>
              Mark as Paid
            </button>
            <button onClick={() => requestAction('cancel')} style={btnStyle('danger')}>
              Cancel Order
            </button>
          </>
        )}

        {order.status === OrderStatus.Paid && (
          <button onClick={() => requestAction('ship')} style={btnStyle('primary')}>
             Mark as Shipped
          </button>
        )}

        {order.status === OrderStatus.Shipped && (
          <button onClick={() => requestAction('deliver')} style={btnStyle('primary')}>
            Mark as Delivered
          </button>
        )}

        {error && (
          <span style={{ color: '#c5221f', fontSize: '14px', marginLeft: '12px' }}>
            Error: {error}
          </span>
        )}
      </div>

      <ConfirmationModal
        isOpen={modalOpen}
        title={`Confirm ${pendingAction?.toUpperCase()}`}
        message={getConfirmationMessage(pendingAction)}
        onConfirm={confirmAction}
        onCancel={() => setModalOpen(false)}
        isLoading={!!loading}
        variant={pendingAction === 'cancel' ? 'danger' : 'default'}
      />
    </>
  );
}

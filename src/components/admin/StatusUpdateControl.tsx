'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatusAction } from '@/lib/actions/order';
import { OrderStatus } from '@/lib/orderStatus';

interface Props {
  orderId: string;
  currentStatus: string;
}

const AVAILABLE_STATUSES = [
  OrderStatus.Pending,
  OrderStatus.Paid,
  OrderStatus.Shipped,
  OrderStatus.Delivered,
  OrderStatus.Cancelled,
];

export default function StatusUpdateControl({ orderId, currentStatus }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    if (selectedStatus === currentStatus) return;
    if (!confirm(`Are you sure you want to change status from ${currentStatus} to ${selectedStatus}?`)) return;

    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, selectedStatus as OrderStatus);
      if (!result.success) {
        alert(result.error);
        // Reset to actual server state on error
        setSelectedStatus(currentStatus);
      }
    });
  };

  const getStatusColor = (status: string) => {
      if (status === 'Pending') return '#eab308';
      if (status === 'Paid') return '#166534';
      if (status === 'Shipped') return '#2563eb';
      if (status === 'Delivered') return '#166534';
      return '#666';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative' }}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            disabled={isPending}
            style={{
              padding: '8px 12px',
              borderRadius: '20px',
              border: '1px solid var(--admin-border)',
              outline: 'none',
              background: '#fff',
              fontSize: '13px',
              cursor: isPending ? 'wait' : 'pointer',
              fontWeight: 500,
              paddingRight: '32px',
              appearance: 'none',
              color: getStatusColor(selectedStatus)
            }}
          >
            {AVAILABLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '10px' }}>
              ▼
          </div>
      </div>

      {selectedStatus !== currentStatus && (
          <button 
            onClick={handleUpdate} 
            disabled={isPending}
            className="admin-btn admin-btn-primary"
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            {isPending ? 'Updating...' : 'Confirm'}
          </button>
      )}
    </div>
  );
}

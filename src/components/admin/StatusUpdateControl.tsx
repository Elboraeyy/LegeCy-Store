'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatusAction } from '@/lib/actions/order';
import { OrderStatus } from '@/lib/orderStatus';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';

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

// Terminal states that cannot be changed
const TERMINAL_STATES = [OrderStatus.Delivered, OrderStatus.Cancelled];

export default function StatusUpdateControl({ orderId, currentStatus }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const isTerminalState = TERMINAL_STATES.includes(currentStatus as OrderStatus);

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

  // For terminal states, show a static badge instead of dropdown
  if (isTerminalState) {
    const badgeStyle: React.CSSProperties = {
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      background: currentStatus === OrderStatus.Delivered ? '#dcfce7' : '#fee2e2',
      color: currentStatus === OrderStatus.Delivered ? '#166534' : '#991b1b',
    };
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={badgeStyle}>{currentStatus}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative' }}>
          <AdminDropdown
            value={selectedStatus}
            onChange={setSelectedStatus}
            disabled={isPending}
            variant="pill"
            options={AVAILABLE_STATUSES.map(status => ({ value: status, label: status }))}
          />
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


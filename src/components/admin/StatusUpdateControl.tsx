'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatusAction } from '@/lib/actions/order';
import { OrderStatus } from '@/lib/orderStatus';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import AdminConfirmDialog from '@/components/admin/ui/AdminConfirmDialog';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface Props {
  orderId: string;
  currentStatus: string;
  paymentMethod?: string;
}

const ALL_STATUSES = [
  { value: OrderStatus.PaymentPending, color: '#7c3aed' },
  { value: OrderStatus.Pending, color: '#b76e00' },
  { value: OrderStatus.Paid, color: '#166534' },
  { value: OrderStatus.Confirmed, color: '#166534' },
  { value: OrderStatus.Preparing, color: '#0d9488' },
  { value: OrderStatus.Shipped, color: '#1e40af' },
  { value: OrderStatus.Delivered, color: '#166534' },
  { value: OrderStatus.Cancelled, color: '#991b1b' },
  { value: OrderStatus.Refunded, color: '#ca8a04' },
  { value: OrderStatus.PaymentFailed, color: '#991b1b' },
];

// Terminal states that cannot be changed
const TERMINAL_STATES = [
  OrderStatus.Delivered,
  OrderStatus.Cancelled, 
  OrderStatus.Refunded,
  OrderStatus.PaymentFailed
];

export default function StatusUpdateControl({ orderId, currentStatus, paymentMethod }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isTerminalState = TERMINAL_STATES.includes(currentStatus as OrderStatus);

  const handleUpdate = () => {
    if (selectedStatus === currentStatus) return;
    setIsConfirmOpen(true);
  };

  const executeUpdate = () => {
    setIsConfirmOpen(false);
    startTransition(async () => {
      try {
        const result = await updateOrderStatusAction(orderId, selectedStatus as OrderStatus);
        if (result.success) {
          toast.success(`Order status updated to ${selectedStatus}`);
        } else {
          toast.error(result.error || 'Failed to update status');
          setSelectedStatus(currentStatus);
        }
      } catch (err) {
        toast.error('An unexpected error occurred');
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

  const { language } = useLanguage();
  const t = adminDictionary[language];

  const availableOptions = ALL_STATUSES.filter(opt => {
    // COD Rules
    if (paymentMethod === 'cod') {
      if (opt.value === OrderStatus.Paid) return false;
      if (opt.value === OrderStatus.PaymentPending) return false;
    }

    // Online Rules
    if (paymentMethod !== 'cod') {
      if (opt.value === OrderStatus.Paid) return false;
    }
    return true;
  }).map(opt => ({
    value: opt.value,
    label: t.orders.status[opt.value.toLowerCase() as keyof typeof t.orders.status] || opt.value,
    icon: <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: opt.color }}></span>
  }));

  const currentStatusInfo = ALL_STATUSES.find(s => s.value === currentStatus);

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
        <span style={badgeStyle}>
          {t.orders.status[currentStatus.toLowerCase() as keyof typeof t.orders.status] || currentStatus}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative', minWidth: '180px' }}>
          <AdminDropdown
            value={selectedStatus}
            onChange={setSelectedStatus}
            disabled={isPending}
            variant="pill"
          options={availableOptions}
          icon={<span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentStatusInfo?.color || '#6b7c90' }}></span>}
          />
      </div>

      {selectedStatus !== currentStatus && (
          <button 
            onClick={handleUpdate} 
            disabled={isPending}
            className="admin-btn admin-btn-primary"
          style={{
            padding: '10px 20px',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(18, 64, 60, 0.2)'
          }}
          >
          {isPending ? '...' : 'Confirm'}
          </button>
      )}

      <AdminConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeUpdate}
        title="Change Order Status?"
        description={`Are you sure you want to update this order's status from "${currentStatus}" to "${selectedStatus}"? This action may trigger notification emails.`}
        confirmLabel="Yes, Update Status"
        cancelLabel="Discard"
        type={selectedStatus === OrderStatus.Cancelled ? 'danger' : 'warning'}
        isPending={isPending}
      />
    </div>
  );
}


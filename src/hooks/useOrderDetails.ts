import { useState, useEffect, useCallback } from 'react';
import { Order, OrderHistoryItem } from '@/types/order';

interface ExtendedOrder extends Order {
  history?: OrderHistoryItem[];
}

export function useOrderDetails(id: string) {
  const [order, setOrder] = useState<ExtendedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        headers: {
            'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || 'super-secret-admin-key'
        }
      });
      if (!res.ok) {
         if (res.status === 404) throw new Error('Order not found');
         throw new Error('Failed to load order');
      }
      const data = await res.json();
      setOrder(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refresh: fetchOrder };
}

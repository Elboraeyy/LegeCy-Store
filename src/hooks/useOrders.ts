import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/types/order';

interface UseOrdersParams {
  page: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  search?: string;
  dateRange?: { from?: Date; to?: Date };
}

interface UseOrdersResult {
  orders: Order[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useOrders({ page, limit = 10, status, sortBy, search, dateRange }: UseOrdersParams): UseOrdersResult {
  const [data, setData] = useState<{ data: Order[], meta: UseOrdersResult['meta'] }>({ 
    data: [], 
    meta: { page: 1, limit: 10, total: 0, totalPages: 0 } 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortBy || 'newest',
      });

      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (dateRange?.from) params.set('from', dateRange.from.toISOString());
      if (dateRange?.to) params.set('to', dateRange.to.toISOString());

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        credentials: 'include' // Use session cookie for auth
      });
      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, sortBy, search, dateRange]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { 
    orders: data.data, 
    meta: data.meta, 
    loading, 
    error,
    refresh: fetchOrders 
  };
}


'use client';

import React, { useEffect, useState } from 'react';
import { getAbandonedCarts, sendRecoveryEmailAction, type AbandonedCart } from '@/lib/actions/abandoned-cart';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function AbandonedCartsPage() {
  const { language } = useLanguage();
  const t = adminDictionary[language as keyof typeof adminDictionary];
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadCarts();
  }, []);

  async function loadCarts() {
    try {
      const data = await getAbandonedCarts();
      setCarts(data);
    } catch {
      toast.error('Failed to load abandoned carts');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendRecovery(cartId: string) {
    setProcessingId(cartId);
    const toastId = toast.loading('Sending recovery email...');

    try {
      const result = await sendRecoveryEmailAction(cartId);
      if (result.success) {
        toast.success(t.abandoned_carts.success_sent, { id: toastId });
        // Refresh list to update status
        await loadCarts();
      } else {
        toast.error(result.error || t.abandoned_carts.error_sending, { id: toastId });
      }
    } catch {
      toast.error(t.abandoned_carts.error_sending, { id: toastId });
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">{t.abandoned_carts.title}</h1>
          <p className="admin-subtitle">{t.abandoned_carts.subtitle}</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.abandoned_carts.table.user}</th>
                <th>{t.abandoned_carts.table.items}</th>
                <th>{t.abandoned_carts.table.total}</th>
                <th>{t.abandoned_carts.table.last_active}</th>
                <th>{t.abandoned_carts.table.status}</th>
                <th>{t.abandoned_carts.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {carts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No abandoned carts found.
                  </td>
                </tr>
              ) : (
                carts.map((cart) => (
                  <tr key={cart.id}>
                    <td>
                      <div className="font-medium">{cart.user.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{cart.user.email}</div>
                    </td>
                    <td>
                      <div className="text-sm">
                        {cart.items.slice(0, 2).map(i => i.name).join(', ')}
                        {cart.items.length > 2 && ` +${cart.items.length - 2} more`}
                      </div>
                      <div className="text-xs text-gray-500">{cart.itemCount} items</div>
                    </td>
                    <td className="font-medium text-[var(--admin-primary)]">
                      {formatCurrency(cart.totalValue)}
                    </td>
                    <td className="text-sm text-gray-500">
                      {new Date(cart.updatedAt).toLocaleString()}
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${cart.abandonedEmailSent
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {cart.abandonedEmailSent
                          ? t.abandoned_carts.status.sent
                          : t.abandoned_carts.status.pending}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleSendRecovery(cart.id)}
                        disabled={!!processingId || cart.abandonedEmailSent}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${cart.abandonedEmailSent
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[var(--admin-primary)] text-white hover:bg-[var(--admin-primary-dark)]'
                          }`}
                      >
                        {processingId === cart.id ? 'Sending...' : t.abandoned_carts.send_recovery}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

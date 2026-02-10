'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface OrderNote {
  id: string;
  content: string | null;
  createdAt: Date;
}

interface Dispute {
  id: string;
  status: string;
  totalPrice: { toNumber?: () => number } | number;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: Date;
  notes: OrderNote[] | null;
  items: Array<{ name: string; quantity: number }>;
  paymentIntent?: { provider: string | null } | null;
}

interface Chargeback {
  id: string;
  action: string;
  entityId: string | null;
  createdAt: Date;
  metadata: string | null;
  adminId: string | null;  // Fixed: AuditLog.adminId can be null
  entityType: string;
  ipAddress: string | null;
}

interface Props {
  disputes: Dispute[];
  chargebacks: Chargeback[];
}

export default function DisputesClient({ disputes, chargebacks }: Props) {
  const router = useRouter();
  const { language } = useLanguage();
  const t = adminDictionary[language];
  const [activeTab, setActiveTab] = useState<'disputes' | 'chargebacks'>('disputes');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getPrice = (price: { toNumber?: () => number } | number): number => {
    if (typeof price === 'number') return price;
    if (price && typeof price.toNumber === 'function') return price.toNumber();
    return Number(price) || 0;
  };

  const getNotesText = (notes: OrderNote[] | null): string => {
    if (!notes || notes.length === 0) return t.common.no_notes || 'No notes available';
    return notes.map(n => n.content).filter(Boolean).join(', ') || (t.common.no_notes || 'No notes available');
  };

  const handleResolve = async (orderId: string, resolution: 'refund' | 'reject' | 'partial') => {
    setProcessingId(orderId);
    alert(`Resolution: ${resolution} for order ${orderId}. This would call the appropriate service.`);
    setProcessingId(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Header moved from Page for localization */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.orders.disputes.title}</h1>
          <p className="text-gray-500 mt-1">
            {t.orders.disputes.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
            {disputes.length} {t.orders.disputes.active_disputes}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'disputes'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          {t.orders.disputes.active_disputes} ({disputes.length})
        </button>
        <button
          onClick={() => setActiveTab('chargebacks')}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'chargebacks'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          {t.orders.disputes.recent_chargebacks} ({chargebacks.length})
        </button>
      </div>

      {activeTab === 'disputes' && (
        <>
          {disputes.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-medium text-green-700">{t.orders.disputes.no_disputes}</h3>
              <p className="text-green-600">{t.orders.disputes.good_standing}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium">{t.orders.table.order} #{dispute.id.slice(0, 8)}</h3>
                      <p className="text-sm text-gray-500">
                        {dispute.customerName} • {dispute.customerEmail}
                      </p>
                    </div>
                    <span className="text-lg font-bold">
                      {getPrice(dispute.totalPrice).toFixed(2)} EGP
                    </span>
                  </div>

                  <div className="bg-amber-50 rounded p-3 mb-4">
                    <p className="text-sm text-amber-800">
                      <strong>{t.orders.details_page.notes}:</strong> {getNotesText(dispute.notes)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(dispute.id, 'refund')}
                      disabled={processingId === dispute.id}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
                    >
                      {t.orders.disputes.full_refund}
                    </button>
                    <button
                      onClick={() => handleResolve(dispute.id, 'partial')}
                      disabled={processingId === dispute.id}
                      className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm disabled:opacity-50"
                    >
                      {t.orders.disputes.partial_refund}
                    </button>
                    <button
                      onClick={() => handleResolve(dispute.id, 'reject')}
                      disabled={processingId === dispute.id}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
                    >
                      {t.orders.disputes.reject}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'chargebacks' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-start px-6 py-3 text-sm font-medium text-gray-500">{t.orders.table.date}</th>
                <th className="text-start px-6 py-3 text-sm font-medium text-gray-500">{t.orders.disputes.action}</th>
                <th className="text-start px-6 py-3 text-sm font-medium text-gray-500">{t.orders.table.id}</th>
                <th className="text-start px-6 py-3 text-sm font-medium text-gray-500">{t.orders.disputes.details}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {chargebacks.map((cb) => (
                <tr key={cb.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(cb.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                      {cb.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">
                    {cb.entityId?.slice(0, 8) || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {cb.metadata ? cb.metadata.slice(0, 50) + '...' : '-'}
                  </td>
                </tr>
              ))}
              {chargebacks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {t.orders.disputes.no_chargebacks}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

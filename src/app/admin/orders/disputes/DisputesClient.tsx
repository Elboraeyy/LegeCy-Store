'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [activeTab, setActiveTab] = useState<'disputes' | 'chargebacks'>('disputes');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getPrice = (price: { toNumber?: () => number } | number): number => {
    if (typeof price === 'number') return price;
    if (price && typeof price.toNumber === 'function') return price.toNumber();
    return Number(price) || 0;
  };

  const getNotesText = (notes: OrderNote[] | null): string => {
    if (!notes || notes.length === 0) return 'No notes available';
    return notes.map(n => n.content).filter(Boolean).join(', ') || 'No notes available';
  };

  const handleResolve = async (orderId: string, resolution: 'refund' | 'reject' | 'partial') => {
    setProcessingId(orderId);
    alert(`Resolution: ${resolution} for order ${orderId}. This would call the appropriate service.`);
    setProcessingId(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'disputes'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          Active Disputes ({disputes.length})
        </button>
        <button
          onClick={() => setActiveTab('chargebacks')}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'chargebacks'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          Recent Chargebacks ({chargebacks.length})
        </button>
      </div>

      {activeTab === 'disputes' && (
        <>
          {disputes.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-medium text-green-700">No Active Disputes</h3>
              <p className="text-green-600">All orders are in good standing</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium">Order #{dispute.id.slice(0, 8)}</h3>
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
                      <strong>Notes:</strong> {getNotesText(dispute.notes)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(dispute.id, 'refund')}
                      disabled={processingId === dispute.id}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
                    >
                      Full Refund
                    </button>
                    <button
                      onClick={() => handleResolve(dispute.id, 'partial')}
                      disabled={processingId === dispute.id}
                      className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm disabled:opacity-50"
                    >
                      Partial Refund
                    </button>
                    <button
                      onClick={() => handleResolve(dispute.id, 'reject')}
                      disabled={processingId === dispute.id}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
                    >
                      Reject Dispute
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
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Action</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Order ID</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {chargebacks.map((cb) => (
                <tr key={cb.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(cb.createdAt).toLocaleString()}
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
                    No chargebacks recorded
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

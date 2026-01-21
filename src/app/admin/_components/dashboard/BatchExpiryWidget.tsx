'use client';

import { useEffect, useState } from 'react';
import { Clock, Package, AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ExpiryData {
  expiring30Days: number;
  expiring60Days: number;
  expiring90Days: number;
  totalValueAtRisk: number;
  items: Array<{
    productName: string;
    sku: string;
    quantity: number;
    expiryDate: string;
    daysLeft: number;
  }>;
}

export default function BatchExpiryWidget() {
  const [data, setData] = useState<ExpiryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiryData();
  }, []);

  async function fetchExpiryData() {
    try {
      const response = await fetch('/api/admin/inventory/expiring-batches');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch expiry data', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  const expiryStats = [
    { label: '30 Days', value: data?.expiring30Days || 0, color: 'text-red-600', bg: 'bg-red-50' },
    { label: '60 Days', value: data?.expiring60Days || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '90 Days', value: data?.expiring90Days || 0, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-base">Batch Expiry</h3>
          </div>
          {data && data.totalValueAtRisk > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Risk: {formatCurrency(data.totalValueAtRisk)}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {expiryStats.map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center border border-gray-100`}>
              <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[11px] font-medium text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Expiring Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Package className="h-3.5 w-3.5" /> Expiring Soon
            </p>
          </div>

          {data?.items && data.items.length > 0 ? (
            <div className="space-y-2">
              {data.items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs group">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-primary-500 transition-colors" />
                    <span className="text-gray-700 font-medium truncate max-w-[140px]">{item.productName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md font-medium ${item.daysLeft <= 30 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                    {item.daysLeft}d
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
              No expiring batches
            </div>
          )}
        </div>
      </div>

      {/* Footer Link */}
      <div className="border-t border-gray-100 mt-5 pt-4">
        <Link
          href="/admin/inventory/expiry"
          className="text-sm text-gray-500 hover:text-primary-600 flex items-center justify-between group transition-colors"
        >
          <span className="font-medium">View All Expiring</span>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}

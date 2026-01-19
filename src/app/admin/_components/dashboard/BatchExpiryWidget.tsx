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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Batch Expiry</h3>
        </div>
        <Link 
          href="/admin/inventory/expiry"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {expiryStats.map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-lg p-3 text-center`}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Value at Risk */}
      {data && data.totalValueAtRisk > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">
              Value at Risk: {formatCurrency(data.totalValueAtRisk)}
            </span>
          </div>
        </div>
      )}

      {/* Expiring Items */}
      {data?.items && data.items.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Expiring Soon</p>
          <div className="space-y-2">
            {data.items.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 truncate max-w-[120px]">{item.productName}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.daysLeft <= 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {item.daysLeft} days
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!data?.items || data.items.length === 0) && (
        <div className="text-center py-4 text-sm text-gray-500">
          <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          No expiring batches
        </div>
      )}
    </div>
  );
}

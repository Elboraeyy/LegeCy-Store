'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Users, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface RiskData {
  highRiskCount: number;
  pendingReviewCount: number;
  blockedCount: number;
  recentFlags: Array<{
    email: string;
    riskLevel: string;
    reason: string;
  }>;
}

export default function CustomerRiskWidget() {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskData();
  }, []);

  async function fetchRiskData() {
    try {
      const response = await fetch('/api/admin/analytics/customer-risk');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch customer risk data', error);
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

  const riskStats = [
    { label: 'High Risk', value: data?.highRiskCount || 0, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Pending Review', value: data?.pendingReviewCount || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Blocked', value: data?.blockedCount || 0, color: 'text-gray-600', bg: 'bg-gray-100' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-50 rounded-lg">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Customer Risk</h3>
        </div>
        <Link 
          href="/admin/customers?filter=high-risk"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {riskStats.map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-lg p-3 text-center`}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Flags */}
      {data?.recentFlags && data.recentFlags.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Recent Flags</p>
          <div className="space-y-2">
            {data.recentFlags.slice(0, 3).map((flag, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-gray-700">{flag.email}</span>
                </div>
                <span className="text-xs text-gray-500">{flag.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!data?.recentFlags || data.recentFlags.length === 0) && (
        <div className="text-center py-4 text-sm text-gray-500">
          <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          No flagged customers
        </div>
      )}
    </div>
  );
}

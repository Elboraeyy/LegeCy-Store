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
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-xl">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-base">Customer Risk</h3>
          </div>
          {data && data.highRiskCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{data.highRiskCount} Risky</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {riskStats.map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center border border-gray-100`}>
              <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[11px] font-medium text-gray-500 mt-1 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Flags */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Users className="h-3.5 w-3.5" /> Recent Flags
            </p>
          </div>

          {data?.recentFlags && data.recentFlags.length > 0 ? (
            <div className="space-y-2">
              {data.recentFlags.slice(0, 3).map((flag, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs group">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 group-hover:bg-red-600 transition-colors" />
                    <span className="text-gray-700 font-medium">{flag.email}</span>
                  </div>
                  <span className="text-gray-400 text-[10px]">{flag.reason}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
              No flagged customers
            </div>
          )}
        </div>
      </div>

      {/* Footer Link */}
      <div className="border-t border-gray-100 mt-5 pt-4">
        <Link
          href="/admin/customers?filter=high-risk"
          className="text-sm text-gray-500 hover:text-primary-600 flex items-center justify-between group transition-colors"
        >
          <span className="font-medium">View All Risks</span>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}

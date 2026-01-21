'use client';

import { useEffect, useState } from 'react';
import { Activity, ToggleLeft, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface HealthData {
  killSwitches: {
    checkout_enabled: boolean;
    payments_enabled: boolean;
    coupons_enabled: boolean;
    cod_enabled: boolean;
  };
  pendingApprovals: number;
  failedCronJobs: number;
  inventoryAlerts: number;
  recentIssues: Array<{
    type: string;
    message: string;
    time: string;
  }>;
}

export default function SystemHealthWidget() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthData();
  }, []);

  async function fetchHealthData() {
    try {
      const response = await fetch('/api/admin/system/health');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch health data', error);
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

  // Calculate overall health
  const issues = (data?.failedCronJobs || 0) + (data?.inventoryAlerts || 0);
  const isHealthy = issues === 0 && data?.killSwitches?.checkout_enabled;

  const killSwitchItems = data?.killSwitches ? [
    { label: 'Checkout', enabled: data.killSwitches.checkout_enabled },
    { label: 'Payments', enabled: data.killSwitches.payments_enabled },
    { label: 'Coupons', enabled: data.killSwitches.coupons_enabled },
    { label: 'COD', enabled: data.killSwitches.cod_enabled },
  ] : [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isHealthy ? 'bg-green-50' : 'bg-amber-50'}`}>
              <Activity className={`h-5 w-5 ${isHealthy ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <h3 className="font-semibold text-gray-900 text-base">System Health</h3>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isHealthy ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {isHealthy ? (
              <>
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Healthy</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{issues} Issue{issues !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>

        {/* Kill Switches */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
              <ToggleLeft className="h-3.5 w-3.5" /> Active Systems
            </p>
            <Link
              href="/admin/config/security"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Manage
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {killSwitchItems.map((item) => (
              <div
                key={item.label} 
                className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border ${item.enabled
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                  }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${item.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/admin/config/security/approvals" className="text-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
            <div className="text-lg font-bold text-gray-900">{data?.pendingApprovals || 0}</div>
            <div className="text-[11px] font-medium text-gray-500 mt-1">Approvals</div>
          </Link>
          <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className={`text-lg font-bold ${(data?.failedCronJobs || 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {data?.failedCronJobs || 0}
            </div>
            <div className="text-[11px] font-medium text-gray-500 mt-1">Failed Jobs</div>
          </div>
          <Link href="/admin/inventory" className="text-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
            <div className={`text-lg font-bold ${(data?.inventoryAlerts || 0) > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {data?.inventoryAlerts || 0}
            </div>
            <div className="text-[11px] font-medium text-gray-500 mt-1">Alerts</div>
          </Link>
        </div>
      </div>

      {/* Footer Link */}
      <div className="border-t border-gray-100 mt-5 pt-4">
        <Link 
          href="/admin/activity"
          className="text-sm text-gray-500 hover:text-primary-600 flex items-center justify-between group transition-colors"
        >
          <span className="font-medium">View Activity Log</span>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}

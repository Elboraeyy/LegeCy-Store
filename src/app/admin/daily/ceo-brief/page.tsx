'use client';

import { useEffect, useState } from 'react';
import { getCEODailyBrief, CEOBriefData } from '@/lib/services/governanceService';
import Link from 'next/link';

export default function CEOBriefPage() {
  const [data, setData] = useState<CEOBriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      try {
        const result = await getCEODailyBrief();
        if (!cancelled) setData(result);
      } catch (error) {
        console.error('Failed to load CEO brief:', error);
      }
      if (!cancelled) setLoading(false);
    })();
    
    return () => { cancelled = true; };
  }, [refetchKey]);

  const refetch = () => setRefetchKey(k => k + 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3c34]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">لا توجد بيانات</p>
      </div>
    );
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString('ar-EG', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-[#1a3c34]">☀️ صباح الخير</h1>
        <p className="text-gray-500 mt-1">{dateStr}</p>
        <p className="text-sm text-gray-400 mt-2">CEO Daily Brief - كل ما تحتاج تعرفه في دقيقة</p>
      </div>

      {/* Key Metrics */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
          <span>📊</span>
          الأرقام الرئيسية
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {data.keyMetrics.map((metric, idx) => (
            <div key={idx} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-[#1a3c34]">{metric.value}</p>
              {metric.change !== undefined && (
                <p className={`text-xs mt-1 ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                  {metric.change > 0 ? '+' : ''}{metric.change.toFixed(0)}%
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
            <span>🚨</span>
            التنبيهات ({data.alerts.length})
          </h2>
          <div className="space-y-3">
            {data.alerts.map((alert, idx) => {
              const styles = {
                danger: { bg: 'bg-red-50', border: 'border-red-200', icon: '🔴', text: 'text-red-800' },
                warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '🟡', text: 'text-amber-800' },
                info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔵', text: 'text-blue-800' }
              };
              const style = styles[alert.type];
              
              return (
                <div key={idx} className={`${style.bg} ${style.border} border rounded-xl p-4`}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{style.icon}</span>
                    <div>
                      <p className={`font-medium ${style.text}`}>{alert.title}</p>
                      <p className={`text-sm ${style.text} opacity-80`}>{alert.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Decisions */}
      {data.pendingDecisions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
            <span>⏳</span>
            قرارات تحتاج ردك ({data.pendingDecisions.length})
          </h2>
          <div className="space-y-3">
            {data.pendingDecisions.map((decision, idx) => (
              <Link 
                key={idx} 
                href="/admin/team/approvals"
                className="block p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-purple-800">{decision.title}</p>
                    <p className="text-sm text-purple-600">
                      {decision.type} • منذ {getTimeAgo(decision.requestedAt)}
                    </p>
                  </div>
                  <span className="text-purple-500">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#1a3c34] to-[#2d5a4e] rounded-2xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>⚡</span>
          الوصول السريع
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/admin/orders" icon="📦" label="الطلبات" />
          <QuickAction href="/admin/finance" icon="💰" label="المالية" />
          <QuickAction href="/admin/analytics" icon="📊" label="التحليلات" />
          <QuickAction href="/admin/team/approvals" icon="✓" label="الموافقات" />
        </div>
      </div>

      {/* Refresh */}
      <div className="text-center">
        <button
          onClick={refetch}
          className="text-sm text-gray-500 hover:text-[#1a3c34] transition-colors"
        >
          🔄 تحديث البيانات
        </button>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}

function getTimeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} يوم`;
  if (hours > 0) return `${hours} ساعة`;
  return 'دقائق';
}

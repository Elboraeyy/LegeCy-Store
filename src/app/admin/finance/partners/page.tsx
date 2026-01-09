'use client';

import { useEffect, useState } from 'react';
import { getPartnerWallets, PartnerWallet } from '@/lib/services/cashFlowService';

export default function PartnersPage() {
  const [partners, setPartners] = useState<PartnerWallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      try {
        const data = await getPartnerWallets();
        if (!cancelled) setPartners(data);
      } catch (error) {
        console.error('Failed to load partner wallets:', error);
      }
      if (!cancelled) setLoading(false);
    })();
    
    return () => { cancelled = true; };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { 
      style: 'currency', 
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totals = partners.reduce((acc, p) => ({
    capital: acc.capital + p.capitalContributed,
    earnings: acc.earnings + p.totalEarnings,
    withdrawn: acc.withdrawn + p.withdrawn,
    remaining: acc.remaining + p.remaining
  }), { capital: 0, earnings: 0, withdrawn: 0, remaining: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3c34]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3c34]">محافظ الشركاء</h1>
          <p className="text-gray-500">Partner Wallets - رأس المال والأرباح لكل شريك</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon="💰"
          label="إجمالي رأس المال"
          value={formatCurrency(totals.capital)}
          color="#3b82f6"
        />
        <SummaryCard
          icon="📈"
          label="إجمالي الأرباح"
          value={formatCurrency(totals.earnings)}
          color="#10b981"
        />
        <SummaryCard
          icon="💸"
          label="إجمالي المسحوب"
          value={formatCurrency(totals.withdrawn)}
          color="#f59e0b"
        />
        <SummaryCard
          icon="🏦"
          label="إجمالي المتبقي"
          value={formatCurrency(totals.remaining)}
          color="#8b5cf6"
        />
      </div>

      {/* Partners Grid */}
      {partners.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {partners.map(partner => (
            <PartnerCard key={partner.id} partner={partner} formatCurrency={formatCurrency} formatDate={formatDate} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <span className="text-5xl">🤝</span>
          <h3 className="text-xl font-semibold mt-4 text-gray-700">لا يوجد شركاء</h3>
          <p className="text-gray-500 mt-2">
            أضف شركاء من صفحة رأس المال والشركاء لتتبع محافظهم
          </p>
        </div>
      )}

      {/* Distribution Chart */}
      {partners.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1a3c34] mb-6">توزيع الحصص</h3>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Pie representation */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {partners.reduce((acc, partner, idx) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                  const startAngle = acc.angle;
                  const sweepAngle = (partner.sharePercent / 100) * 360;
                  const endAngle = startAngle + sweepAngle;
                  
                  const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                  
                  const largeArc = sweepAngle > 180 ? 1 : 0;
                  
                  acc.paths.push(
                    <path
                      key={partner.id}
                      d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={colors[idx % colors.length]}
                    />
                  );
                  
                  acc.angle = endAngle;
                  return acc;
                }, { paths: [] as React.ReactElement[], angle: 0 }).paths}
              </svg>
            </div>
            
            {/* Legend */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partners.map((partner, idx) => {
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                return (
                  <div key={partner.id} className="flex items-center gap-2">
                    <span 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: colors[idx % colors.length] }}
                    />
                    <span className="font-medium">{partner.name}</span>
                    <span className="text-gray-500">({partner.sharePercent.toFixed(1)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function PartnerCard({
  partner,
  formatCurrency,
  formatDate
}: {
  partner: PartnerWallet;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
}) {
  const typeLabels: Record<string, { label: string; color: string }> = {
    OWNER: { label: 'مالك', color: 'bg-purple-100 text-purple-800' },
    PARTNER: { label: 'شريك', color: 'bg-blue-100 text-blue-800' },
    INVESTOR: { label: 'مستثمر', color: 'bg-green-100 text-green-800' }
  };

  const typeInfo = typeLabels[partner.type] || typeLabels.PARTNER;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a3c34] to-[#2d5a4e] flex items-center justify-center text-white text-xl font-bold">
            {partner.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{partner.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
          </div>
        </div>
        <div className="text-left">
          <p className="text-2xl font-bold text-[#1a3c34]">{partner.sharePercent.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">نسبة الملكية</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600">رأس المال</p>
          <p className="font-bold text-blue-800">{formatCurrency(partner.capitalContributed)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600">الأرباح المستحقة</p>
          <p className="font-bold text-green-800">{formatCurrency(partner.totalEarnings)}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3">
          <p className="text-xs text-amber-600">المسحوب</p>
          <p className="font-bold text-amber-800">{formatCurrency(partner.withdrawn)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-600">المتبقي</p>
          <p className="font-bold text-purple-800">{formatCurrency(partner.remaining)}</p>
        </div>
      </div>

      {/* Last Transaction */}
      {partner.lastTransaction && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">آخر معاملة</p>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-sm font-medium ${partner.lastTransaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
              {partner.lastTransaction.type === 'DEPOSIT' ? '⬆️ إيداع' : '⬇️ سحب'}
              {' '}
              {formatCurrency(partner.lastTransaction.amount)}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(partner.lastTransaction.date)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

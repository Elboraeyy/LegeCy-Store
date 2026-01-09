'use client';

import { useEffect, useState } from 'react';
import { getProfitQuality, ProfitQualityResult } from '@/lib/services/cashFlowService';

export default function ProfitQualityPage() {
  const [data, setData] = useState<ProfitQualityResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      try {
        const result = await getProfitQuality();
        if (!cancelled) setData(result);
      } catch (error) {
        console.error('Failed to load profit quality:', error);
      }
      if (!cancelled) setLoading(false);
    })();
    
    return () => { cancelled = true; };
  }, []);

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
        <p className="text-gray-500">لا توجد بيانات كافية</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد';
    if (score >= 40) return 'متوسط';
    if (score >= 20) return 'ضعيف';
    return 'خطر';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return { icon: '📈', text: 'في تحسن', color: 'text-green-600' };
      case 'declining': return { icon: '📉', text: 'في انخفاض', color: 'text-red-600' };
      default: return { icon: '➡️', text: 'مستقر', color: 'text-gray-600' };
    }
  };

  const trendInfo = getTrendIcon(data.trend);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (data.score / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a3c34]">مؤشر جودة الربح</h1>
        <p className="text-gray-500">Profit Quality Indicator - مش كل ربح صحي</p>
      </div>

      {/* Main Score Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score Circle */}
          <div className="relative">
            <svg width="140" height="140" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r="45"
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="none"
              />
              {/* Score circle */}
              <circle
                cx="70"
                cy="70"
                r="45"
                stroke={getScoreColor(data.score)}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: getScoreColor(data.score) }}>
                {data.score}
              </span>
              <span className="text-sm text-gray-500">من 100</span>
            </div>
          </div>

          {/* Score Info */}
          <div className="text-center md:text-right flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <span 
                className="text-2xl font-bold"
                style={{ color: getScoreColor(data.score) }}
              >
                {getScoreLabel(data.score)}
              </span>
              <span className={`flex items-center gap-1 text-sm ${trendInfo.color}`}>
                {trendInfo.icon} {trendInfo.text}
              </span>
            </div>
            <p className="text-gray-500 text-sm max-w-md">
              هذا المؤشر يقيس جودة أرباحك بناءً على مصادر الإيراد ونسبة الخصومات والمرتجعات ومصاريف الإعلانات.
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <ImpactCard
          label="المبيعات الحقيقية"
          value={`${data.breakdown.realSalesPercent}%`}
          detail="من إجمالي الإيراد"
          icon="💵"
          positive
        />
        <ImpactCard
          label="تأثير الخصومات"
          value={`-${data.breakdown.discountImpact}`}
          detail="نقطة مخصومة"
          icon="🏷️"
        />
        <ImpactCard
          label="تأثير المرتجعات"
          value={`-${data.breakdown.returnImpact}`}
          detail="نقطة مخصومة"
          icon="📦"
        />
        <ImpactCard
          label="تأثير الإعلانات"
          value={`-${data.breakdown.adSpendImpact}`}
          detail="نقطة مخصومة"
          icon="📢"
        />
        <ImpactCard
          label="مخاطر COD"
          value={`-${data.breakdown.codRiskImpact}`}
          detail="نقطة مخصومة"
          icon="💳"
        />
      </div>

      {/* Risk Factors */}
      {data.riskFactors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-4">
            <span>⚠️</span>
            عوامل الخطر
          </h3>
          <ul className="space-y-2">
            {data.riskFactors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2 text-red-700">
                <span className="mt-1">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Score Guide */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-semibold text-[#1a3c34] mb-4">دليل النتيجة</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-sm">
          <ScoreRange color="#ef4444" range="0-19" label="خطر" emoji="🔴" />
          <ScoreRange color="#f97316" range="20-39" label="ضعيف" emoji="🟠" />
          <ScoreRange color="#f59e0b" range="40-59" label="متوسط" emoji="🟡" />
          <ScoreRange color="#3b82f6" range="60-79" label="جيد" emoji="🔵" />
          <ScoreRange color="#10b981" range="80-100" label="ممتاز" emoji="🟢" />
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 flex items-center gap-2 mb-4">
          <span>💡</span>
          توصيات لتحسين الجودة
        </h3>
        <ul className="space-y-3 text-blue-700">
          {data.breakdown.discountImpact > 10 && (
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>قلل الخصومات أو اجعلها مستهدفة للعملاء الجدد فقط</span>
            </li>
          )}
          {data.breakdown.returnImpact > 10 && (
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>راجع سياسة المرتجعات وحسّن جودة المنتجات ذات المرتجعات العالية</span>
            </li>
          )}
          {data.breakdown.adSpendImpact > 10 && (
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>حسّن استهداف الإعلانات لتقليل تكلفة الاكتساب</span>
            </li>
          )}
          {data.breakdown.codRiskImpact > 10 && (
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>شجع الدفع الإلكتروني بخصومات أو عروض حصرية</span>
            </li>
          )}
          {data.score >= 80 && (
            <li className="flex items-start gap-2">
              <span>✨</span>
              <span>أداء ممتاز! حافظ على هذا المستوى واستمر في مراقبة المؤشرات</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function ImpactCard({
  label,
  value,
  detail,
  icon,
  positive = false
}: {
  label: string;
  value: string;
  detail: string;
  icon: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400">{detail}</p>
    </div>
  );
}

function ScoreRange({ 
  color, 
  range, 
  label, 
  emoji 
}: { 
  color: string; 
  range: string; 
  label: string;
  emoji: string;
}) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}15` }}>
      <span className="text-lg">{emoji}</span>
      <p className="font-bold mt-1" style={{ color }}>{range}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

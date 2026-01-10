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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#12403C]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl">📊</span>
        <p className="text-gray-500 mt-2">Not enough data available</p>
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
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    if (score >= 20) return 'Poor';
    return 'Critical';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return { icon: '📈', text: 'Improving', color: 'text-green-600' };
      case 'declining': return { icon: '📉', text: 'Declining', color: 'text-red-600' };
      default: return { icon: '➡️', text: 'Stable', color: 'text-gray-600' };
    }
  };

  const trendInfo = getTrendIcon(data.trend);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (data.score / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#12403C]">Profit Quality Indicator</h1>
        <p className="text-gray-500">Not all profit is created equal - measure the quality of your earnings</p>
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
              <span className="text-sm text-gray-500">of 100</span>
            </div>
          </div>

          {/* Score Info */}
          <div className="text-center md:text-left flex-1">
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
              This indicator measures the quality of your profits based on revenue sources, 
              discount rates, returns, and advertising costs.
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <ImpactCard
          label="Real Sales"
          value={`${data.breakdown.realSalesPercent}%`}
          detail="of total revenue"
          icon="💵"
          positive
        />
        <ImpactCard
          label="Discount Impact"
          value={`-${data.breakdown.discountImpact}`}
          detail="points deducted"
          icon="🏷️"
        />
        <ImpactCard
          label="Return Impact"
          value={`-${data.breakdown.returnImpact}`}
          detail="points deducted"
          icon="📦"
        />
        <ImpactCard
          label="Ad Spend Impact"
          value={`-${data.breakdown.adSpendImpact}`}
          detail="points deducted"
          icon="📢"
        />
        <ImpactCard
          label="COD Risk"
          value={`-${data.breakdown.codRiskImpact}`}
          detail="points deducted"
          icon="💳"
        />
      </div>

      {/* Risk Factors */}
      {data.riskFactors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-4">
            <span>⚠️</span>
            Risk Factors
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
        <h3 className="font-semibold text-[#12403C] mb-4">Score Guide</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-sm">
          <ScoreRange color="#ef4444" range="0-19" label="Critical" emoji="🔴" />
          <ScoreRange color="#f97316" range="20-39" label="Poor" emoji="🟠" />
          <ScoreRange color="#f59e0b" range="40-59" label="Average" emoji="🟡" />
          <ScoreRange color="#3b82f6" range="60-79" label="Good" emoji="🔵" />
          <ScoreRange color="#10b981" range="80-100" label="Excellent" emoji="🟢" />
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 flex items-center gap-2 mb-4">
          <span>💡</span>
          Recommendations to Improve Quality
        </h3>
        <ul className="space-y-3 text-blue-700">
          {data.breakdown.discountImpact > 10 && (
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Reduce discounts or make them targeted for new customers only</span>
            </li>
          )}
          {data.breakdown.returnImpact > 10 && (
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Review return policy and improve quality of high-return products</span>
            </li>
          )}
          {data.breakdown.adSpendImpact > 10 && (
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Optimize ad targeting to reduce customer acquisition cost</span>
            </li>
          )}
          {data.breakdown.codRiskImpact > 10 && (
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Encourage online payment with exclusive discounts or offers</span>
            </li>
          )}
          {data.score >= 80 && (
            <li className="flex items-start gap-2">
              <span>✨</span>
              <span>Excellent performance! Maintain this level and keep monitoring the indicators</span>
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

'use client';

import { useEffect, useState } from 'react';
import { getSupplierPerformance, SupplierScore } from '@/lib/services/operationsService';

export default function SupplierPerformancePage() {
  const [suppliers, setSuppliers] = useState<SupplierScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      try {
        const data = await getSupplierPerformance();
        if (!cancelled) setSuppliers(data);
      } catch (error) {
        console.error('Failed to load supplier performance:', error);
      }
      if (!cancelled) setLoading(false);
    })();
    
    return () => { cancelled = true; };
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case 'invest': return { bg: 'bg-green-100', text: 'text-green-800', label: '✨ استثمر', desc: 'مورد ممتاز' };
      case 'maintain': return { bg: 'bg-blue-100', text: 'text-blue-800', label: '✓ حافظ', desc: 'أداء جيد' };
      case 'review': return { bg: 'bg-amber-100', text: 'text-amber-800', label: '⚠️ راجع', desc: 'يحتاج تحسين' };
      case 'exit': return { bg: 'bg-red-100', text: 'text-red-800', label: '❌ اخرج', desc: 'أداء ضعيف' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: '?', desc: 'غير محدد' };
    }
  };

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
      <div>
        <h1 className="text-2xl font-bold text-[#1a3c34]">أداء الموردين</h1>
        <p className="text-gray-500">Supplier Performance - تقييم وترتيب الموردين</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="🏭"
          label="إجمالي الموردين"
          value={suppliers.length}
          color="#3b82f6"
        />
        <StatCard
          icon="✨"
          label="ممتاز"
          value={suppliers.filter(s => s.recommendation === 'invest').length}
          color="#10b981"
        />
        <StatCard
          icon="⚠️"
          label="يحتاج مراجعة"
          value={suppliers.filter(s => s.recommendation === 'review').length}
          color="#f59e0b"
        />
        <StatCard
          icon="❌"
          label="أداء ضعيف"
          value={suppliers.filter(s => s.recommendation === 'exit').length}
          color="#ef4444"
        />
      </div>

      {/* Suppliers Grid */}
      {suppliers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <span className="text-5xl">🏭</span>
          <h3 className="text-xl font-semibold mt-4 text-gray-700">لا يوجد موردين</h3>
          <p className="text-gray-500 mt-2">أضف موردين من صفحة المشتريات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {suppliers.map(supplier => {
            const rec = getRecommendationStyle(supplier.recommendation);
            return (
              <div key={supplier.supplierId} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-lg">{supplier.supplierName}</h3>
                    <p className="text-sm text-gray-500">{supplier.totalOrders} طلب</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg ${rec.bg} ${rec.text}`}>
                    <span className="font-medium">{rec.label}</span>
                  </div>
                </div>

                {/* Overall Score */}
                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                    style={{ backgroundColor: getScoreColor(supplier.overallScore) }}
                  >
                    {supplier.overallScore}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">التقييم الإجمالي</p>
                    <p className="text-lg font-medium">{rec.desc}</p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-3">
                  <ScoreBar label="الجودة" score={supplier.qualityScore} icon="⭐" />
                  <ScoreBar label="الالتزام" score={supplier.complianceScore} icon="📋" />
                  <ScoreBar label="التسليم" score={supplier.deliveryScore} icon="🚚" />
                </div>

                {/* Issues */}
                {supplier.totalIssues > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <p className="text-red-700 text-sm">
                      ⚠️ {supplier.totalIssues} مشكلة مسجلة
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scoring Guide */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span>📐</span>
          دليل التقييم
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <span className="text-lg">🟢</span>
            <p className="font-bold text-green-700">90-100</p>
            <p className="text-green-600">ممتاز</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <span className="text-lg">🔵</span>
            <p className="font-bold text-blue-700">70-89</p>
            <p className="text-blue-600">جيد</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg">
            <span className="text-lg">🟡</span>
            <p className="font-bold text-amber-700">50-69</p>
            <p className="text-amber-600">متوسط</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <span className="text-lg">🔴</span>
            <p className="font-bold text-red-700">0-49</p>
            <p className="text-red-600">ضعيف</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: string }) {
  const getColor = (s: number) => {
    if (s >= 90) return 'bg-green-500';
    if (s >= 70) return 'bg-blue-500';
    if (s >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="flex items-center gap-1">
          {icon} {label}
        </span>
        <span className="font-medium">{score}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { getReturnsIntelligence, ReturnStats } from '@/lib/services/operationsService';

export default function ReturnsIntelligencePage() {
  const [data, setData] = useState<ReturnStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      try {
        const result = await getReturnsIntelligence();
        if (!cancelled) setData(result);
      } catch (error) {
        console.error('Failed to load returns intelligence:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a3c34]">ذكاء المرتجعات</h1>
        <p className="text-gray-500">Returns Intelligence - تحليل وتوصيات المرتجعات</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon="📦"
          label="إجمالي المرتجعات"
          value={data.totalReturns.toString()}
          subtext="آخر 30 يوم"
          color="#ef4444"
        />
        <MetricCard
          icon="📊"
          label="نسبة المرتجع"
          value={`${data.returnRate.toFixed(1)}%`}
          subtext={data.returnRate > 10 ? 'أعلى من الطبيعي' : 'ضمن المعدل'}
          color={data.returnRate > 10 ? '#ef4444' : '#10b981'}
        />
        <MetricCard
          icon="💸"
          label="تكلفة المرتجعات"
          value={formatCurrency(data.totalCost)}
          subtext="خسارة مباشرة"
          color="#f59e0b"
        />
        <MetricCard
          icon="📈"
          label="Top Reason"
          value={data.topReasons[0]?.reason.slice(0, 15) || 'N/A'}
          subtext={`${data.topReasons[0]?.count || 0} مرة`}
          color="#3b82f6"
        />
      </div>

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-4">
            <span>💡</span>
            توصيات ذكية
          </h3>
          <ul className="space-y-2">
            {data.suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2 text-amber-700">
                <span className="mt-1">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Return Reasons */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
            <span>📋</span>
            أسباب المرتجعات
          </h3>
          {data.topReasons.length > 0 ? (
            <div className="space-y-3">
              {data.topReasons.map((reason, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{reason.reason}</span>
                      <span className="text-sm text-gray-500">{reason.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${(reason.count / data.totalReturns) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد بيانات</p>
          )}
        </div>

        {/* By Region */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
            <span>🗺️</span>
            المناطق الأعلى مرتجعاً
          </h3>
          {data.byRegion.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2">المدينة</th>
                    <th className="text-center py-2">العدد</th>
                    <th className="text-center py-2">النسبة</th>
                    <th className="text-left py-2">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byRegion.slice(0, 5).map((region, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 font-medium">{region.city}</td>
                      <td className="text-center py-2">{region.returnCount}</td>
                      <td className="text-center py-2">{region.returnRate.toFixed(1)}%</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          region.returnRate >= 20 ? 'bg-red-100 text-red-700' :
                          region.returnRate >= 10 ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {region.returnRate >= 20 ? 'خطر' : region.returnRate >= 10 ? 'تحذير' : 'عادي'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* Products with High Returns */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
          <span>📦</span>
          المنتجات الأعلى مرتجعاً
        </h3>
        {data.byProduct.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-right py-3 px-4">المنتج</th>
                  <th className="text-center py-3 px-4">عدد المرتجعات</th>
                  <th className="text-center py-3 px-4">نسبة المرتجع</th>
                  <th className="text-center py-3 px-4">التكلفة</th>
                  <th className="text-center py-3 px-4">التوصية</th>
                </tr>
              </thead>
              <tbody>
                {data.byProduct.map((product, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-xs text-gray-400">{product.productId.slice(0, 8)}</p>
                    </td>
                    <td className="text-center py-3 px-4">{product.returnCount}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-0.5 rounded ${
                        product.returnRate >= 20 ? 'bg-red-100 text-red-700' :
                        product.returnRate >= 10 ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {product.returnRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-red-600">
                      {formatCurrency(product.totalCost)}
                    </td>
                    <td className="text-center py-3 px-4">
                      {product.returnRate >= 25 ? (
                        <span className="text-red-600">⛔ أوقف المنتج</span>
                      ) : product.returnRate >= 15 ? (
                        <span className="text-amber-600">⚠️ راجع الجودة</span>
                      ) : (
                        <span className="text-green-600">✅ طبيعي</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">لا توجد بيانات مرتجعات</p>
        )}
      </div>
    </div>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  subtext, 
  color 
}: { 
  icon: string; 
  label: string; 
  value: string; 
  subtext: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtext}</p>
        </div>
      </div>
    </div>
  );
}

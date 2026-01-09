'use client';

import { useEffect, useState } from 'react';
import { getCashFlowForecast, CashFlowForecastResult, CashAlert } from '@/lib/services/cashFlowService';

export default function CashFlowForecastPage() {
  const [forecast, setForecast] = useState<CashFlowForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState<7 | 30 | 60>(30);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      try {
        const data = await getCashFlowForecast(selectedDays);
        if (!cancelled) {
          setForecast(data);
        }
      } catch (error) {
        console.error('Failed to load forecast:', error);
      }
      if (!cancelled) {
        setLoading(false);
      }
    })();
    
    return () => { cancelled = true; };
  }, [selectedDays]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3c34]"></div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">لا توجد بيانات كافية للتوقع</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { 
      style: 'currency', 
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate chart dimensions
  const chartWidth = 100;
  const chartHeight = 200;
  const maxValue = Math.max(
    ...forecast.scenarios.map(s => Math.max(s.best, s.expected, s.worst)),
    forecast.safetyLevel
  );
  const minValue = Math.min(
    ...forecast.scenarios.map(s => Math.min(s.best, s.expected, s.worst)),
    0
  );
  const range = maxValue - minValue || 1;

  const getY = (value: number) => {
    return ((maxValue - value) / range) * chartHeight;
  };

  // Create SVG paths
  const createPath = (values: number[]) => {
    const step = chartWidth / (values.length - 1);
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${getY(v)}`).join(' ');
  };

  const worstPath = createPath(forecast.scenarios.map(s => s.worst));
  const expectedPath = createPath(forecast.scenarios.map(s => s.expected));
  const bestPath = createPath(forecast.scenarios.map(s => s.best));
  const safetyY = getY(forecast.safetyLevel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3c34]">توقع السيولة</h1>
          <p className="text-gray-500">Cash Flow Forecast</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {([7, 30, 60] as const).map(days => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDays === days
                  ? 'bg-[#1a3c34] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#1a3c34]'
              }`}
            >
              {days} يوم
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      {forecast.alerts.length > 0 && (
        <div className="space-y-3">
          {forecast.alerts.map((alert, idx) => (
            <AlertCard key={idx} alert={alert} />
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon="💰"
          label="السيولة الحالية"
          value={formatCurrency(forecast.currentCash)}
          subtext="Current Cash"
          color="#10b981"
        />
        <MetricCard
          icon="📈"
          label="متوسط الإيراد الشهري"
          value={formatCurrency(forecast.monthlyRevenue)}
          subtext="Monthly Revenue"
          color="#3b82f6"
        />
        <MetricCard
          icon="📉"
          label="متوسط المصروفات الشهرية"
          value={formatCurrency(forecast.monthlyBurnRate)}
          subtext="Monthly Burn"
          color="#f59e0b"
        />
        <MetricCard
          icon="⏳"
          label="Runway"
          value={forecast.runway >= 999 ? '∞' : `${forecast.runway.toFixed(1)} شهر`}
          subtext={forecast.runway < 6 ? 'تحذير: منخفض' : 'صحي'}
          color={forecast.runway < 6 ? '#ef4444' : '#10b981'}
        />
      </div>

      {/* Scenario Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-[#1a3c34]">
          السيناريوهات المتوقعة
          <span className="text-sm font-normal text-gray-500 mr-2">
            (أفضل / متوقع / أسوأ)
          </span>
        </h3>
        
        <div className="relative" style={{ height: chartHeight + 60, direction: 'ltr' }}>
          {/* Legend */}
          <div className="absolute top-0 left-0 flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              أفضل
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              متوقع
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              أسوأ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-8 h-0.5 bg-amber-500" style={{ borderStyle: 'dashed' }}></span>
              الحد الآمن
            </span>
          </div>

          {/* SVG Chart */}
          <svg 
            className="w-full mt-8" 
            viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}
            preserveAspectRatio="none"
            style={{ height: chartHeight }}
          >
            {/* Safety line */}
            <line 
              x1="0" y1={safetyY} 
              x2={chartWidth} y2={safetyY}
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            
            {/* Worst case */}
            <path
              d={worstPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
            />
            
            {/* Expected case */}
            <path
              d={expectedPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
            />
            
            {/* Best case */}
            <path
              d={bestPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />
            
            {/* Fill between worst and best */}
            <path
              d={`${bestPath} L ${chartWidth} ${getY(forecast.scenarios[forecast.scenarios.length - 1].worst)} ${worstPath.split(' ').reverse().join(' ')} Z`}
              fill="url(#gradient)"
              opacity="0.1"
            />
            
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>اليوم</span>
            <span>{Math.floor(selectedDays / 2)} يوم</span>
            <span>{selectedDays} يوم</span>
          </div>
        </div>

        {/* End values */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-500">أفضل سيناريو</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(forecast.scenarios[forecast.scenarios.length - 1]?.best || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">السيناريو المتوقع</p>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(forecast.scenarios[forecast.scenarios.length - 1]?.expected || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">أسوأ سيناريو</p>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(forecast.scenarios[forecast.scenarios.length - 1]?.worst || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Historical Cash Flow */}
      {forecast.historicalData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-[#1a3c34]">التدفق النقدي التاريخي</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4">الشهر</th>
                  <th className="text-right py-3 px-4">الداخل</th>
                  <th className="text-right py-3 px-4">الخارج</th>
                  <th className="text-right py-3 px-4">الصافي</th>
                </tr>
              </thead>
              <tbody>
                {forecast.historicalData.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{row.date}</td>
                    <td className="py-3 px-4 text-green-600">{formatCurrency(row.cashIn)}</td>
                    <td className="py-3 px-4 text-red-600">{formatCurrency(row.cashOut)}</td>
                    <td className={`py-3 px-4 font-semibold ${row.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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

function AlertCard({ alert }: { alert: CashAlert }) {
  const styles = {
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '🚨',
      titleColor: 'text-red-800',
      textColor: 'text-red-600'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: '⚠️',
      titleColor: 'text-amber-800',
      textColor: 'text-amber-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'ℹ️',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-600'
    }
  };

  const style = styles[alert.type];

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4 flex items-start gap-3`}>
      <span className="text-xl">{style.icon}</span>
      <div>
        <h4 className={`font-semibold ${style.titleColor}`}>{alert.title}</h4>
        <p className={`text-sm ${style.textColor} mt-1`}>{alert.message}</p>
      </div>
      {alert.daysUntil && (
        <div className="mr-auto text-center">
          <span className="text-2xl font-bold" style={{ color: alert.type === 'danger' ? '#ef4444' : '#f59e0b' }}>
            {alert.daysUntil}
          </span>
          <p className="text-xs text-gray-500">يوم</p>
        </div>
      )}
    </div>
  );
}

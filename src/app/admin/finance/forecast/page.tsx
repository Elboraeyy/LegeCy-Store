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
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="empty-state-container">
        <span className="empty-icon">📊</span>
        <p>Not enough data for forecast</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
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

  const createPath = (values: number[]) => {
    const step = chartWidth / (values.length - 1);
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${getY(v)}`).join(' ');
  };

  const worstPath = createPath(forecast.scenarios.map(s => s.worst));
  const expectedPath = createPath(forecast.scenarios.map(s => s.expected));
  const bestPath = createPath(forecast.scenarios.map(s => s.best));
  const safetyY = getY(forecast.safetyLevel);

  return (
    <>
      {/* Page Description & Period Selector */}
      <div className="page-header-row">
        <p className="page-description">
          Predict your future liquidity position
        </p>
        <div className="period-selector">
          {([7, 30, 60] as const).map(days => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={`period-btn ${selectedDays === days ? 'active' : ''}`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      {forecast.alerts.length > 0 && (
        <div className="alerts-section">
          {forecast.alerts.map((alert, idx) => (
            <AlertCard key={idx} alert={alert} />
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="admin-grid stats-grid">
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-icon">💰</span>
            <div className="stat-content">
              <span className="stat-label">Current Cash</span>
              <span className="stat-value positive">{formatCurrency(forecast.currentCash)}</span>
              <span className="stat-hint">Available Balance</span>
            </div>
          </div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-icon">📈</span>
            <div className="stat-content">
              <span className="stat-label">Monthly Revenue</span>
              <span className="stat-value info">{formatCurrency(forecast.monthlyRevenue)}</span>
              <span className="stat-hint">Average Inflow</span>
            </div>
          </div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-icon">📉</span>
            <div className="stat-content">
              <span className="stat-label">Monthly Burn Rate</span>
              <span className="stat-value warning">{formatCurrency(forecast.monthlyBurnRate)}</span>
              <span className="stat-hint">Average Outflow</span>
            </div>
          </div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-icon">⏳</span>
            <div className="stat-content">
              <span className="stat-label">Runway</span>
              <span className={`stat-value ${forecast.runway < 6 ? 'negative' : 'positive'}`}>
                {forecast.runway >= 999 ? '∞' : `${forecast.runway.toFixed(1)} months`}
              </span>
              <span className="stat-hint">{forecast.runway < 6 ? 'Warning: Low' : 'Healthy'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Chart */}
      <div className="admin-card chart-card">
        <div className="card-header">
          <h3>Scenario Projections</h3>
          <span className="chart-subtitle">(Best / Expected / Worst)</span>
        </div>
        
        <div className="chart-container">
          {/* Legend */}
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#10b981' }}></span>
              Best
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#3b82f6' }}></span>
              Expected
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#ef4444' }}></span>
              Worst
            </span>
            <span className="legend-item">
              <span className="legend-line"></span>
              Safety Level
            </span>
          </div>

          {/* SVG Chart */}
          <svg 
            className="chart-svg" 
            viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}
            preserveAspectRatio="none"
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
          <div className="chart-x-axis">
            <span>Today</span>
            <span>{Math.floor(selectedDays / 2)} Days</span>
            <span>{selectedDays} Days</span>
          </div>
        </div>

        {/* End values */}
        <div className="forecast-results">
          <div className="result-item best">
            <p className="result-label">Best Case</p>
            <p className="result-value">
              {formatCurrency(forecast.scenarios[forecast.scenarios.length - 1]?.best || 0)}
            </p>
          </div>
          <div className="result-item expected">
            <p className="result-label">Expected Case</p>
            <p className="result-value">
              {formatCurrency(forecast.scenarios[forecast.scenarios.length - 1]?.expected || 0)}
            </p>
          </div>
          <div className="result-item worst">
            <p className="result-label">Worst Case</p>
            <p className="result-value">
              {formatCurrency(forecast.scenarios[forecast.scenarios.length - 1]?.worst || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Historical Cash Flow */}
      {forecast.historicalData.length > 0 && (
        <div className="admin-table-container">
          <div className="table-header">
            <h3>Historical Cash Flow</h3>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="text-right">Cash In</th>
                <th className="text-right">Cash Out</th>
                <th className="text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {forecast.historicalData.map((row, idx) => (
                <tr key={idx}>
                  <td className="font-medium">{row.date}</td>
                  <td className="text-right positive">{formatCurrency(row.cashIn)}</td>
                  <td className="text-right negative">{formatCurrency(row.cashOut)}</td>
                  <td className={`text-right font-bold ${row.net >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(row.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .admin-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .admin-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(18, 64, 60, 0.1);
          border-top-color: #12403C;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state-container {
          text-align: center;
          padding: 48px 24px;
          color: var(--admin-text-muted, #4A6B68);
        }

        .empty-icon {
          display: block;
          font-size: 48px;
          margin-bottom: 12px;
        }

        .page-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }

        .page-description {
          color: var(--admin-text-muted, #4A6B68);
          margin: 0;
          font-size: 14px;
        }

        .period-selector {
          display: flex;
          gap: 8px;
        }

        .period-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid rgba(18, 64, 60, 0.08);
          cursor: pointer;
          transition: all 0.2s;
          background: white;
          color: var(--admin-text-muted, #4A6B68);
        }

        .period-btn:hover {
          border-color: #12403C;
        }

        .period-btn.active {
          background: #12403C;
          color: white;
          border-color: #12403C;
        }

        .alerts-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          margin-bottom: 24px;
        }

        .stat-card {
          padding: 20px;
        }

        .stat-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .stat-icon {
          font-size: 28px;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          display: block;
          font-size: 13px;
          color: var(--admin-text-muted, #4A6B68);
        }

        .stat-value {
          display: block;
          font-size: 22px;
          font-weight: 700;
          margin-top: 4px;
        }

        .stat-value.positive { color: #10b981; }
        .stat-value.negative { color: #ef4444; }
        .stat-value.warning { color: #f59e0b; }
        .stat-value.info { color: #3b82f6; }

        .stat-hint {
          display: block;
          font-size: 11px;
          color: var(--admin-text-muted, #4A6B68);
          margin-top: 4px;
        }

        .chart-card {
          margin-bottom: 24px;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(18, 64, 60, 0.08);
          margin-bottom: 16px;
        }

        .card-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--admin-text-on-light, #12403C);
        }

        .chart-subtitle {
          font-size: 13px;
          color: var(--admin-text-muted, #4A6B68);
          font-weight: 400;
        }

        .chart-container {
          position: relative;
        }

        .chart-legend {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .legend-line {
          width: 24px;
          height: 2px;
          background: #f59e0b;
          border-style: dashed;
        }

        .chart-svg {
          width: 100%;
          height: 200px;
        }

        .chart-x-axis {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--admin-text-muted, #4A6B68);
          margin-top: 8px;
        }

        .forecast-results {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid rgba(18, 64, 60, 0.08);
        }

        .result-item {
          text-align: center;
        }

        .result-label {
          font-size: 13px;
          color: var(--admin-text-muted, #4A6B68);
          margin: 0 0 4px;
        }

        .result-value {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }

        .result-item.best .result-value { color: #10b981; }
        .result-item.expected .result-value { color: #3b82f6; }
        .result-item.worst .result-value { color: #ef4444; }

        .admin-table-container {
          margin-bottom: 24px;
        }

        .table-header {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(18, 64, 60, 0.08);
        }

        .table-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--admin-text-on-light, #12403C);
        }

        .text-right { text-align: right; }
        .font-medium { font-weight: 500; }
        .font-bold { font-weight: 700; }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
      `}</style>
    </>
  );
}

function AlertCard({ alert }: { alert: CashAlert }) {
  const styles = {
    danger: {
      bg: 'rgba(239, 68, 68, 0.05)',
      border: 'rgba(239, 68, 68, 0.2)',
      icon: '🚨',
      titleColor: '#991b1b',
      textColor: '#dc2626'
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.05)',
      border: 'rgba(245, 158, 11, 0.2)',
      icon: '⚠️',
      titleColor: '#92400e',
      textColor: '#d97706'
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.05)',
      border: 'rgba(59, 130, 246, 0.2)',
      icon: 'ℹ️',
      titleColor: '#1e40af',
      textColor: '#3b82f6'
    }
  };

  const style = styles[alert.type];

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '16px',
      padding: '16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    }}>
      <span style={{ fontSize: '20px' }}>{style.icon}</span>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px', fontWeight: 600, color: style.titleColor }}>{alert.title}</h4>
        <p style={{ margin: 0, fontSize: '13px', color: style.textColor }}>{alert.message}</p>
      </div>
      {alert.daysUntil && (
        <div style={{ textAlign: 'center' }}>
          <span style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: alert.type === 'danger' ? '#ef4444' : '#f59e0b' 
          }}>
            {alert.daysUntil}
          </span>
          <p style={{ fontSize: '11px', color: 'var(--admin-text-muted)', margin: 0 }}>days</p>
        </div>
      )}
    </div>
  );
}

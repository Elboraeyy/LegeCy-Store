'use client';

import { formatCurrency } from '@/lib/utils';

interface PnLData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  orderCount: number;
  expensesBreakdown: { category: string; amount: number }[];
}

interface LedgerPnLData {
  ledgerRevenue: number;
  ledgerCOGS: number;
  ledgerExpenses: number;
  ledgerGrossProfit: number;
  ledgerNetProfit: number;
  recognizedOrders: number;
  recognizedRevenue: number;
  recognizedCOGS: number;
  recognizedProfit: number;
}

interface Props {
  data: PnLData;
  ledger: LedgerPnLData;
  period: string;
  periodLabel: string;
}

export default function PnLClient({ data, ledger, period, periodLabel }: Props) {
  return (
    <>
      {/* Page Description & Period Selector */}
      <div className="page-header-row">
        <p className="page-description">{periodLabel}</p>
        <div className="period-selector">
          {['week', 'month', 'quarter', 'year'].map(p => (
            <a 
              key={p}
              href={`/admin/finance/reports/pnl?period=${p}`}
              className={`period-btn ${period === p ? 'active' : ''}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </a>
          ))}
        </div>
      </div>

      <div className="report-grid">
        {/* Main P&L Statement */}
        <div className="admin-card statement-card">
          <div className="card-header">
            <h3>📊 Statement</h3>
          </div>
          
          <div className="statement-content">
            {/* Revenue Section */}
            <div className="pnl-section">
              <div className="section-header">Revenue</div>
              <div className="pnl-row">
                <span>Sales Revenue ({data.orderCount} orders)</span>
                <span className="amount positive">{formatCurrency(data.revenue)}</span>
              </div>
              <div className="pnl-subtotal">
                <span>Total Revenue</span>
                <span>{formatCurrency(data.revenue)}</span>
              </div>
            </div>

            {/* COGS Section */}
            <div className="pnl-section">
              <div className="section-header">Cost of Goods Sold</div>
              <div className="pnl-row">
                <span>Product Costs</span>
                <span className="amount negative">({formatCurrency(data.cogs)})</span>
              </div>
              <div className="pnl-subtotal highlight">
                <span>Gross Profit</span>
                <span>{formatCurrency(data.grossProfit)}</span>
              </div>
              <div className="pnl-note">Gross Margin: {data.grossMargin.toFixed(1)}%</div>
            </div>

            {/* Operating Expenses */}
            <div className="pnl-section">
              <div className="section-header">Operating Expenses</div>
              {data.expensesBreakdown.map((exp, i) => (
                <div className="pnl-row" key={i}>
                  <span>{exp.category}</span>
                  <span className="amount negative">({formatCurrency(exp.amount)})</span>
                </div>
              ))}
              {data.expensesBreakdown.length === 0 && (
                <div className="pnl-row">
                  <span className="text-muted">No expenses recorded</span>
                  <span>—</span>
                </div>
              )}
              <div className="pnl-subtotal">
                <span>Total Operating Expenses</span>
                <span className="amount negative">({formatCurrency(data.totalExpenses)})</span>
              </div>
            </div>

            {/* Net Income */}
            <div className={`pnl-result ${data.netProfit >= 0 ? 'positive' : 'negative'}`}>
              <span>Net {data.netProfit >= 0 ? 'Profit' : 'Loss'}</span>
              <span>{formatCurrency(data.netProfit)}</span>
            </div>
            <div className="pnl-note">Net Margin: {data.netMargin.toFixed(1)}%</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="admin-card">
          <div className="card-header">
            <h3>📈 Key Metrics</h3>
          </div>
          <div className="metrics-list">
            <MetricItem label="Revenue" value={formatCurrency(data.revenue)} trend="neutral" />
            <MetricItem label="Gross Profit" value={formatCurrency(data.grossProfit)} trend={data.grossProfit > 0 ? 'up' : 'down'} />
            <MetricItem label="Gross Margin" value={`${data.grossMargin.toFixed(1)}%`} trend={data.grossMargin > 30 ? 'up' : 'down'} />
            <MetricItem label="Net Profit" value={formatCurrency(data.netProfit)} trend={data.netProfit > 0 ? 'up' : 'down'} />
            <MetricItem label="Net Margin" value={`${data.netMargin.toFixed(1)}%`} trend={data.netMargin > 10 ? 'up' : 'down'} />
          </div>
        </div>

        {/* Export Options */}
        <div className="admin-card">
          <div className="card-header">
            <h3>📥 Export</h3>
          </div>
          <div className="export-buttons">
            <button className="admin-btn admin-btn-outline" disabled>
              📄 Export PDF (Coming Soon)
            </button>
            <button className="admin-btn admin-btn-outline" disabled>
              📊 Export CSV (Coming Soon)
            </button>
          </div>
        </div>

        {/* Ledger Verification */}
        <div className="admin-card full-width">
          <div className="card-header">
            <h3>📖 Ledger Verification</h3>
            <span className="badge-info">Source of Truth</span>
          </div>
          <p className="ledger-note">
            These numbers come from the accounting ledger. Any difference from operational view indicates unrecognized revenue.
          </p>
          
          <div className="ledger-grid">
            <div className="ledger-item">
              <div className="ledger-label">Ledger Revenue</div>
              <div className="ledger-value positive">{formatCurrency(ledger.ledgerRevenue)}</div>
            </div>
            <div className="ledger-item">
              <div className="ledger-label">Ledger COGS</div>
              <div className="ledger-value negative">{formatCurrency(ledger.ledgerCOGS)}</div>
            </div>
            <div className="ledger-item">
              <div className="ledger-label">Ledger Expenses</div>
              <div className="ledger-value warning">{formatCurrency(ledger.ledgerExpenses)}</div>
            </div>
            <div className={`ledger-item highlight ${ledger.ledgerNetProfit >= 0 ? 'positive' : 'negative'}`}>
              <div className="ledger-label">Ledger Net Profit</div>
              <div className="ledger-value">{formatCurrency(ledger.ledgerNetProfit)}</div>
            </div>
          </div>

          <div className="recognized-info">
            <span>
              📊 <strong>{ledger.recognizedOrders}</strong> orders with recognized revenue 
              (Total: {formatCurrency(ledger.recognizedRevenue)})
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
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
          text-decoration: none;
          transition: all 0.2s;
          background: rgba(18, 64, 60, 0.05);
          color: var(--admin-text-muted, #4A6B68);
        }

        .period-btn:hover {
          background: rgba(18, 64, 60, 0.1);
        }

        .period-btn.active {
          background: #12403C;
          color: white;
        }

        .report-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .statement-card {
          grid-row: span 2;
        }

        .full-width {
          grid-column: span 2;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
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

        .badge-info {
          font-size: 12px;
          padding: 4px 12px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-radius: 20px;
        }

        .statement-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pnl-section {
          padding: 16px 0;
          border-bottom: 1px solid rgba(18, 64, 60, 0.08);
        }

        .section-header {
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          color: var(--admin-text-muted, #4A6B68);
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }

        .pnl-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0 8px 16px;
        }

        .pnl-subtotal {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          font-weight: 600;
          border-top: 1px solid rgba(18, 64, 60, 0.08);
          margin-top: 8px;
        }

        .pnl-subtotal.highlight {
          padding: 12px;
          background: rgba(34, 197, 94, 0.05);
          border-radius: 8px;
          border-top: none;
        }

        .pnl-note {
          font-size: 12px;
          color: var(--admin-text-muted, #4A6B68);
          text-align: right;
          padding: 4px 0;
        }

        .pnl-result {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          font-size: 18px;
          font-weight: 700;
          border-radius: 8px;
          margin-top: 16px;
        }

        .pnl-result.positive {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .pnl-result.negative {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .amount.positive { color: #22c55e; }
        .amount.negative { color: #ef4444; }
        .text-muted { color: var(--admin-text-muted, #4A6B68); }

        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .export-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ledger-note {
          color: var(--admin-text-muted, #4A6B68);
          font-size: 14px;
          margin-bottom: 16px;
        }

        .ledger-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .ledger-item {
          padding: 16px;
          background: rgba(18, 64, 60, 0.03);
          border-radius: 8px;
        }

        .ledger-item.highlight {
          border: 2px solid;
        }

        .ledger-item.highlight.positive {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }

        .ledger-item.highlight.negative {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .ledger-label {
          font-size: 12px;
          color: var(--admin-text-muted, #4A6B68);
          margin-bottom: 4px;
        }

        .ledger-value {
          font-size: 20px;
          font-weight: 700;
        }

        .ledger-value.positive { color: #22c55e; }
        .ledger-value.negative { color: #ef4444; }
        .ledger-value.warning { color: #f59e0b; }

        .recognized-info {
          margin-top: 16px;
          padding: 12px;
          background: rgba(59, 130, 246, 0.05);
          border-radius: 8px;
          font-size: 14px;
        }

        @media (max-width: 1024px) {
          .report-grid {
            grid-template-columns: 1fr;
          }

          .statement-card {
            grid-row: auto;
          }

          .full-width {
            grid-column: auto;
          }

          .ledger-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .page-header-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .ledger-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

function MetricItem({ label, value, trend }: { label: string; value: string; trend: 'up' | 'down' | 'neutral' }) {
  const trendIcons = { up: '↑', down: '↓', neutral: '→' };
  const trendColors = { up: '#22c55e', down: '#ef4444', neutral: 'var(--admin-text-muted)' };
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '8px 0', 
      borderBottom: '1px solid rgba(18, 64, 60, 0.08)' 
    }}>
      <span style={{ color: 'var(--admin-text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
        {value}
        <span style={{ color: trendColors[trend] }}>{trendIcons[trend]}</span>
      </span>
    </div>
  );
}

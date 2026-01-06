
import { getFinancialMetrics } from '@/lib/actions/finance';
import { formatCurrency } from '@/lib/utils'; // Corrected import

export const dynamic = 'force-dynamic';

export default async function FinanceDashboard() {
  const metrics = await getFinancialMetrics();

  return (
    <div className="fade-in">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Treasury Overview</h1>
          <p className="admin-subtitle">Live financial snapshot</p>
        </div>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '40px' }}>
        {/* Cash on Hand */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Cash on Hand</div>
              <div className="stat-value" style={{ color: '#166534' }}>{formatCurrency(Number(metrics.cashOnHand))}</div>
            </div>
            <div style={{ fontSize: '32px' }}>💰</div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                <div className="stat-label">Net Profit (All Time)</div>
                <div className="stat-value" style={{ color: metrics.netProfit >= 0 ? '#166534' : '#991b1b' }}>
                    {formatCurrency(Number(metrics.netProfit))}
                </div>
                </div>
                <div style={{ fontSize: '32px' }}>📈</div>
            </div>
        </div>

        {/* Total Equity */}
        <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                <div className="stat-label">Total Equity</div>
                <div className="stat-value">{formatCurrency(Number(metrics.equity))}</div>
                </div>
                <div style={{ fontSize: '32px' }}>🤝</div>
            </div>
        </div>

        {/* Operational Expenses */}
        <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                <div className="stat-label">Total Expenses</div>
                <div className="stat-value" style={{ color: '#991b1b' }}>{formatCurrency(Number(metrics.expenses))}</div>
                </div>
                <div style={{ fontSize: '32px' }}>💸</div>
            </div>
        </div>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="admin-card">
            <h3 className="font-heading" style={{ fontSize: '18px', marginBottom: '20px' }}>Recent Ledger Activity</h3>
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                Ledger Table Preview will go here.
            </div>
        </div>

        <div className="admin-card">
            <h3 className="font-heading" style={{ fontSize: '18px', marginBottom: '20px' }}>Revenue vs Expenses</h3>
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                Chart will go here.
            </div>
        </div>
      </div>
    </div>
  );
}

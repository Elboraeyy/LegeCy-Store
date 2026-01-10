'use client';

import Link from 'next/link';

interface TreasuryAccount {
  name: string;
  balance: number;
  type: string;
}

interface FinanceStats {
  cashOnHand: number;
  monthlyRevenue: number;
  orderCount: number;
  revenueTrend: number;
  monthlyExpenses: number;
  expenseTrend: number;
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
  inventoryValue: number;
  inventoryItems: number;
  accountsReceivable: number;
  accountsPayable: number;
  totalCapital: number;
  investorCount: number;
  pendingExpenses: number;
  treasuryAccounts: TreasuryAccount[];
}

const navigationSections = [
  {
    title: 'Core Operations',
    items: [
      { label: 'Capital & Partners', href: '/admin/finance/capital', icon: '💰', description: 'Manage equity and shareholder capital' },
      { label: 'Expenses', href: '/admin/finance/expenses', icon: '💸', description: 'Track operational costs and outflows' },
      { label: 'General Ledger', href: '/admin/finance/transactions', icon: '📒', description: 'Journal entries and transactions' },
      { label: 'Chart of Accounts', href: '/admin/finance/accounts', icon: '🏛️', description: 'Account structure and balances' },
    ]
  },
  {
    title: 'Assets & Valuation',
    items: [
      { label: 'Inventory Value', href: '/admin/finance/inventory', icon: '📦', description: 'Stock valuation at cost' },
      { label: 'Equity Overview', href: '/admin/finance/equity', icon: '📈', description: 'Net worth and equity breakdown' },
      { label: 'Partners', href: '/admin/finance/partners', icon: '🤝', description: 'Partner accounts and distributions' },
    ]
  },
  {
    title: 'Financial Reports',
    items: [
      { label: 'Profit & Loss', href: '/admin/finance/reports/pnl', icon: '📊', description: 'Revenue, costs, and profitability' },
      { label: 'Balance Sheet', href: '/admin/finance/reports/balance', icon: '⚖️', description: 'Assets, liabilities, and equity' },
      { label: 'Cash Flow', href: '/admin/finance/reports/cashflow', icon: '💵', description: 'Cash movements and liquidity' },
      { label: 'Board Report', href: '/admin/finance/reports/board', icon: '📋', description: 'Executive summary for stakeholders' },
    ]
  },
  {
    title: 'Analysis & Planning',
    items: [
      { label: 'Cash Forecast', href: '/admin/finance/forecast', icon: '🔮', description: 'Predict future cash position' },
      { label: 'Break-Even', href: '/admin/finance/break-even', icon: '🎯', description: 'Sales targets to cover costs' },
      { label: 'Profit Quality', href: '/admin/finance/profit-quality', icon: '✨', description: 'Profit composition analysis' },
      { label: 'Fiscal Periods', href: '/admin/finance/periods', icon: '📅', description: 'Manage accounting periods' },
    ]
  }
];

export default function FinanceDashboardClient({ stats }: { stats: FinanceStats }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { 
      style: 'currency', 
      currency: 'EGP',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const formatTrend = (value: number) => {
    if (value > 0) return `+${value.toFixed(1)}%`;
    if (value < 0) return `${value.toFixed(1)}%`;
    return '0%';
  };

  return (
    <div className="finance-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>💼 Finance</h1>
          <p>Complete financial overview and management</p>
        </div>
        <div className="header-actions">
          <Link href="/admin/finance/expenses" className="admin-btn admin-btn-outline">
            + Record Expense
          </Link>
          <Link href="/admin/finance/capital" className="admin-btn admin-btn-primary">
            + Capital Transaction
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <span className="metric-label">Cash on Hand</span>
            <span className="metric-value">{formatCurrency(stats.cashOnHand)}</span>
            <span className="metric-detail">{stats.treasuryAccounts.length} accounts</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <span className="metric-label">Monthly Revenue</span>
            <span className="metric-value">{formatCurrency(stats.monthlyRevenue)}</span>
            <span className={`metric-trend ${stats.revenueTrend >= 0 ? 'positive' : 'negative'}`}>
              {formatTrend(stats.revenueTrend)} vs last month
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💸</div>
          <div className="metric-content">
            <span className="metric-label">Monthly Expenses</span>
            <span className="metric-value expense">{formatCurrency(stats.monthlyExpenses)}</span>
            <span className={`metric-trend ${stats.expenseTrend <= 0 ? 'positive' : 'negative'}`}>
              {formatTrend(stats.expenseTrend)} vs last month
            </span>
          </div>
        </div>

        <div className={`metric-card ${stats.netProfit >= 0 ? 'success' : 'danger'}`}>
          <div className="metric-icon">{stats.netProfit >= 0 ? '✅' : '⚠️'}</div>
          <div className="metric-content">
            <span className="metric-label">Net Profit</span>
            <span className="metric-value">{formatCurrency(stats.netProfit)}</span>
            <span className="metric-detail">{stats.netMargin.toFixed(1)}% margin</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <span className="metric-label">Inventory Value</span>
            <span className="metric-value info">{formatCurrency(stats.inventoryValue)}</span>
            <span className="metric-detail">{stats.inventoryItems} items at cost</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚖️</div>
          <div className="metric-content">
            <span className="metric-label">Receivables / Payables</span>
            <div className="metric-dual">
              <span className="positive">{formatCurrency(stats.accountsReceivable)}</span>
              <span className="divider">/</span>
              <span className="negative">{formatCurrency(stats.accountsPayable)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Treasury Accounts */}
      {stats.treasuryAccounts.length > 0 && (
        <div className="treasury-section">
          <h3>💳 Treasury Accounts</h3>
          <div className="treasury-grid">
            {stats.treasuryAccounts.map((acc, i) => (
              <div key={i} className="treasury-card">
                <span className="treasury-name">{acc.name}</span>
                <span className="treasury-balance">{formatCurrency(acc.balance)}</span>
                <span className="treasury-type">{acc.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Items Alert */}
      {stats.pendingExpenses > 0 && (
        <div className="alert-banner">
          <span className="alert-icon">⏳</span>
          <span className="alert-text">
            <strong>{stats.pendingExpenses}</strong> expense{stats.pendingExpenses > 1 ? 's' : ''} pending approval
          </span>
          <Link href="/admin/finance/expenses" className="alert-action">Review →</Link>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="nav-sections">
        {navigationSections.map((section, idx) => (
          <div key={idx} className="nav-section">
            <h3>{section.title}</h3>
            <div className="nav-grid">
              {section.items.map((item, i) => (
                <Link key={i} href={item.href} className="nav-card">
                  <span className="nav-icon">{item.icon}</span>
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                  <span className="nav-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .finance-dashboard {
          padding: 0;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-content h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: var(--admin-text-on-light, #12403C);
        }

        .header-content p {
          margin: 4px 0 0;
          color: var(--admin-text-muted, #4A6B68);
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .metric-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          box-shadow: 0 1px 3px rgba(18, 64, 60, 0.08);
          border: 1px solid rgba(18, 64, 60, 0.08);
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          box-shadow: 0 4px 12px rgba(18, 64, 60, 0.12);
          transform: translateY(-2px);
        }

        .metric-card.primary {
          background: linear-gradient(135deg, #12403C 0%, #1a5a54 100%);
          color: white;
        }

        .metric-card.primary .metric-label,
        .metric-card.primary .metric-detail {
          color: rgba(255, 255, 255, 0.8);
        }

        .metric-card.primary .metric-value {
          color: #F6E5C6;
        }

        .metric-card.success {
          border: 2px solid #22c55e;
          background: rgba(34, 197, 94, 0.05);
        }

        .metric-card.danger {
          border: 2px solid #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .metric-icon {
          font-size: 32px;
          line-height: 1;
        }

        .metric-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          font-size: 13px;
          color: var(--admin-text-muted, #4A6B68);
          font-weight: 500;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--admin-text-on-light, #12403C);
        }

        .metric-value.expense { color: #ef4444; }
        .metric-value.info { color: #3b82f6; }

        .metric-detail {
          font-size: 12px;
          color: var(--admin-text-muted, #4A6B68);
        }

        .metric-trend {
          font-size: 12px;
          font-weight: 500;
        }

        .metric-trend.positive { color: #22c55e; }
        .metric-trend.negative { color: #ef4444; }

        .metric-dual {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
        }

        .metric-dual .positive { color: #22c55e; }
        .metric-dual .negative { color: #ef4444; }
        .metric-dual .divider { color: var(--admin-text-muted); }

        .treasury-section {
          margin-bottom: 32px;
        }

        .treasury-section h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px;
          color: var(--admin-text-on-light, #12403C);
        }

        .treasury-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .treasury-card {
          background: rgba(18, 64, 60, 0.03);
          padding: 16px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .treasury-name {
          font-weight: 600;
          font-size: 14px;
        }

        .treasury-balance {
          font-size: 18px;
          font-weight: 700;
          color: #22c55e;
        }

        .treasury-type {
          font-size: 11px;
          color: var(--admin-text-muted);
          text-transform: uppercase;
        }

        .alert-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 32px;
        }

        .alert-icon { font-size: 20px; }
        .alert-text { flex: 1; font-size: 14px; }
        .alert-action {
          color: #d97706;
          font-weight: 600;
          text-decoration: none;
        }

        .nav-sections {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .nav-section h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px;
          color: var(--admin-text-on-light, #12403C);
        }

        .nav-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .nav-card {
          background: white;
          border: 1px solid rgba(18, 64, 60, 0.08);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }

        .nav-card:hover {
          border-color: #12403C;
          box-shadow: 0 4px 12px rgba(18, 64, 60, 0.1);
          transform: translateY(-2px);
        }

        .nav-icon {
          font-size: 28px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(18, 64, 60, 0.05);
          border-radius: 12px;
        }

        .nav-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-label {
          font-weight: 600;
          font-size: 15px;
          color: var(--admin-text-on-light, #12403C);
        }

        .nav-description {
          font-size: 13px;
          color: var(--admin-text-muted, #4A6B68);
        }

        .nav-arrow {
          color: var(--admin-text-muted);
          font-size: 18px;
          transition: transform 0.2s;
        }

        .nav-card:hover .nav-arrow {
          transform: translateX(4px);
          color: #12403C;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .nav-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

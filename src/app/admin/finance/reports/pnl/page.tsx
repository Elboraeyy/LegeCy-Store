import { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Profit & Loss Report | Finance',
};

export const dynamic = 'force-dynamic';

// Get P&L data from orders (operational view)
async function getOperationalPnL(startDate: Date, endDate: Date) {
  // Get Revenue (all paid orders)
  const revenueData = await prisma.order.aggregate({
    where: {
      status: { in: ['Paid', 'Shipped', 'Delivered'] },
      createdAt: { gte: startDate, lte: endDate }
    },
    _sum: { totalPrice: true },
    _count: true
  });

  // Get Cost of Goods Sold (from order items with cost info)
  const ordersWithItems = await prisma.order.findMany({
    where: {
      status: { in: ['Paid', 'Shipped', 'Delivered'] },
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      items: {
        include: {
          variant: true
        }
      }
    }
  });

  let cogs = 0;
  ordersWithItems.forEach(order => {
    order.items.forEach(item => {
      const cost = Number(item.variant?.costPrice || 0);
      cogs += cost * item.quantity;
    });
  });

  // Get Expenses
  const expensesData = await prisma.expense.aggregate({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'APPROVED'
    },
    _sum: { amount: true }
  });

  // Group expenses by category
  const expensesByCategory = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'APPROVED'
    },
    _sum: { amount: true }
  });

  // Get category names
  const categoryIds = expensesByCategory.map(e => e.categoryId);
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds } }
  });

  const expensesBreakdown = expensesByCategory.map(e => ({
    category: categories.find(c => c.id === e.categoryId)?.name || 'Uncategorized',
    amount: Number(e._sum?.amount || 0)
  }));

  // Calculate metrics
  const revenue = Number(revenueData._sum?.totalPrice || 0);
  const grossProfit = revenue - cogs;
  const totalExpenses = Number(expensesData._sum?.amount || 0);
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    revenue,
    cogs,
    grossProfit,
    totalExpenses,
    netProfit,
    grossMargin,
    netMargin,
    orderCount: revenueData._count,
    expensesBreakdown
  };
}

// Get P&L data from ledger accounts (accounting view - the source of truth)
async function getLedgerBasedPnL() {
  // Get Revenue accounts (type: REVENUE)
  const revenueAccounts = await prisma.account.findMany({
    where: { type: 'REVENUE' }
  });
  const ledgerRevenue = revenueAccounts.reduce((sum: number, acc: { balance: unknown }) => sum + Number(acc.balance), 0);
  // Get COGS account (code: 5000)
  const cogsAccount = await prisma.account.findFirst({
    where: { code: '5000' }
  });
  const ledgerCOGS = Number(cogsAccount?.balance || 0);

  // Get Expense accounts (type: EXPENSE, excluding COGS)
  const expenseAccounts = await prisma.account.findMany({
    where: { 
      type: 'EXPENSE',
      code: { not: '5000' }
    }
  });
  const ledgerExpenses = expenseAccounts.reduce((sum: number, acc: { balance: unknown }) => sum + Number(acc.balance), 0);

  const ledgerGrossProfit = ledgerRevenue - ledgerCOGS;
  const ledgerNetProfit = ledgerGrossProfit - ledgerExpenses;

  // Get recognized revenue stats
  const recognizedRevenue = await prisma.revenueRecognition.aggregate({
    _sum: { netRevenue: true, cogsAmount: true, grossProfit: true },
    _count: true
  });

  return {
    ledgerRevenue,
    ledgerCOGS,
    ledgerExpenses,
    ledgerGrossProfit,
    ledgerNetProfit,
    recognizedOrders: recognizedRevenue._count,
    recognizedRevenue: Number(recognizedRevenue._sum?.netRevenue || 0),
    recognizedCOGS: Number(recognizedRevenue._sum?.cogsAmount || 0),
    recognizedProfit: Number(recognizedRevenue._sum?.grossProfit || 0)
  };
}

// Inline style constants
const styles = {
  pnlSection: {
    padding: '16px 0',
    borderBottom: '1px solid var(--border-color)'
  },
  pnlHeader: {
    fontWeight: 600,
    fontSize: '14px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-secondary)',
    marginBottom: '12px'
  },
  pnlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    paddingLeft: '16px'
  },
  pnlSubtotal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    fontWeight: 600,
    borderTop: '1px solid var(--border-color)',
    marginTop: '8px'
  },
  pnlSubtotalHighlight: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    fontWeight: 600,
    background: 'rgba(34, 197, 94, 0.05)',
    borderRadius: '8px',
    marginTop: '8px'
  },
  pnlNote: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    textAlign: 'right' as const,
    padding: '4px 0'
  },
  amountPositive: { color: '#22c55e' },
  amountNegative: { color: '#ef4444' }
};

export default async function ProfitLossPage({ searchParams }: { searchParams: { period?: string } }) {
  const now = new Date();
  const period = searchParams.period || 'month';
  
  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }
  
  // Get both operational and ledger-based P&L
  const data = await getOperationalPnL(startDate, endDate);
  const ledger = await getLedgerBasedPnL();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { 
      style: 'currency', 
      currency: 'EGP',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <Link href="/admin/finance" className="back-link">← Back to Finance</Link>
          <h1>Profit & Loss Statement</h1>
          <p className="page-subtitle">
            {startDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} - {endDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {['week', 'month', 'quarter', 'year'].map(p => (
            <Link 
              key={p}
              href={`/admin/finance/reports/pnl?period=${p}`}
              className={`admin-btn ${period === p ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {p}
            </Link>
          ))}
        </div>
      </div>

      <div className="admin-grid" style={{ gap: '24px' }}>
        {/* Main P&L Statement */}
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h2>📊 Statement</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Revenue Section */}
            <div style={styles.pnlSection}>
              <div style={styles.pnlHeader}>Revenue</div>
              <div style={styles.pnlRow}>
                <span>Sales Revenue ({data.orderCount} orders)</span>
                <span style={styles.amountPositive}>{formatCurrency(data.revenue)}</span>
              </div>
              <div style={styles.pnlSubtotal}>
                <span>Total Revenue</span>
                <span>{formatCurrency(data.revenue)}</span>
              </div>
            </div>

            {/* COGS Section */}
            <div style={styles.pnlSection}>
              <div style={styles.pnlHeader}>Cost of Goods Sold</div>
              <div style={styles.pnlRow}>
                <span>Product Costs</span>
                <span style={styles.amountNegative}>({formatCurrency(data.cogs)})</span>
              </div>
              <div style={styles.pnlSubtotalHighlight}>
                <span>Gross Profit</span>
                <span>{formatCurrency(data.grossProfit)}</span>
              </div>
              <div style={styles.pnlNote}>Gross Margin: {data.grossMargin.toFixed(1)}%</div>
            </div>

            {/* Operating Expenses */}
            <div style={styles.pnlSection}>
              <div style={styles.pnlHeader}>Operating Expenses</div>
              {data.expensesBreakdown.map((exp, i) => (
                <div style={styles.pnlRow} key={i}>
                  <span>{exp.category}</span>
                  <span style={styles.amountNegative}>({formatCurrency(exp.amount)})</span>
                </div>
              ))}
              {data.expensesBreakdown.length === 0 && (
                <div style={styles.pnlRow}>
                  <span style={{ color: 'var(--text-secondary)' }}>No expenses recorded</span>
                  <span>—</span>
                </div>
              )}
              <div style={styles.pnlSubtotal}>
                <span>Total Operating Expenses</span>
                <span style={styles.amountNegative}>({formatCurrency(data.totalExpenses)})</span>
              </div>
            </div>

            {/* Net Income */}
            <div style={{ marginTop: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px',
                fontSize: '18px',
                fontWeight: 700,
                borderRadius: '8px',
                background: data.netProfit >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: data.netProfit >= 0 ? '#22c55e' : '#ef4444'
              }}>
                <span>Net {data.netProfit >= 0 ? 'Profit' : 'Loss'}</span>
                <span>{formatCurrency(data.netProfit)}</span>
              </div>
              <div style={styles.pnlNote}>Net Margin: {data.netMargin.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="admin-card">
          <div className="card-header">
            <h2>📈 Key Metrics</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <h2>📥 Export</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="admin-btn admin-btn-secondary" disabled>
              📄 Export PDF (Coming Soon)
            </button>
            <button className="admin-btn admin-btn-secondary" disabled>
              📊 Export CSV (Coming Soon)
            </button>
          </div>
        </div>

        {/* Ledger Verification - Source of Truth */}
        <div className="admin-card" style={{ gridColumn: 'span 3' }}>
          <div className="card-header">
            <h2>📖 Ledger Verification</h2>
            <span style={{ 
              fontSize: '12px', 
              padding: '4px 12px', 
              backgroundColor: 'rgba(59, 130, 246, 0.1)', 
              color: '#3b82f6',
              borderRadius: '20px'
            }}>
              Source of Truth
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
            These numbers come directly from the accounting ledger. Any difference from the operational view indicates
            unrecognized revenue or missing journal entries.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ledger Revenue</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>{formatCurrency(ledger.ledgerRevenue)}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ledger COGS</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{formatCurrency(ledger.ledgerCOGS)}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ledger Expenses</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{formatCurrency(ledger.ledgerExpenses)}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: ledger.ledgerNetProfit >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '8px', border: `2px solid ${ledger.ledgerNetProfit >= 0 ? '#22c55e' : '#ef4444'}` }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ledger Net Profit</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: ledger.ledgerNetProfit >= 0 ? '#22c55e' : '#ef4444' }}>{formatCurrency(ledger.ledgerNetProfit)}</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>
              📊 <strong>{ledger.recognizedOrders}</strong> orders with recognized revenue 
              (Total: {formatCurrency(ledger.recognizedRevenue)})
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Recognized COGS: {formatCurrency(ledger.recognizedCOGS)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricItem({ label, value, trend }: { label: string; value: string; trend: 'up' | 'down' | 'neutral' }) {
  const trendIcons = { up: '↑', down: '↓', neutral: '→' };
  const trendColors = { up: '#22c55e', down: '#ef4444', neutral: 'var(--text-secondary)' };
  
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
        {value}
        <span style={{ color: trendColors[trend] }}>{trendIcons[trend]}</span>
      </span>
    </div>
  );
}

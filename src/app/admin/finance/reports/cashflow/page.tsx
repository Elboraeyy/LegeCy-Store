import { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Cash Flow Statement | Finance',
};

export const dynamic = 'force-dynamic';

async function getCashFlowData(startDate: Date, endDate: Date) {
  // Operating Activities
  // Cash from sales (paid orders - not COD)
  const salesCash = await prisma.order.aggregate({
    where: {
      status: { in: ['Paid', 'Shipped', 'Delivered'] },
      paymentMethod: { not: 'cod' },
      createdAt: { gte: startDate, lte: endDate }
    },
    _sum: { totalPrice: true }
  });

  // COD collected (delivered only)
  const codCollected = await prisma.order.aggregate({
    where: {
      status: 'Delivered',
      paymentMethod: 'cod',
      deliveredAt: { gte: startDate, lte: endDate }
    },
    _sum: { totalPrice: true }
  });

  // Expenses paid
  const expensesPaid = await prisma.expense.aggregate({
    where: {
      status: 'APPROVED',
      date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true }
  });

  // Investing Activities - Inventory purchases from purchase invoices
  const inventoryPurchases = await prisma.purchaseInvoice.aggregate({
    where: {
      status: { in: ['POSTED', 'SETTLED'] },
      createdAt: { gte: startDate, lte: endDate }
    },
    _sum: { grandTotal: true }
  });

  // Calculate totals
  const operatingInflow = 
    Number(salesCash._sum?.totalPrice || 0) + 
    Number(codCollected._sum?.totalPrice || 0);
  
  const operatingOutflow = Number(expensesPaid._sum?.amount || 0);
  const operatingNet = operatingInflow - operatingOutflow;
  
  const investingNet = -Number(inventoryPurchases._sum?.grandTotal || 0);
  
  // Financing - placeholder for now (requires capital transactions model)
  const financingNet = 0;
  
  const netCashChange = operatingNet + investingNet + financingNet;

  return {
    operating: {
      salesCash: Number(salesCash._sum?.totalPrice || 0),
      codCollected: Number(codCollected._sum?.totalPrice || 0),
      expensesPaid: Number(expensesPaid._sum?.amount || 0),
      inflow: operatingInflow,
      outflow: operatingOutflow,
      net: operatingNet
    },
    investing: {
      inventoryPurchases: Number(inventoryPurchases._sum?.grandTotal || 0),
      net: investingNet
    },
    financing: {
      net: financingNet
    },
    netChange: netCashChange
  };
}

export default async function CashFlowPage({ searchParams }: { searchParams: { period?: string } }) {
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
  }
  
  const data = await getCashFlowData(startDate, endDate);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { 
      style: 'currency', 
      currency: 'EGP',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <Link href="/admin/finance" className="back-link">← Back to Finance</Link>
          <h1>Cash Flow Statement</h1>
          <p className="page-subtitle">
            {startDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {['week', 'month', 'quarter', 'year'].map(p => (
            <Link 
              key={p}
              href={`/admin/finance/reports/cashflow?period=${p}`}
              className={`admin-btn ${period === p ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {p}
            </Link>
          ))}
        </div>
      </div>

      <div className="admin-grid" style={{ gap: '24px' }}>
        {/* Main Statement */}
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h2>📊 Statement</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Operating Activities */}
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 600, fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                <span>🏪</span> Operating Activities
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 8px 24px' }}>
                <span>Cash received from sales</span>
                <span style={{ color: '#22c55e' }}>{formatCurrency(data.operating.salesCash)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 8px 24px' }}>
                <span>COD collected on delivery</span>
                <span style={{ color: '#22c55e' }}>{formatCurrency(data.operating.codCollected)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 8px 24px' }}>
                <span>Operating expenses paid</span>
                <span style={{ color: '#ef4444' }}>({formatCurrency(data.operating.expensesPaid)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border-color)', marginTop: '8px', fontWeight: 600 }}>
                <span>Net Cash from Operations</span>
                <span style={{ color: data.operating.net >= 0 ? '#22c55e' : '#ef4444' }}>{formatCurrency(data.operating.net)}</span>
              </div>
            </div>

            {/* Investing Activities */}
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 600, fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                <span>📦</span> Investing Activities
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 8px 24px' }}>
                <span>Inventory purchases</span>
                <span style={{ color: '#ef4444' }}>({formatCurrency(data.investing.inventoryPurchases)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border-color)', marginTop: '8px', fontWeight: 600 }}>
                <span>Net Cash from Investing</span>
                <span style={{ color: data.investing.net >= 0 ? '#22c55e' : '#ef4444' }}>{formatCurrency(data.investing.net)}</span>
              </div>
            </div>

            {/* Net Change */}
            <div style={{ 
              marginTop: '16px',
              padding: '20px',
              borderRadius: '12px',
              background: data.netChange >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `2px solid ${data.netChange >= 0 ? '#22c55e' : '#ef4444'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 700 }}>
                  Net {data.netChange >= 0 ? 'Increase' : 'Decrease'} in Cash
                </span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: data.netChange >= 0 ? '#22c55e' : '#ef4444' }}>
                  {formatCurrency(data.netChange)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="admin-card">
          <div className="card-header">
            <h2>📈 Summary</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span>Operating</span>
              <span style={{ fontWeight: 600, color: data.operating.net >= 0 ? '#22c55e' : '#ef4444' }}>{formatCurrency(data.operating.net)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span>Investing</span>
              <span style={{ fontWeight: 600, color: data.investing.net >= 0 ? '#22c55e' : '#ef4444' }}>{formatCurrency(data.investing.net)}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: data.netChange >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
              <span style={{ fontWeight: 600 }}>Net Change</span>
              <span style={{ fontWeight: 600, color: data.netChange >= 0 ? '#22c55e' : '#ef4444' }}>{formatCurrency(data.netChange)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

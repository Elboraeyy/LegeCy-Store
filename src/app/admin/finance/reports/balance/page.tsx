import { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getInventoryForBalanceSheet } from '@/lib/services/inventoryValuationService';

export const metadata: Metadata = {
  title: 'Balance Sheet | Finance',
};

export const dynamic = 'force-dynamic';

// Operational Balance Sheet (from order/transaction data)
async function getOperationalBalanceSheet() {
  // ASSETS
  // Cash & Bank - Sum of treasury accounts
  const treasuryAccounts = await prisma.treasuryAccount.findMany();
  const cashBalance = treasuryAccounts.reduce((sum: number, acc) => sum + Number(acc.balance), 0);

  // Accounts Receivable - Unpaid orders (COD pending delivery)
  const accountsReceivable = await prisma.order.aggregate({
    where: {
      status: { in: ['Paid', 'Shipped'] },
      paymentMethod: 'cod'
    },
    _sum: { totalPrice: true }
  });

  // Inventory Value - Get from inventory valuation service
  const inventoryData = await getInventoryForBalanceSheet();
  const inventoryTotal = inventoryData.bookValue;

  // LIABILITIES
  // Accounts Payable - Unpaid supplier invoices
  const accountsPayable = await prisma.purchaseInvoice.aggregate({
    where: {
      status: { in: ['POSTED', 'APPROVED'] }
    },
    _sum: { remainingAmount: true }
  });

  const netPayable = Number(accountsPayable._sum?.remainingAmount || 0);

  // Customer Deposits - Prepaid orders (online payments pending delivery)
  const customerDeposits = await prisma.order.aggregate({
    where: {
      status: { in: ['Paid', 'Shipped'] },
      paymentMethod: { not: 'cod' }
    },
    _sum: { totalPrice: true }
  });

  // EQUITY - Simplified retained earnings calculation
  const totalRevenue = await prisma.order.aggregate({
    where: { status: { in: ['Paid', 'Shipped', 'Delivered'] } },
    _sum: { totalPrice: true }
  });

  const totalExpenses = await prisma.expense.aggregate({
    where: { status: 'APPROVED' },
    _sum: { amount: true }
  });

  const retainedEarnings = Number(totalRevenue._sum?.totalPrice || 0) - Number(totalExpenses._sum?.amount || 0);

  // Calculate totals
  const totalAssets = cashBalance + Number(accountsReceivable._sum?.totalPrice || 0) + inventoryTotal;
  const totalLiabilities = Math.max(0, netPayable) + Number(customerDeposits._sum?.totalPrice || 0);
  const totalEquity = retainedEarnings;

  return {
    assets: {
      cash: cashBalance,
      accountsReceivable: Number(accountsReceivable._sum?.totalPrice || 0),
      inventory: inventoryTotal,
      total: totalAssets
    },
    liabilities: {
      accountsPayable: Math.max(0, netPayable),
      customerDeposits: Number(customerDeposits._sum?.totalPrice || 0),
      total: totalLiabilities
    },
    equity: {
      retainedEarnings: retainedEarnings,
      total: totalEquity
    },
    inventoryDetails: inventoryData,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1
  };
}

// Ledger-based Balance Sheet (from financial accounts - source of truth)
async function getLedgerBalanceSheet() {
  // Get all accounts grouped by type
  const accounts = await prisma.account.findMany();
  
  type AccountRecord = { id: string; code: string; name: string; type: string; balance: unknown };
  const assetAccounts = accounts.filter((a: AccountRecord) => a.type === 'ASSET');
  const liabilityAccounts = accounts.filter((a: AccountRecord) => a.type === 'LIABILITY');
  const equityAccounts = accounts.filter((a: AccountRecord) => a.type === 'EQUITY');
  const revenueAccounts = accounts.filter((a: AccountRecord) => a.type === 'REVENUE');
  const expenseAccounts = accounts.filter((a: AccountRecord) => a.type === 'EXPENSE');

  const totalAssets = assetAccounts.reduce((sum: number, a: AccountRecord) => sum + Number(a.balance), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum: number, a: AccountRecord) => sum + Number(a.balance), 0);
  const totalEquity = equityAccounts.reduce((sum: number, a: AccountRecord) => sum + Number(a.balance), 0);
  // Retained earnings = Revenue - Expenses (not yet closed to equity)
  const totalRevenue = revenueAccounts.reduce((sum: number, a: AccountRecord) => sum + Number(a.balance), 0);
  const totalExpenses = expenseAccounts.reduce((sum: number, a: AccountRecord) => sum + Number(a.balance), 0);
  const retainedEarnings = totalRevenue - totalExpenses;

  // Accounting equation check
  const equityPlusRetained = totalEquity + retainedEarnings;
  const equation = totalAssets - totalLiabilities - equityPlusRetained;
  const isBalanced = Math.abs(equation) < 1;

  return {
    assets: {
      accounts: assetAccounts.map((a: AccountRecord) => ({ name: a.name, code: a.code, balance: Number(a.balance) })),
      total: totalAssets
    },
    liabilities: {
      accounts: liabilityAccounts.map((a: AccountRecord) => ({ name: a.name, code: a.code, balance: Number(a.balance) })),
      total: totalLiabilities
    },
    equity: {
      accounts: equityAccounts.map((a: AccountRecord) => ({ name: a.name, code: a.code, balance: Number(a.balance) })),
      retainedEarnings,
      total: totalEquity + retainedEarnings
    },
    equation: {
      assets: totalAssets,
      liabilities: totalLiabilities,
      equity: equityPlusRetained,
      difference: equation,
      isBalanced
    }
  };
}

export default async function BalanceSheetPage() {
  // Get both operational and ledger-based balance sheets
  const data = await getOperationalBalanceSheet();
  const ledger = await getLedgerBalanceSheet();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { 
      style: 'currency', 
      currency: 'EGP',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <Link href="/admin/finance" className="back-link">← Back to Finance</Link>
          <h1>Balance Sheet</h1>
          <p className="page-subtitle">As of {today}</p>
        </div>
        
        <div style={{
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: data.balanced ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: data.balanced ? '#22c55e' : '#ef4444',
          fontWeight: 600
        }}>
          {data.balanced ? '✓ Balanced' : '⚠ Review Needed'}
        </div>
      </div>

      <div className="admin-grid" style={{ gap: '24px' }}>
        {/* Assets */}
        <div className="admin-card">
          <div className="card-header">
            <h2>📦 Assets</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Current Assets
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Cash & Bank</span>
                <span style={{ fontWeight: 500 }}>{formatCurrency(data.assets.cash)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Accounts Receivable (COD)</span>
                <span style={{ fontWeight: 500 }}>{formatCurrency(data.assets.accountsReceivable)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Inventory</span>
                <span style={{ fontWeight: 500 }}>{formatCurrency(data.assets.inventory)}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '2px solid var(--border-color)', marginTop: '8px', fontWeight: 700, fontSize: '16px' }}>
              <span>Total Assets</span>
              <span>{formatCurrency(data.assets.total)}</span>
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div className="admin-card">
          <div className="card-header">
            <h2>📋 Liabilities</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Current Liabilities
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Accounts Payable</span>
                <span style={{ fontWeight: 500 }}>{formatCurrency(data.liabilities.accountsPayable)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Customer Deposits</span>
                <span style={{ fontWeight: 500 }}>{formatCurrency(data.liabilities.customerDeposits)}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '2px solid var(--border-color)', marginTop: '8px', fontWeight: 700, fontSize: '16px' }}>
              <span>Total Liabilities</span>
              <span>{formatCurrency(data.liabilities.total)}</span>
            </div>
          </div>
        </div>

        {/* Equity */}
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h2>💰 Equity</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Owner&apos;s Equity
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Retained Earnings</span>
                <span style={{ fontWeight: 500 }}>{formatCurrency(data.equity.retainedEarnings)}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(34,197,94,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Equity</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#22c55e' }}>{formatCurrency(data.equity.total)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Equation Check */}
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h2>⚖️ Accounting Equation</h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '24px', fontSize: '18px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Assets</div>
              <div style={{ fontWeight: 700, fontSize: '24px' }}>{formatCurrency(data.assets.total)}</div>
            </div>
            <span style={{ fontSize: '24px', color: 'var(--text-secondary)' }}>=</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Liabilities</div>
              <div style={{ fontWeight: 700, fontSize: '24px' }}>{formatCurrency(data.liabilities.total)}</div>
            </div>
            <span style={{ fontSize: '24px', color: 'var(--text-secondary)' }}>+</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Equity</div>
              <div style={{ fontWeight: 700, fontSize: '24px' }}>{formatCurrency(data.equity.total)}</div>
            </div>
          </div>
        </div>

        {/* Ledger Verification */}
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h2>🔍 Ledger Verification</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginTop: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Ledger Assets</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{formatCurrency(ledger.assets.total)}</div>
              {Math.abs(ledger.assets.total - data.assets.total) > 1 && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  Diff: {formatCurrency(ledger.assets.total - data.assets.total)}
                </div>
              )}
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Ledger Liabilities</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{formatCurrency(ledger.liabilities.total)}</div>
              {Math.abs(ledger.liabilities.total - data.liabilities.total) > 1 && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  Diff: {formatCurrency(ledger.liabilities.total - data.liabilities.total)}
                </div>
              )}
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Ledger Equity</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{formatCurrency(ledger.equity.total)}</div>
              {Math.abs(ledger.equity.total - data.equity.total) > 1 && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  Diff: {formatCurrency(ledger.equity.total - data.equity.total)}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            * This section compares the operational data (from orders, inventory, etc.) with the double-entry ledger. Ideally, differences should be zero.
          </div>
        </div>
      </div>
    </div>
  );
}

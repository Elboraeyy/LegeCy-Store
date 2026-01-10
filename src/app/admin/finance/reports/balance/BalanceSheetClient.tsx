'use client';

import { formatCurrency } from '@/lib/utils';

interface BalanceSheetData {
  assets: {
    cash: number;
    accountsReceivable: number;
    inventory: number;
    total: number;
  };
  liabilities: {
    accountsPayable: number;
    customerDeposits: number;
    total: number;
  };
  equity: {
    retainedEarnings: number;
    total: number;
  };
  balanced: boolean;
}

interface LedgerData {
  assets: { total: number };
  liabilities: { total: number };
  equity: { total: number };
}

interface Props {
  data: BalanceSheetData;
  ledger: LedgerData;
  today: string;
}

export default function BalanceSheetClient({ data, ledger, today }: Props) {
  return (
    <>
      {/* Header */}
      <div className="page-header-row">
        <p className="page-description">As of {today}</p>
        <div className={`balance-status ${data.balanced ? 'balanced' : 'unbalanced'}`}>
          {data.balanced ? '✓ Balanced' : '⚠ Review Needed'}
        </div>
      </div>

      <div className="report-grid">
        {/* Assets */}
        <div className="admin-card">
          <div className="card-header">
            <h3>📦 Assets</h3>
          </div>
          <div className="section-label">Current Assets</div>
          <div className="statement-row">
            <span>Cash & Bank</span>
            <span className="value">{formatCurrency(data.assets.cash)}</span>
          </div>
          <div className="statement-row">
            <span>Accounts Receivable (COD)</span>
            <span className="value">{formatCurrency(data.assets.accountsReceivable)}</span>
          </div>
          <div className="statement-row">
            <span>Inventory</span>
            <span className="value">{formatCurrency(data.assets.inventory)}</span>
          </div>
          <div className="statement-total">
            <span>Total Assets</span>
            <span>{formatCurrency(data.assets.total)}</span>
          </div>
        </div>

        {/* Liabilities */}
        <div className="admin-card">
          <div className="card-header">
            <h3>📋 Liabilities</h3>
          </div>
          <div className="section-label">Current Liabilities</div>
          <div className="statement-row">
            <span>Accounts Payable</span>
            <span className="value">{formatCurrency(data.liabilities.accountsPayable)}</span>
          </div>
          <div className="statement-row">
            <span>Customer Deposits</span>
            <span className="value">{formatCurrency(data.liabilities.customerDeposits)}</span>
          </div>
          <div className="statement-total">
            <span>Total Liabilities</span>
            <span>{formatCurrency(data.liabilities.total)}</span>
          </div>
        </div>

        {/* Equity */}
        <div className="admin-card full-width">
          <div className="card-header">
            <h3>💰 Equity</h3>
          </div>
          <div className="equity-grid">
            <div>
              <div className="section-label">Owner&apos;s Equity</div>
              <div className="statement-row">
                <span>Retained Earnings</span>
                <span className="value">{formatCurrency(data.equity.retainedEarnings)}</span>
              </div>
            </div>
            <div className="equity-highlight">
              <div className="equity-label">Total Equity</div>
              <div className="equity-value">{formatCurrency(data.equity.total)}</div>
            </div>
          </div>
        </div>

        {/* Equation Check */}
        <div className="admin-card full-width">
          <div className="card-header">
            <h3>⚖️ Accounting Equation</h3>
          </div>
          <div className="equation-display">
            <div className="equation-item">
              <div className="equation-label">Assets</div>
              <div className="equation-value">{formatCurrency(data.assets.total)}</div>
            </div>
            <span className="equation-operator">=</span>
            <div className="equation-item">
              <div className="equation-label">Liabilities</div>
              <div className="equation-value">{formatCurrency(data.liabilities.total)}</div>
            </div>
            <span className="equation-operator">+</span>
            <div className="equation-item">
              <div className="equation-label">Equity</div>
              <div className="equation-value">{formatCurrency(data.equity.total)}</div>
            </div>
          </div>
        </div>

        {/* Ledger Verification */}
        <div className="admin-card full-width">
          <div className="card-header">
            <h3>🔍 Ledger Verification</h3>
          </div>
          <div className="ledger-grid">
            <div className="ledger-item">
              <div className="ledger-label">Ledger Assets</div>
              <div className="ledger-value">{formatCurrency(ledger.assets.total)}</div>
              {Math.abs(ledger.assets.total - data.assets.total) > 1 && (
                <div className="ledger-diff">Diff: {formatCurrency(ledger.assets.total - data.assets.total)}</div>
              )}
            </div>
            <div className="ledger-item">
              <div className="ledger-label">Ledger Liabilities</div>
              <div className="ledger-value">{formatCurrency(ledger.liabilities.total)}</div>
              {Math.abs(ledger.liabilities.total - data.liabilities.total) > 1 && (
                <div className="ledger-diff">Diff: {formatCurrency(ledger.liabilities.total - data.liabilities.total)}</div>
              )}
            </div>
            <div className="ledger-item">
              <div className="ledger-label">Ledger Equity</div>
              <div className="ledger-value">{formatCurrency(ledger.equity.total)}</div>
              {Math.abs(ledger.equity.total - data.equity.total) > 1 && (
                <div className="ledger-diff">Diff: {formatCurrency(ledger.equity.total - data.equity.total)}</div>
              )}
            </div>
          </div>
          <div className="ledger-note">
            * Compares operational data with double-entry ledger. Differences should be zero.
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

        .balance-status {
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
        }

        .balance-status.balanced {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .balance-status.unbalanced {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .report-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .full-width {
          grid-column: span 2;
        }

        .card-header {
          display: flex;
          align-items: center;
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

        .section-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--admin-text-muted, #4A6B68);
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .statement-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(18, 64, 60, 0.08);
        }

        .statement-row .value {
          font-weight: 500;
        }

        .statement-total {
          display: flex;
          justify-content: space-between;
          padding: 16px 0;
          border-top: 2px solid rgba(18, 64, 60, 0.08);
          margin-top: 8px;
          font-weight: 700;
          font-size: 16px;
        }

        .equity-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: center;
        }

        .equity-highlight {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          border-radius: 16px;
          background: rgba(34, 197, 94, 0.1);
          text-align: center;
        }

        .equity-label {
          font-size: 14px;
          color: var(--admin-text-muted, #4A6B68);
          margin-bottom: 8px;
        }

        .equity-value {
          font-size: 32px;
          font-weight: 700;
          color: #22c55e;
        }

        .equation-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 24px;
        }

        .equation-item {
          text-align: center;
        }

        .equation-label {
          color: var(--admin-text-muted, #4A6B68);
          font-size: 14px;
        }

        .equation-value {
          font-weight: 700;
          font-size: 24px;
        }

        .equation-operator {
          font-size: 24px;
          color: var(--admin-text-muted, #4A6B68);
        }

        .ledger-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .ledger-item {
          padding: 12px;
          background: rgba(18, 64, 60, 0.03);
          border-radius: 8px;
        }

        .ledger-label {
          color: var(--admin-text-muted, #4A6B68);
          font-size: 12px;
          margin-bottom: 4px;
        }

        .ledger-value {
          font-size: 18px;
          font-weight: 600;
        }

        .ledger-diff {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
        }

        .ledger-note {
          margin-top: 16px;
          font-size: 13px;
          color: var(--admin-text-muted, #4A6B68);
        }

        @media (max-width: 1024px) {
          .report-grid {
            grid-template-columns: 1fr;
          }

          .full-width {
            grid-column: auto;
          }

          .equity-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .ledger-grid {
            grid-template-columns: 1fr;
          }

          .equation-display {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>
    </>
  );
}

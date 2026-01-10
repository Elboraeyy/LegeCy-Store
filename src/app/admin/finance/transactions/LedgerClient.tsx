'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface Account {
  code: string;
  name: string;
  type: string;
}

interface LedgerLine {
  id: string;
  debit: number | string;
  credit: number | string;
  description?: string | null;
  account: Account;
}

interface JournalEntry {
  id: string;
  date: string | Date;
  reference?: string | null;
  description: string;
  status: string;
  lines: LedgerLine[];
}

export default function LedgerClient({ entries }: { entries: JournalEntry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'posted' | 'pending'>('all');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Calculate stats
  const totalDebits = entries.reduce((sum, e) => 
    sum + e.lines.reduce((s, l) => s + Number(l.debit), 0), 0
  );
  const totalCredits = entries.reduce((sum, e) => 
    sum + e.lines.reduce((s, l) => s + Number(l.credit), 0), 0
  );
  const postedCount = entries.filter(e => e.status === 'POSTED').length;
  const pendingCount = entries.filter(e => e.status !== 'POSTED').length;

  const filteredEntries = entries.filter(e => {
    if (filter === 'posted') return e.status === 'POSTED';
    if (filter === 'pending') return e.status !== 'POSTED';
    return true;
  });

  return (
    <>
      {/* Back Link */}
      <a href="/admin/finance" className="back-link">
        ← Back to Finance
      </a>

      {/* Page Header */}
      <div className="page-header">
        <h1>📒 General Ledger</h1>
        <p className="page-description">
          Master record of all financial movements (Double-Entry)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="admin-grid stats-grid">
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Debits</span>
            <span className="stat-icon">📥</span>
          </div>
          <div className="stat-value">{formatCurrency(totalDebits)}</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Credits</span>
            <span className="stat-icon">📤</span>
          </div>
          <div className="stat-value">{formatCurrency(totalCredits)}</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Posted Entries</span>
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-value positive">{postedCount}</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Pending</span>
            <span className="stat-icon">⏳</span>
          </div>
          <div className="stat-value warning">{pendingCount}</div>
        </div>
      </div>

      {/* Balance Check Warning */}
      {totalDebits !== totalCredits && (
        <div className="alert-box danger">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <p className="alert-title">Ledger Imbalance Detected</p>
            <p className="alert-message">
              Debits ({formatCurrency(totalDebits)}) ≠ Credits ({formatCurrency(totalCredits)})
            </p>
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <div className="filter-pills">
        {[
          { key: 'all', label: `All (${entries.length})` },
          { key: 'posted', label: `Posted (${postedCount})` },
          { key: 'pending', label: `Pending (${pendingCount})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`filter-pill ${filter === f.key ? 'active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Journal Entries Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Date</th>
              <th>Reference</th>
              <th>Description</th>
              <th>Status</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map(entry => {
              const totalAmount = entry.lines
                .filter(l => Number(l.debit) > 0)
                .reduce((sum, l) => sum + Number(l.debit), 0);

              return (
                <>
                  <tr 
                    key={entry.id} 
                    onClick={() => toggleExpand(entry.id)}
                    className={`expandable-row ${expandedId === entry.id ? 'expanded' : ''}`}
                  >
                    <td className="expand-cell">
                      <span className="expand-icon">{expandedId === entry.id ? '▼' : '▶'}</span>
                    </td>
                    <td>
                      <span className="date-cell">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td>
                      <span className="reference-cell">
                        {entry.reference || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="description-text">{entry.description}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${entry.status === 'POSTED' ? 'status-active' : entry.status === 'VOID' ? 'status-cancelled' : 'status-pending'}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="amount-value">{formatCurrency(totalAmount)}</span>
                    </td>
                  </tr>
                  
                  {/* Expanded Details */}
                  {expandedId === entry.id && (
                    <tr key={`${entry.id}-details`} className="detail-row">
                      <td colSpan={6}>
                        <div className="detail-content">
                          <table className="detail-table">
                            <thead>
                              <tr>
                                <th>Account</th>
                                <th>Type</th>
                                <th className="text-right">Debit</th>
                                <th className="text-right">Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.lines.map(line => (
                                <tr key={line.id}>
                                  <td>
                                    <span className="account-code">{line.account.code}</span>
                                    <span className="account-name">{line.account.name}</span>
                                  </td>
                                  <td className="account-type">{line.account.type}</td>
                                  <td className="text-right">
                                    {Number(line.debit) > 0 ? (
                                      <span className="debit-value">
                                        {formatCurrency(Number(line.debit))}
                                      </span>
                                    ) : (
                                      <span className="empty-cell">-</span>
                                    )}
                                  </td>
                                  <td className="text-right">
                                    {Number(line.credit) > 0 ? (
                                      <span className="credit-value">
                                        {formatCurrency(Number(line.credit))}
                                      </span>
                                    ) : (
                                      <span className="empty-cell">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  <span className="empty-icon">📒</span>
                  <span>No transactions found</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .page-description {
          color: var(--admin-text-muted, #4A6B68);
          margin: 0 0 20px;
          font-size: 14px;
        }

        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          margin-bottom: 24px;
        }

        .stat-card {
          padding: 20px;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--admin-text-on-light, #12403C);
        }

        .stat-value.positive { color: #16a34a; }
        .stat-value.warning { color: #d97706; }

        .alert-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 20px;
          border-radius: var(--admin-radius, 20px);
          margin-bottom: 24px;
        }

        .alert-box.danger {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .alert-icon {
          font-size: 20px;
        }

        .alert-title {
          font-weight: 600;
          color: #dc2626;
          margin: 0 0 4px;
        }

        .alert-message {
          font-size: 13px;
          color: #ef4444;
          margin: 0;
        }

        .filter-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .filter-pill {
          padding: 8px 16px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          background: rgba(18, 64, 60, 0.05);
          color: #4A6B68;
        }

        .filter-pill:hover {
          background: rgba(18, 64, 60, 0.1);
        }

        .filter-pill.active {
          background: #12403C;
          color: white;
        }

        .admin-table-container {
          margin-bottom: 24px;
        }

        .expandable-row {
          cursor: pointer;
          transition: background 0.15s;
        }

        .expandable-row:hover {
          background: rgba(18, 64, 60, 0.02);
        }

        .expandable-row.expanded {
          background: rgba(18, 64, 60, 0.03);
        }

        .expand-cell {
          text-align: center;
        }

        .expand-icon {
          font-size: 10px;
          color: #9ca3af;
        }

        .date-cell {
          color: var(--admin-text-muted, #4A6B68);
          font-size: 13px;
        }

        .reference-cell {
          font-family: monospace;
          font-size: 12px;
          color: #9ca3af;
        }

        .description-text {
          font-weight: 500;
        }

        .text-right {
          text-align: right;
        }

        .amount-value {
          font-weight: 700;
        }

        .detail-row {
          background: rgba(18, 64, 60, 0.03);
        }

        .detail-row td {
          padding: 0 !important;
        }

        .detail-content {
          padding: 16px 24px;
          margin-left: 40px;
          border-left: 3px solid #12403C;
        }

        .detail-table {
          width: 100%;
          font-size: 13px;
        }

        .detail-table th {
          text-align: left;
          padding: 8px 12px;
          font-size: 11px;
          text-transform: uppercase;
          color: var(--admin-text-muted, #4A6B68);
          font-weight: 600;
          border-bottom: 1px solid rgba(18, 64, 60, 0.08);
        }

        .detail-table td {
          padding: 8px 12px;
          border-bottom: 1px dashed rgba(18, 64, 60, 0.08);
        }

        .account-code {
          font-family: monospace;
          color: #9ca3af;
          margin-right: 8px;
        }

        .account-name {
          color: var(--admin-text-on-light, #12403C);
        }

        .account-type {
          font-size: 11px;
          color: #9ca3af;
        }

        .debit-value {
          color: #16a34a;
          font-weight: 500;
        }

        .credit-value {
          color: #dc2626;
          font-weight: 500;
        }

        .empty-cell {
          color: #d1d5db;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px !important;
          color: #9ca3af;
        }

        .empty-icon {
          display: block;
          font-size: 32px;
          margin-bottom: 8px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--admin-text-muted, #4A6B68);
          text-decoration: none;
          font-size: 14px;
          margin-bottom: 16px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--admin-text-on-light, #12403C);
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--admin-text-on-light, #12403C);
          margin: 0 0 4px;
        }

        .page-header .page-description {
          margin: 0;
        }
      `}</style>
    </>
  );
}

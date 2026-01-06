
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
  reference?: string | null; // Allow null from Prisma
  description: string;
  status: string;
  lines: LedgerLine[];
}

export default function LedgerClient({ entries }: { entries: JournalEntry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-title">General Ledger</h1>
          <p className="admin-subtitle">Master record of all financial movements (Double-Entry)</p>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>Date</th>
                        <th>Reference</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map(entry => {
                        // Calculate total debit for display (should match credit)
                        const totalAmount = entry.lines
                            .filter((l: LedgerLine) => Number(l.debit) > 0)
                            .reduce((sum: number, l: LedgerLine) => sum + Number(l.debit), 0);

                        return (
                            <>
                                <tr 
                                    key={entry.id} 
                                    onClick={() => toggleExpand(entry.id)}
                                    style={{ cursor: 'pointer', background: expandedId === entry.id ? '#f9fafb' : 'transparent' }}
                                >
                                    <td style={{ textAlign: 'center', fontSize: '10px', color: '#9ca3af' }}>
                                        {expandedId === entry.id ? '▼' : '▶'}
                                    </td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        {new Date(entry.date).toLocaleString()}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                        {entry.reference || '-'}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{entry.description}</td>
                                    <td>
                                        <span style={{
                                            padding: '2px 6px', borderRadius: '4px', fontSize: '10px',
                                            background: '#e5e7eb', color: '#374151', border: '1px solid #d1d5db'
                                        }}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                        {formatCurrency(totalAmount)}
                                    </td>
                                </tr>
                                
                                {/* Expanded Details (The actual Ledger Lines) */}
                                {expandedId === entry.id && (
                                    <tr key={`${entry.id}-details`} style={{ background: '#f9fafb' }}>
                                        <td colSpan={6} style={{ padding: '0 0 20px 0' }}>
                                            <div style={{ padding: '0 20px 0 60px' }}>
                                                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
                                                            <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Account</th>
                                                            <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Type</th>
                                                            <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 500 }}>Debit</th>
                                                            <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 500 }}>Credit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {entry.lines.map((line: LedgerLine) => (
                                                            <tr key={line.id} style={{ borderBottom: '1px dashed #e5e7eb' }}>
                                                                <td style={{ padding: '8px 0' }}>
                                                                    <span style={{ fontFamily: 'monospace', color: '#6b7280', marginRight: '8px' }}>
                                                                        {line.account.code}
                                                                    </span>
                                                                    {line.account.name}
                                                                </td>
                                                                <td style={{ padding: '8px 0', fontSize: '11px', color: '#9ca3af' }}>
                                                                    {line.account.type}
                                                                </td>
                                                                <td style={{ textAlign: 'right', padding: '8px 0', color: Number(line.debit) > 0 ? '#1f2937' : '#d1d5db' }}>
                                                                    {Number(line.debit) > 0 ? formatCurrency(Number(line.debit)) : '-'}
                                                                </td>
                                                                <td style={{ textAlign: 'right', padding: '8px 0', color: Number(line.credit) > 0 ? '#1f2937' : '#d1d5db' }}>
                                                                    {Number(line.credit) > 0 ? formatCurrency(Number(line.credit)) : '-'}
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
                     {entries.length === 0 && (
                        <tr>
                             <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No transactions found.
                            </td>
                        </tr>
                     )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

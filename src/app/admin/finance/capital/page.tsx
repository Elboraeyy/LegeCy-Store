'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getInvestors, recordCapitalTransaction } from '@/lib/services/capitalService';
import { Investor, CapitalTransaction } from '@prisma/client';

export default function CapitalPage() {
  const [investors, setInvestors] = useState<(Investor & { transactions: CapitalTransaction[] })[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Action State
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getInvestors();
      setInvestors(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleTransaction(type: 'DEPOSIT' | 'WITHDRAWAL') {
    if (!selectedInvestor || !amount) return;
    if (!confirm(`Confirm ${type} of ${amount} EGP for this investor?`)) return;
    
    setIsProcessing(true);
    try {
      await recordCapitalTransaction(
        selectedInvestor, 
        type, 
        Number(amount), 
        description || `${type} via Admin Panel`, 
        'admin-id-placeholder'
      );
      setAmount('');
      setDescription('');
      await loadData();
    } catch (e) {
      alert('Transaction failed: ' + e);
    } finally {
      setIsProcessing(false);
    }
  }

  const totalCapital = investors.reduce((sum, inv) => sum + Number(inv.netContributed), 0);
  const formatCurrency = (n: number) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(n);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <Link href="/admin/finance" className="back-link">← Back to Finance</Link>
          <h1>Capital & Investors</h1>
          <p className="page-subtitle">Manage equity, shareholders, and capital flow.</p>
        </div>
      </div>
      
      {/* Top Stats */}
      <div className="admin-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Paid-In Capital</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>{formatCurrency(totalCapital)}</div>
        </div>
        <div className="admin-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active Investors</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{investors.length}</div>
        </div>
        <div className="admin-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Retained Earnings</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{formatCurrency(0)} (Simulated)</div>
        </div>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Cap Table */}
        <div className="admin-card">
          <div className="card-header">
            <h2>👥 Cap Table</h2>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Type</th>
                <th>Net Contributed</th>
                <th>Ownership (Est)</th>
              </tr>
            </thead>
            <tbody>
              {investors.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600 }}>{inv.name}</td>
                  <td><span className="badge">{inv.type}</span></td>
                  <td>{formatCurrency(Number(inv.netContributed))}</td>
                  <td>
                    {totalCapital > 0 
                      ? ((Number(inv.netContributed) / totalCapital) * 100).toFixed(1) + '%' 
                      : '-'}
                  </td>
                </tr>
              ))}
              {investors.length === 0 && !loading && (
                <tr><td colSpan={4} style={{ textAlign: 'center' }}>No investors found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action Panel */}
        <div className="admin-card">
          <div className="card-header">
            <h2>💸 Capital Action</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select 
              className="admin-input" 
              value={selectedInvestor || ''} 
              onChange={e => setSelectedInvestor(e.target.value)}
            >
              <option value="">Select Investor...</option>
              {investors.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
            </select>
            
            <input 
              type="number" 
              className="admin-input" 
              placeholder="Amount (EGP)" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
            />
            
            <input 
              type="text" 
              className="admin-input" 
              placeholder="Description (Optional)" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button 
                className="admin-btn admin-btn-primary" 
                onClick={() => handleTransaction('DEPOSIT')}
                disabled={isProcessing || !amount || !selectedInvestor}
              >
                📥 Inject
              </button>
              <button 
                className="admin-btn admin-btn-danger" 
                onClick={() => handleTransaction('WITHDRAWAL')}
                disabled={isProcessing || !amount || !selectedInvestor}
              >
                📤 Withdraw
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              * Creates balanced Journal Entries in Ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

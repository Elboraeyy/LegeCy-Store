
'use client';

import { useState, useTransition } from 'react';
import { addCapital, withdrawCapital } from '@/lib/actions/finance';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Investor {
  id: string;
  name: string;
  type: string; // Added missing type property
  netContributed: number | string;
  currentShare: number | string;
}

export default function EquityClient({ investors }: { investors: Investor[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  
  const [selectedInvestor, setSelectedInvestor] = useState(investors[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const totalCapital = investors.reduce((sum, inv) => sum + Number(inv.netContributed), 0);

  // Generate Conic Gradient
  let currentAngle = 0;
  const pieSegments = investors.map((inv: Investor) => {
    const share = Number(inv.currentShare);
    const start = currentAngle;
    const end = currentAngle + share;
    currentAngle = end;
    const color = `hsl(${(start * 3.6) + 120}, 70%, 45%)`; 
    return `${color} ${start}% ${end}%`;
  }).join(', ');

  const pieStyle = {
    background: totalCapital > 0 
      ? `conic-gradient(${pieSegments})` 
      : '#e5e7eb',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (mode === 'DEPOSIT') {
            await addCapital(selectedInvestor, Number(amount), description);
        } else {
            await withdrawCapital(selectedInvestor, Number(amount), description);
        }
        setShowModal(false);
        setAmount('');
        setDescription('');
        router.refresh();
      } catch (error) {
        // Safe error handling
        const msg = (error as Error)?.message || 'Error processing transaction';
        alert(msg);
        console.error(error);
      }
    });
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Capital & Partners</h1>
          <p className="admin-subtitle">Manage ownership and equity distribution</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
            <button 
                onClick={() => { setMode('WITHDRAWAL'); setShowModal(true); }} 
                className="admin-btn admin-btn-outline"
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
            >
                - Withdraw
            </button>
            <button 
                onClick={() => { setMode('DEPOSIT'); setShowModal(true); }} 
                className="admin-btn admin-btn-primary"
            >
                + Inject Capital
            </button>
        </div>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 350px' }}>
        
        {/* Investors List */}
        <div className="admin-card">
            <h3 className="font-heading" style={{ fontSize: '18px', marginBottom: '20px' }}>Shareholders</h3>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th style={{ textAlign: 'right' }}>Total Contributed</th>
                            <th style={{ textAlign: 'right' }}>Ownership %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {investors.map(inv => (
                            <tr key={inv.id}>
                                <td style={{ fontWeight: 500 }}>{inv.name}</td>
                                <td>
                                    <span style={{ 
                                        fontSize: '11px', 
                                        padding: '4px 8px', 
                                        borderRadius: '4px', 
                                        background: '#f3f4f6',
                                        border: '1px solid var(--admin-border)'
                                    }}>
                                        {inv.type}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(Number(inv.netContributed))}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    {Number(inv.currentShare).toFixed(2)}%
                                </td>
                            </tr>
                        ))}
                         {investors.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No investors found. Run seed script or add manually.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Equity Chart */}
        <div>
            <div className="admin-card">
                <h3 className="font-heading" style={{ fontSize: '18px', marginBottom: '20px' }}>Equity Structure</h3>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        border: '1px solid var(--admin-border)',
                        ...pieStyle
                    }} />
                </div>

                <div>
                    {investors.map((inv, idx) => (
                        <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ 
                                    width: '12px', height: '12px', borderRadius: '2px',
                                    backgroundColor: `hsl(${ (Number(inv.currentShare) > 0 ? ((idx * 50) + 120) : 0) }, 70%, 45%)` // simplified logic for matching mapping above roughly
                                }} />
                                <span>{inv.name}</span>
                             </div>
                             <span>{Number(inv.currentShare).toFixed(2)}%</span>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--admin-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-label">Total Capital</span>
                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(totalCapital)}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
            <div className="admin-card" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
                <h3 className="font-heading" style={{ fontSize: '20px', marginBottom: '8px' }}>
                    {mode === 'DEPOSIT' ? 'Inject Capital' : 'Withdraw Capital'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                    {mode === 'DEPOSIT' 
                        ? 'This will increase equity and update ownership percentages.' 
                        : 'This will reduce equity and payout cash to the partner.'}
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                        <label>Investor</label>
                        <select 
                            className="form-input" 
                            value={selectedInvestor}
                            onChange={e => setSelectedInvestor(e.target.value)}
                            required
                        >
                            <option value="">Select Investor</option>
                            {investors.map(inv => (
                                <option key={inv.id} value={inv.id}>{inv.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                        <label>Amount (EGP)</label>
                        <input 
                            type="number" 
                            className="form-input"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="e.g. 50000"
                            required
                            min="1"
                        />
                    </div>

                    <div className="admin-form-group" style={{ marginBottom: '24px' }}>
                        <label>Description (Optional)</label>
                        <textarea 
                            className="form-input" 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={mode === 'DEPOSIT' ? "e.g. Q1 Injection" : "e.g. Profit Distribution"}
                            rows={2}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)}
                            className="admin-btn admin-btn-outline"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className={`admin-btn ${mode === 'DEPOSIT' ? 'admin-btn-primary' : 'admin-btn-danger'}`}
                            style={{ 
                                backgroundColor: mode === 'WITHDRAWAL' ? '#dc2626' : undefined,
                                color: mode === 'WITHDRAWAL' ? '#fff' : undefined,
                                border: mode === 'WITHDRAWAL' ? 'none' : undefined
                            }}
                            disabled={isPending}
                        >
                            {isPending ? 'Processing...' : (mode === 'DEPOSIT' ? 'Confirm Injection' : 'Confirm Withdrawal')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createAccount, AccountType } from '@/lib/actions/finance';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  description?: string | null;
  isSystem: boolean;
}

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

export default function AccountsClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'ASSET',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAccount({
        name: formData.name,
        code: formData.code,
        type: formData.type as AccountType,
        description: formData.description
      });
      setShowModal(false);
      setFormData({ name: '', code: '', type: 'ASSET', description: '' });
      router.refresh();
    } catch (error) {
      // Safe error handling
      const msg = (error as Error)?.message || 'Error creating account';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Group accounts by type for display
  const groupedAccounts = ACCOUNT_TYPES.reduce((acc, type) => {
    acc[type] = accounts.filter(a => a.type === type);
    return acc;
  }, {} as Record<string, Account[]>);

  const getTypeColor = (type: string) => {
    switch (type) {
        case 'ASSET': return '#10b981'; // Green
        case 'LIABILITY': return '#f59e0b'; // Amber
        case 'EQUITY': return '#6366f1'; // Indigo
        case 'REVENUE': return '#06b6d4'; // Cyan
        case 'EXPENSE': return '#ef4444'; // Red
        default: return '#6b7280';
    }
  };

  return (
    <div>
        <div className="admin-header">
            <div>
                <h1 className="admin-title">Chart of Accounts</h1>
                <p className="admin-subtitle">Manage all financial ledger accounts</p>
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className="admin-btn admin-btn-primary"
            >
                + New Account
            </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {ACCOUNT_TYPES.map(type => {
                const typeAccounts = groupedAccounts[type] || [];
                if (typeAccounts.length === 0) return null;

                const totalBalance = typeAccounts.reduce((sum, acc) => sum + acc.balance, 0);

                return (
                    <div key={type} className="admin-card">
                        <div style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6'
                        }}>
                            <h3 style={{ margin: 0, color: getTypeColor(type), display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getTypeColor(type) }}></span>
                                {type}
                            </h3>
                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                {formatCurrency(totalBalance)}
                            </span>
                        </div>

                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th style={{ textAlign: 'right' }}>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {typeAccounts.map(account => (
                                    <tr key={account.id}>
                                        <td style={{ fontFamily: 'monospace', color: '#6b7280' }}>{account.code}</td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{account.name}</div>
                                            {account.description && (
                                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{account.description}</div>
                                            )}
                                            {account.isSystem && (
                                                <span style={{ fontSize: '10px', background: '#e5e7eb', padding: '1px 4px', borderRadius: '4px', marginLeft: '6px' }}>System</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 500 }}>
                                            {formatCurrency(account.balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>

        {/* Modal */}
        {showModal && (
            <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
                    <h2 style={{ marginBottom: '24px' }}>New Account</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Account Type</label>
                            <select 
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value})}
                                className="admin-input"
                            >
                                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                            <div className="form-group">
                                <label>Code</label>
                                <input 
                                    type="text" 
                                    value={formData.code}
                                    onChange={e => setFormData({...formData, code: e.target.value})}
                                    className="admin-input"
                                    placeholder="e.g. 1001"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Name</label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="admin-input"
                                    placeholder="e.g. Cash on Hand"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <input 
                                type="text" 
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="admin-input"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button type="button" onClick={() => setShowModal(false)} className="admin-btn admin-btn-outline">Cancel</button>
                            <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">
                                {loading ? 'Creating...' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}

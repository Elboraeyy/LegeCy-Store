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

const ACCOUNT_TYPES = [
  { value: 'ASSET', label: 'Assets', color: '#10b981', bg: '#dcfce7', icon: '💰' },
  { value: 'LIABILITY', label: 'Liabilities', color: '#f59e0b', bg: '#fef3c7', icon: '📋' },
  { value: 'EQUITY', label: 'Equity', color: '#6366f1', bg: '#e0e7ff', icon: '🏦' },
  { value: 'REVENUE', label: 'Revenue', color: '#06b6d4', bg: '#cffafe', icon: '📈' },
  { value: 'EXPENSE', label: 'Expenses', color: '#ef4444', bg: '#fee2e2', icon: '💸' },
];

export default function AccountsClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);

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
      const msg = (error as Error)?.message || 'Error creating account';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalAssets = accounts.filter(a => a.type === 'ASSET').reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'LIABILITY').reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = accounts.filter(a => a.type === 'EQUITY').reduce((sum, a) => sum + a.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  const getTypeConfig = (type: string) => ACCOUNT_TYPES.find(t => t.value === type) || ACCOUNT_TYPES[0];

  const filteredAccounts = activeType 
    ? accounts.filter(a => a.type === activeType)
    : accounts;

  return (
    <>
      {/* Page Description */}
      <p className="page-description">
        Manage all financial ledger accounts
      </p>

      {/* Action Buttons */}
      <div className="action-bar">
        <button 
          onClick={() => setShowModal(true)}
          className="admin-btn admin-btn-primary"
        >
          + New Account
        </button>
      </div>

      {/* Summary Cards */}
      <div className="admin-grid stats-grid">
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Assets</span>
            <span className="stat-icon">💰</span>
          </div>
          <div className="stat-value positive">{formatCurrency(totalAssets)}</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Liabilities</span>
            <span className="stat-icon">📋</span>
          </div>
          <div className="stat-value warning">{formatCurrency(totalLiabilities)}</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Equity</span>
            <span className="stat-icon">🏦</span>
          </div>
          <div className="stat-value accent">{formatCurrency(totalEquity)}</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Net Worth</span>
            <span className="stat-icon">✨</span>
          </div>
          <div className={`stat-value ${netWorth >= 0 ? '' : 'negative'}`}>
            {formatCurrency(netWorth)}
          </div>
        </div>
      </div>

      {/* Type Filter Pills */}
      <div className="filter-pills">
        <button
          onClick={() => setActiveType(null)}
          className={`filter-pill ${activeType === null ? 'active' : ''}`}
        >
          All ({accounts.length})
        </button>
        {ACCOUNT_TYPES.map(type => {
          const count = accounts.filter(a => a.type === type.value).length;
          if (count === 0) return null;
          return (
            <button
              key={type.value}
              onClick={() => setActiveType(activeType === type.value ? null : type.value)}
              className="filter-pill type-pill"
              style={{
                '--pill-bg': type.bg,
                '--pill-color': type.color,
                '--pill-active-bg': type.color,
              } as React.CSSProperties}
              data-active={activeType === type.value}
            >
              <span>{type.icon}</span>
              {type.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Accounts Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Account Name</th>
              <th>Type</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map(account => {
              const typeConfig = getTypeConfig(account.type);
              return (
                <tr key={account.id}>
                  <td>
                    <span className="account-code">{account.code}</span>
                  </td>
                  <td>
                    <div className="account-name-cell">
                      <span className="account-name">{account.name}</span>
                      {account.isSystem && (
                        <span className="system-badge">System</span>
                      )}
                    </div>
                    {account.description && (
                      <div className="account-description">{account.description}</div>
                    )}
                  </td>
                  <td>
                    <span 
                      className="type-badge"
                      style={{ background: typeConfig.bg, color: typeConfig.color }}
                    >
                      {typeConfig.icon} {typeConfig.label}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`balance-value ${account.balance < 0 ? 'negative' : ''}`}>
                      {formatCurrency(account.balance)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-state">
                  <span className="empty-icon">🏛️</span>
                  <span>No accounts found</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Account</h2>
            <p className="modal-subtitle">Add a new account to your chart of accounts</p>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Account Type</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="form-input"
                >
                  {ACCOUNT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group" style={{ flex: '0 0 100px' }}>
                  <label>Code</label>
                  <input 
                    type="text" 
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="form-input"
                    placeholder="1001"
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="form-input"
                    placeholder="Cash on Hand"
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
                  className="form-input"
                  placeholder="Brief description..."
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="admin-btn admin-btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="admin-btn admin-btn-primary"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-description {
          color: var(--admin-text-muted, #4A6B68);
          margin: 0 0 20px;
          font-size: 14px;
        }

        .action-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
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
        .stat-value.accent { color: #6366f1; }
        .stat-value.negative { color: #dc2626; }

        .filter-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
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

        .filter-pill.type-pill {
          background: var(--pill-bg);
          color: var(--pill-color);
        }

        .filter-pill.type-pill:hover {
          opacity: 0.8;
        }

        .filter-pill.type-pill[data-active="true"] {
          background: var(--pill-active-bg);
          color: white;
        }

        .admin-table-container {
          margin-bottom: 24px;
        }

        .account-code {
          font-family: monospace;
          font-size: 13px;
          color: var(--admin-text-muted, #4A6B68);
        }

        .account-name-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .account-name {
          font-weight: 500;
        }

        .system-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 99px;
          background: rgba(18, 64, 60, 0.05);
          color: var(--admin-text-muted, #4A6B68);
        }

        .account-description {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 2px;
        }

        .type-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 500;
        }

        .text-right {
          text-align: right;
        }

        .balance-value {
          font-weight: 600;
        }

        .balance-value.negative {
          color: #dc2626;
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

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 16px;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--admin-text-on-light, #12403C);
          margin: 0 0 4px;
        }

        .modal-subtitle {
          font-size: 14px;
          color: var(--admin-text-muted, #4A6B68);
          margin: 0 0 24px;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 600;
          color: var(--admin-text-muted, #4A6B68);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-row {
          display: flex;
          gap: 12px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .modal-actions .admin-btn {
          flex: 1;
        }

        .admin-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { getInvestors, recordCapitalTransaction, createInvestor, deleteInvestor } from '@/lib/services/capitalService';
import { InvestorType, CapitalTxType } from '@prisma/client';

// Custom type with numbers instead of Prisma Decimal
interface InvestorWithTransactions {
  id: string;
  name: string;
  type: InvestorType;
  netContributed: number;
  currentShare: number;
  isActive: boolean;
  joinedAt: Date;
  transactions: {
    id: string;
    investorId: string;
    type: CapitalTxType;
    amount: number;
    date: Date;
    description: string | null;
    journalEntryId: string | null;
    snapshotTotalCapital: number;
    snapshotShare: number;
    createdAt: Date;
    createdBy: string;
  }[];
}

export default function CapitalPage() {
  const [investors, setInvestors] = useState<InvestorWithTransactions[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Action State
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  
  // Add Partner Modal State
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerType, setNewPartnerType] = useState<'OWNER' | 'PARTNER' | 'INVESTOR'>('PARTNER');
  const [newPartnerCapital, setNewPartnerCapital] = useState('');

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

  async function handleTransaction() {
    if (!selectedInvestor || !amount) return;
    
    setIsProcessing(true);
    try {
      await recordCapitalTransaction(
        selectedInvestor, 
        transactionType, 
        Number(amount), 
        description || `${transactionType} via Admin Panel`, 
        'admin-id-placeholder'
      );
      setAmount('');
      setDescription('');
      setShowModal(false);
      await loadData();
    } catch (e) {
      alert('Transaction failed: ' + e);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleAddPartner() {
    if (!newPartnerName.trim()) return;
    
    setIsProcessing(true);
    try {
      await createInvestor({
        name: newPartnerName.trim(),
        type: newPartnerType,
        initialCapital: newPartnerCapital ? Number(newPartnerCapital) : undefined,
        createdBy: 'admin-id-placeholder'
      });
      setNewPartnerName('');
      setNewPartnerType('PARTNER');
      setNewPartnerCapital('');
      setShowPartnerModal(false);
      await loadData();
    } catch (e) {
      alert('Failed to add partner: ' + e);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeletePartner(investorId: string, investorName: string) {
    if (!confirm(`Are you sure you want to delete ${investorName}?\n\nNote: You can only delete partners with zero capital balance.`)) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await deleteInvestor(investorId);
      await loadData();
    } catch (e) {
      alert('Failed to delete: ' + e);
    } finally {
      setIsProcessing(false);
    }
  }

  const totalCapital = investors.reduce((sum, inv) => sum + Number(inv.netContributed), 0);
  
  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'EGP',
    maximumFractionDigits: 0
  }).format(n);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    );
  }

  return (
    <>
      {/* Back Link */}
      <a href="/admin/finance" className="back-link">
        ← Back to Finance
      </a>

      {/* Page Header */}
      <div className="page-header">
        <h1>💰 Capital & Partners</h1>
        <p className="page-description">
          Manage equity, shareholders, and capital flow
        </p>
      </div>

      {/* Action Buttons */}
      <div className="action-bar">
        <button 
          onClick={() => setShowPartnerModal(true)}
          className="admin-btn admin-btn-outline"
        >
          👤 Add Partner
        </button>
        <button 
          onClick={() => { setTransactionType('WITHDRAWAL'); setShowModal(true); }}
          className="admin-btn admin-btn-outline danger"
        >
          📤 Withdraw
        </button>
        <button 
          onClick={() => { setTransactionType('DEPOSIT'); setShowModal(true); }}
          className="admin-btn admin-btn-primary"
        >
          📥 Inject Capital
        </button>
      </div>

      {/* Summary Cards */}
      <div className="admin-grid stats-grid">
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Paid-In Capital</span>
            <span className="stat-icon">💰</span>
          </div>
          <div className="stat-value positive">{formatCurrency(totalCapital)}</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Investors</span>
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-value">{investors.length}</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Largest Holder</span>
            <span className="stat-icon">👑</span>
          </div>
          <div className="stat-value accent">
            {investors.length > 0 && totalCapital > 0
              ? `${Math.max(...investors.map(i => (Number(i.netContributed) / totalCapital) * 100)).toFixed(1)}%`
              : '0%'
            }
          </div>
        </div>
      </div>

      {/* Cap Table */}
      <div className="admin-table-container">
        <div className="table-header">
          <h3>👥 Cap Table</h3>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Investor</th>
              <th>Type</th>
              <th className="text-right">Net Contributed</th>
              <th className="text-right">Ownership</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {investors.map((inv, idx) => {
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
              const ownership = totalCapital > 0 
                ? ((Number(inv.netContributed) / totalCapital) * 100).toFixed(1) 
                : '0';
              
              return (
                <tr key={inv.id}>
                  <td>
                    <div className="investor-cell">
                      <div 
                        className="investor-avatar"
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      >
                        {inv.name.charAt(0)}
                      </div>
                      <span className="investor-name">{inv.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge status-neutral">
                      {inv.type}
                    </span>
                  </td>
                  <td className="text-right font-medium">
                    {formatCurrency(Number(inv.netContributed))}
                  </td>
                  <td className="text-right">
                    <span className="ownership-value">{ownership}%</span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDeletePartner(inv.id, inv.name)}
                      disabled={isProcessing || Number(inv.netContributed) !== 0}
                      className="delete-btn"
                      title={Number(inv.netContributed) !== 0 ? 'Withdraw all funds first' : 'Delete partner'}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
            {investors.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  <span className="empty-icon">👥</span>
                  <span>No investors found</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <h4>
          <span>ℹ️</span>
          About Capital Transactions
        </h4>
        <p>
          Capital injections and withdrawals automatically create balanced journal entries in the ledger, 
          ensuring accurate financial records for all equity movements.
        </p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {transactionType === 'DEPOSIT' ? '📥 Inject Capital' : '📤 Withdraw Capital'}
            </h2>
            <p className="modal-subtitle">
              {transactionType === 'DEPOSIT' 
                ? 'Add capital contribution to increase equity.' 
                : 'Process capital withdrawal for an investor.'}
            </p>

            <div className="modal-form">
              <div className="form-group">
                <label>Investor</label>
                <select 
                  value={selectedInvestor || ''} 
                  onChange={e => setSelectedInvestor(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select Investor...</option>
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Amount (EGP)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 50000" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Description (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Q1 Capital Injection" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  onClick={() => setShowModal(false)}
                  className="admin-btn admin-btn-outline"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleTransaction}
                  disabled={isProcessing || !amount || !selectedInvestor}
                  className={`admin-btn ${transactionType === 'DEPOSIT' ? 'admin-btn-primary' : 'admin-btn-danger'}`}
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {showPartnerModal && (
        <div className="modal-overlay" onClick={() => setShowPartnerModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">👤 Add New Partner</h2>
            <p className="modal-subtitle">
              Add a new investor, partner, or owner to track equity.
            </p>

            <div className="modal-form">
              <div className="form-group">
                <label>Partner Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ahmed Ibrahim" 
                  value={newPartnerName} 
                  onChange={e => setNewPartnerName(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Type</label>
                <select 
                  value={newPartnerType} 
                  onChange={e => setNewPartnerType(e.target.value as 'OWNER' | 'PARTNER' | 'INVESTOR')}
                  className="form-input"
                >
                  <option value="OWNER">Owner</option>
                  <option value="PARTNER">Partner</option>
                  <option value="INVESTOR">Investor</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Initial Capital (Optional)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 100000" 
                  value={newPartnerCapital} 
                  onChange={e => setNewPartnerCapital(e.target.value)}
                  className="form-input"
                />
                <span className="form-hint">Leave empty to add capital later</span>
              </div>
              
              <div className="modal-actions">
                <button 
                  onClick={() => setShowPartnerModal(false)}
                  className="admin-btn admin-btn-outline"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddPartner}
                  disabled={isProcessing || !newPartnerName.trim()}
                  className="admin-btn admin-btn-primary"
                >
                  {isProcessing ? 'Adding...' : 'Add Partner'}
                </button>
              </div>
            </div>
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

        .admin-btn.danger {
          border-color: #fecaca;
          color: #dc2626;
        }

        .admin-btn.danger:hover {
          background: #fef2f2;
        }

        .admin-btn-danger {
          background: #dc2626;
          color: white;
        }

        .admin-btn-danger:hover {
          background: #b91c1c;
        }

        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
          font-size: 28px;
          font-weight: 700;
          color: var(--admin-text-on-light, #12403C);
        }

        .stat-value.positive {
          color: #16a34a;
        }

        .stat-value.accent {
          color: #7c3aed;
        }

        .admin-table-container {
          margin-bottom: 24px;
        }

        .table-header {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(18, 64, 60, 0.08);
        }

        .table-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--admin-text-on-light, #12403C);
        }

        .investor-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .investor-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .investor-name {
          font-weight: 500;
        }

        .status-neutral {
          background: rgba(107, 114, 128, 0.1);
          color: #4b5563;
          border: 1px solid rgba(107, 114, 128, 0.15);
        }

        .text-right {
          text-align: right;
        }

        .font-medium {
          font-weight: 500;
        }

        .ownership-value {
          font-weight: 700;
          color: var(--admin-text-on-light, #12403C);
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

        .delete-btn {
          background: transparent;
          border: none;
          font-size: 16px;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s, transform 0.2s;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .delete-btn:hover:not(:disabled) {
          opacity: 1;
          background: rgba(239, 68, 68, 0.1);
          transform: scale(1.1);
        }

        .delete-btn:disabled {
          opacity: 0.2;
          cursor: not-allowed;
        }

        .info-box {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: var(--admin-radius, 20px);
          padding: 16px 20px;
        }

        .info-box h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 8px;
          font-size: 14px;
          font-weight: 600;
          color: #1e40af;
        }

        .info-box p {
          margin: 0;
          font-size: 13px;
          color: #3b82f6;
          line-height: 1.5;
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
          max-width: 420px;
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

        .admin-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .admin-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(18, 64, 60, 0.1);
          border-top-color: #12403C;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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

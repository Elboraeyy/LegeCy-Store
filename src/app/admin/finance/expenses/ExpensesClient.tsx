'use client';

import { useState, useTransition, useEffect } from 'react';
import { createExpense, createExpenseCategory } from '@/lib/actions/finance';
import { getVaults, Vault } from '@/lib/actions/treasury';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  amount: number | string | { toNumber: () => number };
  description: string;
  date: string | Date;
  status: string;
  paidBy?: string | null;
  category: Category;
}

export default function ExpensesClient({ expenses, categories }: { expenses: Expense[]; categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState('');

  useEffect(() => {
    const loadVaults = async () => {
      const vaultsData = await getVaults();
      setVaults(vaultsData);
      const defaultVault = vaultsData.find(v => v.code === '1001');
      if (defaultVault) setSelectedVaultId(defaultVault.id);
    };
    loadVaults();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        let finalCategoryId = categoryId;
        
        if (isNewCategory && newCategoryName) {
          const newCat = await createExpenseCategory(newCategoryName);
          finalCategoryId = newCat.id;
        }

        await createExpense({
          description,
          amount: Number(amount),
          categoryId: finalCategoryId,
          vaultId: selectedVaultId
        });
        
        setShowModal(false);
        setAmount('');
        setDescription('');
        setCategoryId('');
        setIsNewCategory(false);
        setNewCategoryName('');
        router.refresh();
      } catch (error) {
        alert('Error recording expense');
        console.error(error);
      }
    });
  };

  // Calculate stats
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const thisMonthExpenses = expenses
    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const approvedExpenses = expenses.filter(e => e.status === 'APPROVED').length;
  const pendingExpenses = expenses.filter(e => e.status !== 'APPROVED').length;
  
  // Category breakdown
  const categoryStats = categories.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category?.id === cat.id).reduce((sum, e) => sum + Number(e.amount), 0),
    count: expenses.filter(e => e.category?.id === cat.id).length
  })).sort((a, b) => b.total - a.total);

  const filteredExpenses = selectedCategory
    ? expenses.filter(e => e.category?.id === selectedCategory)
    : expenses;

  return (
    <>
      {/* Back Link */}
      <a href="/admin/finance" className="back-link">
        ← Back to Finance
      </a>

      {/* Page Header */}
      <div className="page-header">
        <h1>💸 Expenses</h1>
        <p className="page-description">
          Track operational costs and outflows
        </p>
      </div>

      {/* Action Buttons */}
      <div className="action-bar">
        <button 
          onClick={() => setShowModal(true)}
          className="admin-btn admin-btn-primary"
        >
          + Record Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="admin-grid stats-grid">
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-icon">💸</span>
          </div>
          <div className="stat-value negative">{formatCurrency(totalExpenses)}</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">This Month</span>
            <span className="stat-icon">📅</span>
          </div>
          <div className="stat-value warning">{formatCurrency(thisMonthExpenses)}</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Approved</span>
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-value positive">{approvedExpenses}</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Pending</span>
            <span className="stat-icon">⏳</span>
          </div>
          <div className="stat-value">{pendingExpenses}</div>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categoryStats.length > 0 && (
        <div className="filter-pills">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`filter-pill ${selectedCategory === null ? 'active' : ''}`}
          >
            All ({expenses.length})
          </button>
          {categoryStats.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`filter-pill category ${selectedCategory === cat.id ? 'active' : ''}`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      )}

      {/* Expenses Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Status</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(exp => (
              <tr key={exp.id}>
                <td>
                  <span className="date-cell">
                    {new Date(exp.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </td>
                <td>
                  <div>
                    <span className="description-text">{exp.description}</span>
                    {exp.paidBy && (
                      <span className="paid-by">Paid by: {exp.paidBy}</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="status-badge status-neutral">
                    {exp.category?.name || 'Uncategorized'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${exp.status === 'APPROVED' ? 'status-active' : 'status-pending'}`}>
                    {exp.status}
                  </span>
                </td>
                <td className="text-right">
                  <span className="amount-negative">-{formatCurrency(Number(exp.amount))}</span>
                </td>
              </tr>
            ))}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  <span className="empty-icon">💸</span>
                  <span>No expenses recorded yet</span>
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
            <h2 className="modal-title">Record New Expense</h2>
            <p className="modal-subtitle">
              This will deduct from the selected vault
            </p>
            
            <form onSubmit={handleCreateExpense} className="modal-form">
              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Office Supplies"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Amount (EGP)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="form-input"
                    placeholder="0.00"
                    required
                    min="1"
                  />
                </div>
                
                {!isNewCategory ? (
                  <div className="form-group">
                    <label>Category</label>
                    <select 
                      value={categoryId}
                      onChange={e => {
                        if (e.target.value === 'NEW') setIsNewCategory(true);
                        else setCategoryId(e.target.value);
                      }}
                      className="form-input"
                      required
                    >
                      <option value="">Select...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                      <option value="NEW">+ New Category</option>
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>New Category</label>
                    <div className="input-with-button">
                      <input 
                        type="text" 
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        className="form-input"
                        placeholder="e.g. Travel"
                        autoFocus
                      />
                      <button 
                        type="button" 
                        onClick={() => setIsNewCategory(false)}
                        className="input-button"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Vault Selection */}
              <div className="form-group">
                <label>🏦 Pay From Vault</label>
                <select
                  value={selectedVaultId}
                  onChange={e => setSelectedVaultId(e.target.value)}
                  className="form-input"
                >
                  {vaults.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.icon} {v.name} ({formatCurrency(v.balance)})
                    </option>
                  ))}
                </select>
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
                  disabled={isPending}
                  className="admin-btn admin-btn-primary"
                >
                  {isPending ? 'Processing...' : 'Record Expense'}
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

        .stat-value.negative { color: #dc2626; }
        .stat-value.warning { color: #d97706; }
        .stat-value.positive { color: #16a34a; }

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

        .filter-pill.category {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .filter-pill.category:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        .filter-pill.category.active {
          background: #dc2626;
          color: white;
        }

        .admin-table-container {
          margin-bottom: 24px;
        }

        .date-cell {
          color: var(--admin-text-muted, #4A6B68);
          font-size: 13px;
        }

        .description-text {
          font-weight: 500;
          display: block;
        }

        .paid-by {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 2px;
          display: block;
        }

        .status-neutral {
          background: rgba(107, 114, 128, 0.1);
          color: #4b5563;
          border: 1px solid rgba(107, 114, 128, 0.15);
        }

        .text-right {
          text-align: right;
        }

        .amount-negative {
          font-weight: 700;
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
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .input-with-button {
          display: flex;
          gap: 8px;
        }

        .input-with-button .form-input {
          flex: 1;
        }

        .input-button {
          padding: 12px 16px;
          background: rgba(18, 64, 60, 0.05);
          border: 1px solid rgba(18, 64, 60, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .input-button:hover {
          background: rgba(18, 64, 60, 0.1);
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

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
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

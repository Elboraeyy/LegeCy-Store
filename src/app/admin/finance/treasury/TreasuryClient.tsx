'use client';

import '@/app/admin/admin.css';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    getVaults,
    getVaultSummary,
    getVaultTransactions,
    createVault,
    depositToVault,
    withdrawFromVault,
    transferBetweenVaults,
    Vault,
    VaultSummary,
    VaultTransaction
} from '@/lib/actions/treasury';
import { formatCurrency } from '@/lib/utils';

export default function TreasuryClient() {
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [summary, setSummary] = useState<VaultSummary | null>(null);
    const [transactions, setTransactions] = useState<VaultTransaction[]>([]);
    const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showAddVault, setShowAddVault] = useState(false);
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const [vaultsData, summaryData] = await Promise.all([
            getVaults(),
            getVaultSummary()
        ]);
        setVaults(vaultsData);
        setSummary(summaryData);
        
        // Load transactions for first vault
        if (vaultsData.length > 0) {
            const defaultVault = vaultsData.find(v => v.code === '1001') || vaultsData[0];
            setSelectedVault(defaultVault);
            const txns = await getVaultTransactions(defaultVault.id);
            setTransactions(txns);
        }
        setLoading(false);
    };

    useEffect(() => {
        let cancelled = false;
        
        (async () => {
            setLoading(true);
            const [vaultsData, summaryData] = await Promise.all([
                getVaults(),
                getVaultSummary()
            ]);
            
            if (cancelled) return;
            
            setVaults(vaultsData);
            setSummary(summaryData);
            
            if (vaultsData.length > 0) {
                const defaultVault = vaultsData.find(v => v.code === '1001') || vaultsData[0];
                setSelectedVault(defaultVault);
                const txns = await getVaultTransactions(defaultVault.id);
                if (!cancelled) setTransactions(txns);
            }
            if (!cancelled) setLoading(false);
        })();
        
        return () => { cancelled = true; };
    }, []);

    const handleSelectVault = async (vault: Vault) => {
        setSelectedVault(vault);
        const txns = await getVaultTransactions(vault.id);
        setTransactions(txns);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="treasury-page">
            {/* Header */}
            <div className="treasury-header">
                <div>
                    <h1 className="admin-title">🏦 Treasury Management</h1>
                    <p className="admin-subtitle">Manage cash boxes, bank accounts, and digital wallets</p>
                </div>
                <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => setShowAddVault(true)}
                >
                    ➕ Add Vault
                </button>
            </div>

            {/* Summary Stats */}
            {summary && (
                <div className="treasury-summary">
                    <div className="admin-card summary-card total">
                        <div className="summary-icon">💰</div>
                        <div>
                            <div className="summary-label">Total Balance</div>
                            <div className="summary-value">{formatCurrency(summary.totalBalance)}</div>
                        </div>
                    </div>
                    <div className="admin-card summary-card">
                        <div className="summary-icon">🏦</div>
                        <div>
                            <div className="summary-label">Active Vaults</div>
                            <div className="summary-value">{summary.vaultCount}</div>
                        </div>
                    </div>
                    <div className="admin-card summary-card">
                        <div className="summary-icon">📅</div>
                        <div>
                            <div className="summary-label">Last Transaction</div>
                            <div className="summary-value small">
                                {summary.lastTransaction
                                    ? formatDate(summary.lastTransaction)
                                    : 'No transactions'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="treasury-loading">
                    <div className="spinner"></div>
                    <p>Loading treasury...</p>
                </div>
            ) : (
                <>
                    {/* Vault Cards */}
                    <div className="vault-grid">
                        {vaults.map(vault => (
                            <div
                                key={vault.id}
                                className={`vault-card ${selectedVault?.id === vault.id ? 'selected' : ''}`}
                                onClick={() => handleSelectVault(vault)}
                                style={{ '--vault-color': vault.color } as React.CSSProperties}
                            >
                                <div className="vault-header">
                                    <span className="vault-icon">{vault.icon}</span>
                                    <span className="vault-code">{vault.code}</span>
                                </div>
                                <div className="vault-name">{vault.name}</div>
                                <div className="vault-balance">{formatCurrency(vault.balance)}</div>
                                {vault.isSystem && <span className="system-badge">System</span>}
                                <div className="vault-actions">
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); setSelectedVault(vault); setShowDeposit(true); }}
                                        className="vault-action-btn deposit"
                                    >
                                        ➕ Deposit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); setSelectedVault(vault); setShowWithdraw(true); }}
                                        className="vault-action-btn withdraw"
                                    >
                                        ➖ Withdraw
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        {vaults.length === 0 && (
                            <div className="vault-empty">
                                <span className="empty-icon">🏦</span>
                                <h3>No Vaults Yet</h3>
                                <p>Add your first vault to start tracking cash flow</p>
                            </div>
                        )}
                    </div>

                    {/* Transfer Button */}
                    {vaults.length >= 2 && (
                        <div className="transfer-section">
                            <button
                                type="button"
                                className="admin-btn admin-btn-outline"
                                onClick={() => setShowTransfer(true)}
                            >
                                🔄 Transfer Between Vaults
                            </button>
                        </div>
                    )}

                    {/* Transaction History */}
                    {selectedVault && (
                        <div className="admin-card">
                            <h3 className="section-title">
                                📋 Transaction History - {selectedVault.name}
                            </h3>
                            {transactions.length === 0 ? (
                                <div className="no-transactions">
                                    <p>No transactions recorded yet</p>
                                </div>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Description</th>
                                            <th>Type</th>
                                            <th className="text-right">Amount</th>
                                            <th className="text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(tx => (
                                            <tr key={tx.id}>
                                                <td>
                                                    <span className="tx-date">{formatDate(tx.date)}</span>
                                                </td>
                                                <td>
                                                    <div className="tx-description">{tx.description}</div>
                                                    {tx.source && <div className="tx-source">{tx.source}</div>}
                                                </td>
                                                <td>
                                                    <span className={`tx-type ${tx.type}`}>
                                                        {tx.type === 'deposit' && '➕ Deposit'}
                                                        {tx.type === 'withdraw' && '➖ Withdraw'}
                                                        {tx.type === 'transfer' && '🔄 Transfer'}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <span className={`tx-amount ${tx.type === 'deposit' ? 'positive' : 'negative'}`}>
                                                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <span className="tx-balance">{formatCurrency(tx.balance)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Add Vault Modal */}
            {showAddVault && (
                <AddVaultModal
                    onClose={() => setShowAddVault(false)}
                    onSuccess={() => { loadData(); setShowAddVault(false); }}
                />
            )}

            {/* Deposit Modal */}
            {showDeposit && selectedVault && (
                <DepositModal
                    vault={selectedVault}
                    onClose={() => setShowDeposit(false)}
                    onSuccess={() => { loadData(); setShowDeposit(false); }}
                />
            )}

            {/* Withdraw Modal */}
            {showWithdraw && selectedVault && (
                <WithdrawModal
                    vault={selectedVault}
                    onClose={() => setShowWithdraw(false)}
                    onSuccess={() => { loadData(); setShowWithdraw(false); }}
                />
            )}

            {/* Transfer Modal */}
            {showTransfer && (
                <TransferModal
                    vaults={vaults}
                    onClose={() => setShowTransfer(false)}
                    onSuccess={() => { loadData(); setShowTransfer(false); }}
                />
            )}

            <style jsx>{`
                .treasury-page {
                    padding: 0;
                }

                .treasury-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .treasury-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .summary-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 24px;
                }

                .summary-card.total {
                    background: linear-gradient(135deg, #12403C, #1a5c56);
                    color: #fff;
                }

                .summary-card.total .summary-label {
                    color: rgba(255,255,255,0.8);
                }

                .summary-icon {
                    font-size: 32px;
                }

                .summary-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--admin-text-muted);
                }

                .summary-value {
                    font-size: 24px;
                    font-weight: 600;
                }

                .summary-value.small {
                    font-size: 14px;
                }

                .treasury-loading {
                    padding: 80px 24px;
                    text-align: center;
                }

                .vault-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 24px;
                }

                .vault-card {
                    background: #fff;
                    border: 2px solid #eee;
                    border-radius: 16px;
                    padding: 24px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .vault-card:hover {
                    border-color: var(--vault-color, #12403C);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .vault-card.selected {
                    border-color: var(--vault-color, #12403C);
                    background: linear-gradient(135deg, rgba(18, 64, 60, 0.05), rgba(18, 64, 60, 0.02));
                }

                .vault-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .vault-icon {
                    font-size: 32px;
                }

                .vault-code {
                    font-family: monospace;
                    font-size: 12px;
                    color: var(--admin-text-muted);
                    background: #f3f4f6;
                    padding: 4px 8px;
                    border-radius: 4px;
                }

                .vault-name {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 8px;
                }

                .vault-balance {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--vault-color, #12403C);
                    margin-bottom: 16px;
                }

                .system-badge {
                    display: inline-block;
                    font-size: 10px;
                    padding: 2px 8px;
                    border-radius: 99px;
                    background: rgba(18, 64, 60, 0.1);
                    color: var(--admin-text-muted);
                    margin-bottom: 12px;
                }

                .vault-actions {
                    display: flex;
                    gap: 8px;
                }

                .vault-action-btn {
                    flex: 1;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }

                .vault-action-btn:hover {
                    opacity: 0.8;
                }

                .vault-action-btn.deposit {
                    background: #dcfce7;
                    color: #166534;
                }

                .vault-action-btn.withdraw {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .vault-empty {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 24px;
                    background: #f9f9f9;
                    border-radius: 16px;
                }

                .empty-icon {
                    font-size: 48px;
                    display: block;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }

                .transfer-section {
                    margin-bottom: 24px;
                    text-align: center;
                }

                .section-title {
                    font-size: 16px;
                    font-weight: 600;
                    padding: 16px;
                    margin: 0;
                    border-bottom: 1px solid #eee;
                }

                .no-transactions {
                    padding: 40px;
                    text-align: center;
                    color: var(--admin-text-muted);
                }

                .tx-date {
                    font-size: 12px;
                    color: var(--admin-text-muted);
                }

                .tx-description {
                    font-weight: 500;
                }

                .tx-source {
                    font-size: 12px;
                    color: var(--admin-text-muted);
                }

                .tx-type {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 99px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .tx-type.deposit {
                    background: #dcfce7;
                    color: #166534;
                }

                .tx-type.withdraw {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .tx-type.transfer {
                    background: #e0e7ff;
                    color: #4338ca;
                }

                .text-right {
                    text-align: right;
                }

                .tx-amount {
                    font-weight: 600;
                }

                .tx-amount.positive {
                    color: #166534;
                }

                .tx-amount.negative {
                    color: #b91c1c;
                }

                .tx-balance {
                    font-weight: 500;
                    color: var(--admin-text-muted);
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid var(--admin-bg-dark);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// ==========================================
// Add Vault Modal
// ==========================================

function AddVaultModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [initialBalance, setInitialBalance] = useState(0);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async () => {
        if (!name || !code) {
            toast.error('Name and code are required');
            return;
        }

        setProcessing(true);
        const result = await createVault({ name, code, description, initialBalance });
        setProcessing(false);

        if (result.success) {
            toast.success('Vault created successfully');
            onSuccess();
        } else {
            toast.error(result.error || 'Failed to create vault');
        }
    };

    return (
        <div 
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '16px'
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    background: '#fff',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '480px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Add New Vault</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ flex: '0 0 100px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', marginBottom: '6px' }}>Code</label>
                            <input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="1002"
                                className="form-input"
                            />
                            <small style={{ fontSize: '11px', color: '#888' }}>Must start with 10</small>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', marginBottom: '6px' }}>Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g., Bank Account - CIB"
                                className="form-input"
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', marginBottom: '6px' }}>Description (Optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Brief description..."
                            className="form-input"
                        />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', marginBottom: '6px' }}>Initial Balance (EGP)</label>
                        <input
                            type="number"
                            value={initialBalance}
                            onChange={e => setInitialBalance(Number(e.target.value))}
                            className="form-input"
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid #eee', background: '#fafafa', borderRadius: '0 0 20px 20px' }}>
                    <button type="button" className="admin-btn admin-btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                    <button type="button" className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={processing} style={{ flex: 1 }}>
                        {processing ? 'Creating...' : 'Create Vault'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Deposit Modal
// ==========================================

function DepositModal({ vault, onClose, onSuccess }: { vault: Vault; onClose: () => void; onSuccess: () => void }) {
    const [amount, setAmount] = useState(0);
    const [source, setSource] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async () => {
        if (amount <= 0 || !source) {
            toast.error('Amount and source are required');
            return;
        }

        setProcessing(true);
        const result = await depositToVault(vault.id, amount, source, notes);
        setProcessing(false);

        if (result.success) {
            toast.success('Deposit successful');
            onSuccess();
        } else {
            toast.error(result.error || 'Failed to deposit');
        }
    };

    return (
        <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
            onClick={onClose}
        >
            <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>➕ Deposit to {vault.name}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9f9f9', borderRadius: '12px', marginBottom: '20px', fontWeight: 500 }}>
                        <span>{vault.icon} {vault.name}</span>
                        <span style={{ color: '#666' }}>Current: {formatCurrency(vault.balance)}</span>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#666', marginBottom: '6px' }}>Amount (EGP)</label>
                        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="form-input" style={{ fontSize: '24px', fontWeight: 600, textAlign: 'center' }} min={0} />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#666', marginBottom: '6px' }}>Source</label>
                        <input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="e.g., Cash Sales" className="form-input" />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#666', marginBottom: '6px' }}>Notes (Optional)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." className="form-input" rows={2} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid #eee', background: '#fafafa', borderRadius: '0 0 20px 20px' }}>
                    <button type="button" className="admin-btn admin-btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                    <button type="button" style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }} onClick={handleSubmit} disabled={processing || amount <= 0}>
                        {processing ? 'Processing...' : `Deposit ${formatCurrency(amount)}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Withdraw Modal
// ==========================================

function WithdrawModal({ vault, onClose, onSuccess }: { vault: Vault; onClose: () => void; onSuccess: () => void }) {
    const [amount, setAmount] = useState(0);
    const [destination, setDestination] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async () => {
        if (amount <= 0 || !destination) {
            toast.error('Amount and destination are required');
            return;
        }

        if (amount > vault.balance) {
            toast.error('Insufficient balance');
            return;
        }

        setProcessing(true);
        const result = await withdrawFromVault(vault.id, amount, destination, notes);
        setProcessing(false);

        if (result.success) {
            toast.success('Withdrawal successful');
            onSuccess();
        } else {
            toast.error(result.error || 'Failed to withdraw');
        }
    };

    return (
        <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
            onClick={onClose}
        >
            <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>➖ Withdraw from {vault.name}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9f9f9', borderRadius: '12px', marginBottom: '20px', fontWeight: 500 }}>
                        <span>{vault.icon} {vault.name}</span>
                        <span style={{ color: '#666' }}>Available: {formatCurrency(vault.balance)}</span>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#666', marginBottom: '6px' }}>Amount (EGP)</label>
                        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="form-input" style={{ fontSize: '24px', fontWeight: 600, textAlign: 'center' }} max={vault.balance} min={0} />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#666', marginBottom: '6px' }}>Destination / Purpose</label>
                        <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g., Petty Cash" className="form-input" />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#666', marginBottom: '6px' }}>Notes (Optional)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." className="form-input" rows={2} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid #eee', background: '#fafafa', borderRadius: '0 0 20px 20px' }}>
                    <button type="button" className="admin-btn admin-btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                    <button type="button" style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }} onClick={handleSubmit} disabled={processing || amount <= 0 || amount > vault.balance}>
                        {processing ? 'Processing...' : `Withdraw ${formatCurrency(amount)}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Transfer Modal
// ==========================================

function TransferModal({ vaults, onClose, onSuccess }: { vaults: Vault[]; onClose: () => void; onSuccess: () => void }) {
    const [fromId, setFromId] = useState(vaults[0]?.id || '');
    const [toId, setToId] = useState(vaults[1]?.id || '');
    const [amount, setAmount] = useState(0);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const fromVault = vaults.find(v => v.id === fromId);

    const handleSubmit = async () => {
        if (amount <= 0) {
            toast.error('Amount must be positive');
            return;
        }

        if (fromId === toId) {
            toast.error('Cannot transfer to the same vault');
            return;
        }

        if (fromVault && amount > fromVault.balance) {
            toast.error('Insufficient balance');
            return;
        }

        setProcessing(true);
        const result = await transferBetweenVaults(fromId, toId, amount, notes);
        setProcessing(false);

        if (result.success) {
            toast.success('Transfer successful');
            onSuccess();
        } else {
            toast.error(result.error || 'Failed to transfer');
        }
    };

    return (
        <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
            onClick={onClose}
        >
            <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>🔄 Transfer Between Vaults</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#666', marginBottom: '6px' }}>From</label>
                        <select value={fromId} onChange={e => setFromId(e.target.value)} className="form-input">
                            {vaults.map(v => (
                                <option key={v.id} value={v.id}>{v.icon} {v.name} ({formatCurrency(v.balance)})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '24px', margin: '8px 0' }}>⬇️</div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#666', marginBottom: '6px' }}>To</label>
                        <select value={toId} onChange={e => setToId(e.target.value)} className="form-input">
                            {vaults.filter(v => v.id !== fromId).map(v => (
                                <option key={v.id} value={v.id}>{v.icon} {v.name} ({formatCurrency(v.balance)})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#666', marginBottom: '6px' }}>Amount (EGP)</label>
                        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="form-input" style={{ fontSize: '24px', fontWeight: 600, textAlign: 'center' }} max={fromVault?.balance || 0} min={0} />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#666', marginBottom: '6px' }}>Notes (Optional)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for transfer..." className="form-input" rows={2} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid #eee', background: '#fafafa', borderRadius: '0 0 20px 20px' }}>
                    <button type="button" className="admin-btn admin-btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                    <button type="button" className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={processing || amount <= 0} style={{ flex: 1 }}>
                        {processing ? 'Processing...' : `Transfer ${formatCurrency(amount)}`}
                    </button>
                </div>
            </div>
        </div>
    );
}


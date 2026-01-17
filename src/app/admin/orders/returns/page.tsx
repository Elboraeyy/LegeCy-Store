'use client';

import '@/app/admin/admin.css';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    getReturnRequests,
    getReturnStats,
    approveRefundAction,
    rejectRefundAction,
    completeRefundAction,
    addReturnNote,
    bulkUpdateReturnStatus,
    ReturnWithDetails,
    ReturnStats,
    ReturnFilters
} from '@/lib/actions/returns';

// ==========================================
// Types
// ==========================================

type TabType = 'all' | 'pending' | 'approved' | 'completed' | 'rejected';
type ModalType = 'view' | 'approve' | 'reject' | 'complete' | null;

// ==========================================
// Main Component
// ==========================================

export default function ReturnsPage() {
    const [returns, setReturns] = useState<ReturnWithDetails[]>([]);
    const [stats, setStats] = useState<ReturnStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedReturns, setSelectedReturns] = useState<Set<string>>(new Set());
    const [modalType, setModalType] = useState<ModalType>(null);
    const [selectedReturn, setSelectedReturn] = useState<ReturnWithDetails | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const filters: ReturnFilters = {
                status: activeTab === 'all' ? undefined : activeTab,
                search: search || undefined,
                page,
                limit: 20
            };

            const [returnsData, statsData] = await Promise.all([
                getReturnRequests(filters),
                getReturnStats()
            ]);

            setReturns(returnsData.returns);
            setTotalPages(returnsData.totalPages);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load returns:', error);
            toast.error('Failed to load returns');
        } finally {
            setLoading(false);
        }
    }, [activeTab, search, page]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ==========================================
    // Handlers
    // ==========================================

    const handleApprove = async (id: string, amount?: number) => {
        const result = await approveRefundAction(id, amount);
        if (result.success) {
            toast.success(result.message || 'Return approved');
            loadData();
            setModalType(null);
        } else {
            toast.error(result.message || 'Failed to approve');
        }
    };

    const handleReject = async (id: string, reason: string) => {
        if (!reason || reason.length < 10) {
            toast.error('Please provide a reason (min 10 characters)');
            return;
        }
        const result = await rejectRefundAction(id, reason);
        if (result.success) {
            toast.success('Return rejected');
            loadData();
            setModalType(null);
        } else {
            toast.error(result.message || 'Failed to reject');
        }
    };

    const handleComplete = async (id: string, reference?: string) => {
        const result = await completeRefundAction(id, reference);
        if (result.success) {
            toast.success('Refund completed & inventory restored');
            loadData();
            setModalType(null);
        } else {
            toast.error(result.message || 'Failed to complete');
        }
    };

    const handleAddNote = async (id: string, note: string) => {
        const result = await addReturnNote(id, note);
        if (result.success) {
            toast.success('Note added');
            loadData();
        } else {
            toast.error(result.error || 'Failed to add note');
        }
    };

    const handleBulkAction = async (action: 'approve' | 'reject') => {
        if (selectedReturns.size === 0) return;
        
        const reason = action === 'reject' ? prompt('Enter rejection reason:') : undefined;
        if (action === 'reject' && (!reason || reason.length < 10)) {
            toast.error('Rejection reason required (min 10 chars)');
            return;
        }

        const result = await bulkUpdateReturnStatus(Array.from(selectedReturns), action, reason || undefined);
        if (result.success) {
            toast.success(`${result.processed} returns ${action}d`);
            setSelectedReturns(new Set());
            loadData();
        } else {
            toast.error(`Processed ${result.processed}, Errors: ${result.errors.length}`);
        }
    };

    const openModal = (type: ModalType, returnItem: ReturnWithDetails) => {
        setSelectedReturn(returnItem);
        setModalType(type);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'status-pending';
            case 'approved': return 'status-approved';
            case 'completed': return 'status-completed';
            case 'rejected': return 'status-rejected';
            default: return '';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const tabs = [
        { id: 'all', label: 'All Returns', icon: '📦', count: stats?.total },
        { id: 'pending', label: 'Pending', icon: '⏳', count: stats?.pending },
        { id: 'approved', label: 'Approved', icon: '✅', count: stats?.approved },
        { id: 'completed', label: 'Completed', icon: '💰', count: stats?.completed },
        { id: 'rejected', label: 'Rejected', icon: '❌', count: stats?.rejected },
    ];

    return (
        <div className="admin-returns-page">
            {/* Header */}
            <div className="returns-header">
                <div>
                    <h1 className="admin-title">Returns & Refunds</h1>
                    <p className="admin-subtitle">Manage return requests, process refunds, and track inventory restoration</p>
                </div>
                <div className="returns-header-actions">
                    <Link href="/admin/orders/returns/intelligence" className="admin-btn admin-btn-outline">
                        <span>📊</span> Analytics
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="returns-stats-grid">
                    <div className="admin-card returns-stat-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-content">
                            <div className="stat-label">Pending Review</div>
                            <div className="stat-value">{stats.pending}</div>
                            <div className="stat-meta">{formatCurrency(stats.pendingRefundAmount)} pending</div>
                        </div>
                    </div>
                    <div className="admin-card returns-stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Refunded</div>
                            <div className="stat-value">{formatCurrency(stats.totalRefundAmount)}</div>
                            <div className="stat-meta">{stats.completed} completed</div>
                        </div>
                    </div>
                    <div className="admin-card returns-stat-card">
                        <div className="stat-icon">⏱️</div>
                        <div className="stat-content">
                            <div className="stat-label">Avg Processing</div>
                            <div className="stat-value">{stats.avgProcessingDays} days</div>
                            <div className="stat-meta">from request to refund</div>
                        </div>
                    </div>
                    <div className="admin-card returns-stat-card">
                        <div className="stat-icon">📈</div>
                        <div className="stat-content">
                            <div className="stat-label">Return Rate</div>
                            <div className="stat-value">{stats.returnRate}%</div>
                            <div className="stat-meta">last 30 days</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs & Search */}
            <div className="returns-tabs-container">
                <div className="admin-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => { setActiveTab(tab.id as TabType); setPage(1); }}
                        >
                            <span>{tab.icon}</span> {tab.label}
                            {tab.count !== undefined && <span className="tab-count">({tab.count})</span>}
                        </button>
                    ))}
                </div>
                <div className="returns-search">
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by Order ID or Email..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedReturns.size > 0 && (
                <div className="returns-bulk-actions">
                    <span>{selectedReturns.size} selected</span>
                    <button type="button" className="admin-btn admin-btn-outline" onClick={() => handleBulkAction('approve')}>
                        Approve All
                    </button>
                    <button type="button" className="admin-btn admin-btn-outline" onClick={() => handleBulkAction('reject')}>
                        Reject All
                    </button>
                    <button type="button" className="admin-btn admin-btn-outline" onClick={() => setSelectedReturns(new Set())}>
                        Clear
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="admin-card">
                {loading ? (
                    <div className="returns-loading">
                        <div className="spinner"></div>
                        <p>Loading returns...</p>
                    </div>
                ) : returns.length === 0 ? (
                    <div className="returns-empty">
                        <div className="returns-empty-icon">📦</div>
                        <h3>No Returns Found</h3>
                        <p>No return requests match your filters</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedReturns.size === returns.filter(r => r.status === 'pending').length && returns.filter(r => r.status === 'pending').length > 0}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                setSelectedReturns(new Set(returns.filter(r => r.status === 'pending').map(r => r.id)));
                                            } else {
                                                setSelectedReturns(new Set());
                                            }
                                        }}
                                    />
                                </th>
                                <th>Order</th>
                                <th>Customer</th>
                                <th>Reason</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returns.map(returnItem => (
                                <tr key={returnItem.id}>
                                    <td>
                                        {returnItem.status === 'pending' && (
                                            <input
                                                type="checkbox"
                                                checked={selectedReturns.has(returnItem.id)}
                                                onChange={e => {
                                                    const next = new Set(selectedReturns);
                                                    if (e.target.checked) next.add(returnItem.id);
                                                    else next.delete(returnItem.id);
                                                    setSelectedReturns(next);
                                                }}
                                            />
                                        )}
                                    </td>
                                    <td>
                                        <Link href={`/admin/orders/${returnItem.orderId}`} className="order-link">
                                            #{returnItem.orderId.slice(0, 8)}
                                        </Link>
                                        <div className="order-meta">{returnItem.order.items.length} items</div>
                                    </td>
                                    <td>
                                        <div className="customer-name">{returnItem.order.customerName || 'Guest'}</div>
                                        <div className="customer-email">{returnItem.order.customerEmail}</div>
                                    </td>
                                    <td>
                                        <div className="return-reason">{returnItem.reason.slice(0, 50)}{returnItem.reason.length > 50 ? '...' : ''}</div>
                                    </td>
                                    <td>
                                        <div className="return-amount">{formatCurrency(returnItem.order.totalPrice)}</div>
                                        <div className="payment-method">{returnItem.order.paymentMethod}</div>
                                    </td>
                                    <td>
                                        <div>{formatDate(returnItem.createdAt)}</div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(returnItem.status)}`}>
                                            {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="return-actions">
                                            <button type="button" className="action-btn" onClick={() => openModal('view', returnItem)} title="View Details">
                                                👁️
                                            </button>
                                            {returnItem.status === 'pending' && (
                                                <>
                                                    <button type="button" className="action-btn action-btn-success" onClick={() => openModal('approve', returnItem)} title="Approve">
                                                        ✅
                                                    </button>
                                                    <button type="button" className="action-btn action-btn-danger" onClick={() => openModal('reject', returnItem)} title="Reject">
                                                        ❌
                                                    </button>
                                                </>
                                            )}
                                            {returnItem.status === 'approved' && (
                                                <button type="button" className="action-btn action-btn-primary" onClick={() => openModal('complete', returnItem)} title="Complete Refund">
                                                    💰
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="returns-pagination">
                    <button
                        type="button"
                        className="admin-btn admin-btn-outline"
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        ← Previous
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                        type="button"
                        className="admin-btn admin-btn-outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Modals */}
            {modalType && selectedReturn && (
                <ReturnModal
                    type={modalType}
                    returnItem={selectedReturn}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onComplete={handleComplete}
                    onAddNote={handleAddNote}
                    onClose={() => { setModalType(null); setSelectedReturn(null); }}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                />
            )}

            <style jsx>{`
                .admin-returns-page {
                    padding: 0;
                }

                .returns-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .returns-header-actions {
                    display: flex;
                    gap: 12px;
                }

                .returns-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .returns-stat-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 24px;
                }

                .stat-icon {
                    font-size: 32px;
                    line-height: 1;
                }

                .stat-content {
                    flex: 1;
                }

                .stat-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--admin-text-muted);
                }

                .stat-value {
                    font-size: 28px;
                    font-weight: 600;
                    color: var(--admin-text-on-light);
                    margin: 4px 0;
                }

                .stat-meta {
                    font-size: 12px;
                    color: var(--admin-text-muted);
                }

                .returns-tabs-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                }

                .returns-search {
                    min-width: 280px;
                }

                .returns-search .form-input {
                    width: 100%;
                }

                .returns-bulk-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: var(--admin-surface-light);
                    border-radius: var(--admin-radius-sm);
                    margin-bottom: 16px;
                }

                .returns-loading, .returns-empty {
                    padding: 80px 24px;
                    text-align: center;
                }

                .returns-empty-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                }

                .returns-empty h3 {
                    font-size: 20px;
                    margin-bottom: 8px;
                }

                .returns-empty p {
                    color: var(--admin-text-muted);
                }

                .order-link {
                    font-family: 'Fira Code', monospace;
                    font-weight: 600;
                    color: var(--admin-bg-dark);
                    text-decoration: none;
                }

                .order-link:hover {
                    text-decoration: underline;
                }

                .order-meta, .customer-email, .payment-method {
                    font-size: 12px;
                    color: var(--admin-text-muted);
                }

                .customer-name {
                    font-weight: 500;
                }

                .return-reason {
                    max-width: 200px;
                    font-size: 13px;
                }

                .return-amount {
                    font-weight: 600;
                }

                .return-actions {
                    display: flex;
                    gap: 8px;
                }

                .action-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 6px;
                    border-radius: 6px;
                    transition: background 0.2s;
                }

                .action-btn:hover {
                    background: rgba(0, 0, 0, 0.05);
                }

                .returns-pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 16px;
                    margin-top: 24px;
                }

                .status-badge.status-pending {
                    background: rgba(234, 179, 8, 0.1);
                    color: #b45309;
                    border: 1px solid rgba(234, 179, 8, 0.2);
                }

                .status-badge.status-approved {
                    background: rgba(59, 130, 246, 0.1);
                    color: #1d4ed8;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }

                .status-badge.status-completed {
                    background: rgba(22, 163, 74, 0.1);
                    color: #15803d;
                    border: 1px solid rgba(22, 163, 74, 0.2);
                }

                .status-badge.status-rejected {
                    background: rgba(239, 68, 68, 0.1);
                    color: #b91c1c;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }

                .admin-tabs {
                    display: flex;
                    gap: 8px;
                    background: var(--admin-surface-light);
                    padding: 6px;
                    border-radius: 999px;
                    flex-wrap: nowrap;
                }

                .admin-tab {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 18px;
                    border: none;
                    background: transparent;
                    color: var(--admin-text-muted);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    border-radius: 999px;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .admin-tab:hover {
                    background: rgba(0, 0, 0, 0.05);
                    color: var(--admin-text-on-light);
                }

                .admin-tab.active {
                    background: var(--admin-bg-dark);
                    color: #fff;
                    box-shadow: 0 2px 8px rgba(18, 64, 60, 0.15);
                }

                .tab-count {
                    font-size: 11px;
                    opacity: 0.7;
                    margin-left: 4px;
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

                @media (max-width: 768px) {
                    .returns-header {
                        flex-direction: column;
                    }

                    .returns-tabs-container {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .admin-tabs {
                        overflow-x: auto;
                        width: 100%;
                    }

                    .returns-search {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

// ==========================================
// Return Modal Component
// ==========================================

function ReturnModal({
    type,
    returnItem,
    onApprove,
    onReject,
    onComplete,
    onAddNote,
    onClose,
    formatCurrency,
    formatDate
}: {
    type: ModalType;
    returnItem: ReturnWithDetails;
    onApprove: (id: string, amount?: number) => void;
    onReject: (id: string, reason: string) => void;
    onComplete: (id: string, reference?: string) => void;
    onAddNote: (id: string, note: string) => void;
    onClose: () => void;
    formatCurrency: (n: number) => string;
    formatDate: (d: Date) => string;
}) {
    const [rejectReason, setRejectReason] = useState('');
    const [transactionRef, setTransactionRef] = useState('');
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);

    // Calculate suggested refund based on discounted prices of returned items
    const suggestedRefund = (returnItem.items as any[]).reduce((sum, lineItem) => {
        const original = returnItem.order.items.find(i => i.id === lineItem.id);
        if (!original) return sum;
        // Use discounted price if available, otherwise original price
        const pricePerUnit = original.discountedPrice ?? original.price;
        return sum + (pricePerUnit * lineItem.quantity);
    }, 0);

    const [refundAmount, setRefundAmount] = useState(suggestedRefund);

    const handleSubmit = async () => {
        setProcessing(true);
        try {
            if (type === 'approve') {
                await onApprove(returnItem.id, refundAmount);
            } else if (type === 'reject') {
                await onReject(returnItem.id, rejectReason);
            } else if (type === 'complete') {
                await onComplete(returnItem.id, transactionRef || undefined);
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleAddNote = async () => {
        if (!note.trim()) return;
        await onAddNote(returnItem.id, note);
        setNote('');
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
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
                    maxWidth: '600px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 25px -5px rgba(18, 64, 60, 0.1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(0,0,0,0.08)'
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
                        {type === 'view' ? 'Return Details' :
                         type === 'approve' ? 'Approve Return' :
                         type === 'reject' ? 'Reject Return' : 'Complete Refund'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#999' }}>×</button>
                </div>

                <div style={{ padding: '24px' }}>
                    {/* Order Info */}
                    <div style={{ marginBottom: '24px', padding: '16px', background: '#f9f9f9', borderRadius: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Order</div>
                                <div style={{ fontWeight: 600 }}>#{returnItem.orderId.slice(0, 8)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Amount</div>
                                <div style={{ fontWeight: 600 }}>{formatCurrency(returnItem.order.totalPrice)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Customer</div>
                                <div>{returnItem.order.customerName || 'Guest'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Requested</div>
                                <div>{formatDate(returnItem.createdAt)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Return Type */}
                    <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Return Type</div>
                            <div style={{ padding: '8px 12px', background: '#e0f2f1', borderRadius: '8px', color: '#00695c', fontWeight: 600, display: 'inline-block' }}>
                                {returnItem.returnType === 'store_credit' ? 'Store Credit' :
                                    returnItem.returnType === 'exchange' ? 'Exchange' : 'Refund'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Reason</div>
                            <div style={{ padding: '8px 12px', background: '#fff8e1', borderRadius: '8px', border: '1px solid #ffe082', display: 'inline-block' }}>
                                {returnItem.reason}
                            </div>
                        </div>
                    </div>

                    {/* Customer Description */}
                    {returnItem.description && (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Customer Comments</div>
                            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', fontStyle: 'italic' }}>
                                "{returnItem.description}"
                            </div>
                        </div>
                    )}

                    {/* Photos */}
                    {returnItem.images && returnItem.images.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Uploaded Photos ({returnItem.images.length})
                            </div>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {returnItem.images.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                        <img src={url} alt={`Return photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Items */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Returned Items</div>
                        <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                            {(returnItem.items as any[]).map((linesItem: any) => {
                                const originalItem = returnItem.order.items.find(i => i.id === linesItem.id);
                                if (!originalItem) return null;
                                const hasDiscount = originalItem.discountedPrice !== null;
                                const effectivePrice = originalItem.discountedPrice ?? originalItem.price;
                                const refundForItem = effectivePrice * linesItem.quantity;
                                const originalTotal = originalItem.price * linesItem.quantity;
                                return (
                                    <div key={linesItem.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #eee' }}>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{originalItem.name}</div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                Returned Qty: {linesItem.quantity} / {originalItem.quantity}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 500, color: hasDiscount ? '#15803d' : 'inherit' }}>
                                                {formatCurrency(refundForItem)}
                                            </div>
                                            {hasDiscount && (
                                                <div style={{ fontSize: '11px', color: '#999', textDecoration: 'line-through' }}>
                                                    {formatCurrency(originalTotal)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {suggestedRefund < returnItem.order.totalPrice && (
                            <div style={{ marginTop: '8px', padding: '8px 12px', background: '#e0f2f1', borderRadius: '6px', fontSize: '12px', color: '#00695c' }}>
                                💡 Refund includes coupon discount distribution
                            </div>
                        )}
                    </div>

                    {/* Admin Note */}
                    {returnItem.adminNote && (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Admin Notes</div>
                            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '13px' }}>
                                {returnItem.adminNote}
                            </div>
                        </div>
                    )}

                    {/* Action-specific inputs */}
                    {type === 'reject' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Rejection Reason *</label>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Enter reason for rejection (min 10 characters)..."
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', minHeight: '80px', resize: 'vertical' }}
                            />
                        </div>
                    )}

                    {type === 'approve' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Refund Amount</label>
                            <input
                                type="number"
                                value={refundAmount}
                                onChange={e => setRefundAmount(Number(e.target.value))}
                                max={returnItem.order.totalPrice}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                            />
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Max: {formatCurrency(returnItem.order.totalPrice)}</div>
                        </div>
                    )}

                    {type === 'complete' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Transaction Reference (Optional)</label>
                            <input
                                type="text"
                                value={transactionRef}
                                onChange={e => setTransactionRef(e.target.value)}
                                placeholder="e.g., PAYMOB-REF-12345 or Manual"
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                            />
                        </div>
                    )}

                    {/* Add Note (view mode) */}
                    {type === 'view' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Add Note</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Add a note..."
                                    style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                                <button onClick={handleAddNote} className="admin-btn admin-btn-outline" style={{ padding: '12px 16px' }}>Add</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                    background: '#fafafa'
                }}>
                    <button type="button" className="admin-btn admin-btn-outline" onClick={onClose}>
                        {type === 'view' ? 'Close' : 'Cancel'}
                    </button>
                    {type !== 'view' && (
                        <button
                            type="button"
                            className={`admin-btn ${type === 'reject' ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                            onClick={handleSubmit}
                            disabled={processing || (type === 'reject' && rejectReason.length < 10)}
                            style={type === 'reject' ? { background: '#dc2626', color: '#fff' } : {}}
                        >
                            {processing ? 'Processing...' :
                             type === 'approve' ? 'Approve Return' :
                             type === 'reject' ? 'Reject Return' : 'Complete Refund'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

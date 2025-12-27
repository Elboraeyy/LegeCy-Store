'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { fetchStockCounts, createStockCount, startStockCount, cancelStockCount, StockCountWithDetails } from '@/lib/actions/stockcount-actions';
import { fetchWarehouses, WarehouseWithStats } from '@/lib/actions/warehouse-actions';
import StockCountDialog from '@/components/admin/inventory/StockCountDialog';
import Link from 'next/link';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    DRAFT: { label: 'Draft', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' },
    IN_PROGRESS: { label: 'In Progress', color: '#b76e00', bgColor: 'rgba(183, 110, 0, 0.1)' },
    COMPLETED: { label: 'Completed', color: '#166534', bgColor: 'rgba(22, 101, 52, 0.1)' },
    CANCELLED: { label: 'Cancelled', color: '#991b1b', bgColor: 'rgba(153, 27, 27, 0.1)' },
};

export default function StockCountsPage() {
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();
    const [counts, setCounts] = useState<StockCountWithDetails[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showCreate, setShowCreate] = useState(false);
    const [activeCount, setActiveCount] = useState<StockCountWithDetails | null>(null);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

    const loadCounts = useCallback(async (page = 1) => {
        setLoading(true);
        const res = await fetchStockCounts({ 
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            page 
        });
        setCounts(res.data);
        setMeta(res.meta);
        setLoading(false);
    }, [statusFilter]);

    const loadWarehouses = useCallback(async () => {
        const data = await fetchWarehouses();
        setWarehouses(data);
    }, []);

    useEffect(() => {
        if (!permLoading && hasPermission('INVENTORY_MANAGE')) {
            loadCounts();
            loadWarehouses();
        }
    }, [permLoading, hasPermission, loadCounts, loadWarehouses]);

    const handleCreate = async (warehouseId: string, notes: string) => {
        const res = await createStockCount(warehouseId, notes);
        if ('error' in res) {
            toast.error(res.error);
            return false;
        }
        toast.success('Stock count created');
        loadCounts();
        return true;
    };

    const handleStart = async (count: StockCountWithDetails) => {
        const res = await startStockCount(count.id);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Stock count started'); loadCounts(meta.page); }
    };

    const handleCancel = async (count: StockCountWithDetails) => {
        if (!confirm('Cancel this stock count? All progress will be lost.')) return;
        const res = await cancelStockCount(count.id);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Stock count cancelled'); loadCounts(meta.page); }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
    };

    if (permLoading) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    if (!hasPermission('INVENTORY_MANAGE')) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b' }}>Access Denied</div>;

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Stock Counts</h1>
                    <p className="admin-subtitle">Physical inventory audits and reconciliation</p>
                </div>
                <button 
                    onClick={() => setShowCreate(true)}
                    className="admin-btn admin-btn-primary"
                >
                    + New Count
                </button>
            </div>

            {/* Breadcrumb */}
            <div style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                <Link href="/admin/inventory" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}>Inventory</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: 'var(--admin-text-on-light)' }}>Stock Counts</span>
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar">
                <div className="admin-tabs-container">
                    {['ALL', 'DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`admin-tab-pill ${statusFilter === status ? 'active' : ''}`}
                        >
                            {status === 'ALL' ? 'All' : statusConfig[status]?.label || status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="admin-table-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    Loading stock counts...
                </div>
            ) : counts.length > 0 ? (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Count #</th>
                                <th>Warehouse</th>
                                <th style={{ textAlign: 'center' }}>Progress</th>
                                <th style={{ textAlign: 'center' }}>Variance</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th>Count Date</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {counts.map((count) => {
                                const status = statusConfig[count.status] || statusConfig.DRAFT;
                                const progress = count.itemCount > 0 ? Math.round((count.countedItems / count.itemCount) * 100) : 0;
                                return (
                                    <tr key={count.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{count.countNumber}</div>
                                            {count.createdByName && (
                                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                    by {count.createdByName}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ 
                                                padding: '4px 12px', 
                                                borderRadius: '6px', 
                                                background: 'rgba(0,0,0,0.05)',
                                                fontSize: '13px'
                                            }}>
                                                {count.warehouseName}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <div style={{ 
                                                    width: '80px', 
                                                    height: '6px', 
                                                    background: 'var(--admin-border)', 
                                                    borderRadius: '3px', 
                                                    overflow: 'hidden' 
                                                }}>
                                                    <div style={{ 
                                                        width: `${progress}%`, 
                                                        height: '100%', 
                                                        background: progress === 100 ? '#166534' : '#b76e00',
                                                        transition: 'width 0.3s'
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                                    {count.countedItems}/{count.itemCount}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ 
                                                fontWeight: 600,
                                                color: count.variance === 0 ? '#166534' : (count.variance > 0 ? '#1e40af' : '#991b1b')
                                            }}>
                                                {count.variance > 0 ? '+' : ''}{count.variance}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 12px',
                                                borderRadius: '99px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                background: status.bgColor,
                                                color: status.color,
                                                border: `1px solid ${status.color}30`
                                            }}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                                            {formatDate(count.countDate)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                {count.status === 'DRAFT' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStart(count)}
                                                            className="admin-btn admin-btn-primary"
                                                            style={{ padding: '6px 12px', fontSize: '11px' }}
                                                        >
                                                            Start
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(count)}
                                                            className="admin-btn admin-btn-outline"
                                                            style={{ padding: '6px 12px', fontSize: '11px', color: '#991b1b' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {count.status === 'IN_PROGRESS' && (
                                                    <>
                                                        <button
                                                            onClick={() => setActiveCount(count)}
                                                            className="admin-btn admin-btn-primary"
                                                            style={{ padding: '6px 12px', fontSize: '11px' }}
                                                        >
                                                            Continue
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(count)}
                                                            className="admin-btn admin-btn-outline"
                                                            style={{ padding: '6px 12px', fontSize: '11px', color: '#991b1b' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {count.status === 'COMPLETED' && (
                                                    <button
                                                        onClick={() => setActiveCount(count)}
                                                        className="admin-btn admin-btn-outline"
                                                        style={{ padding: '6px 12px', fontSize: '11px' }}
                                                    >
                                                        View Results
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="admin-table-container" style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', marginBottom: '8px', color: 'var(--admin-text-on-light)' }}>
                        No stock counts found
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)', marginBottom: '24px' }}>
                        Create a new stock count to start a physical inventory audit.
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="admin-btn admin-btn-primary"
                    >
                        + Create Stock Count
                    </button>
                </div>
            )}

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '40px' }}>
                    <button onClick={() => loadCounts(meta.page - 1)} className="admin-btn admin-btn-outline" disabled={meta.page <= 1}>Previous</button>
                    <span style={{ padding: '10px 16px', fontWeight: 600 }}>Page {meta.page} of {meta.totalPages}</span>
                    <button onClick={() => loadCounts(meta.page + 1)} className="admin-btn admin-btn-outline" disabled={meta.page >= meta.totalPages}>Next</button>
                </div>
            )}

            {/* Create Dialog */}
            {showCreate && (
                <div className="confirm-dialog-overlay" onClick={() => setShowCreate(false)}>
                    <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', textAlign: 'left' }}>
                        <div className="confirm-dialog-icon">📋</div>
                        <h2 className="confirm-dialog-title">New Stock Count</h2>
                        
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const warehouseId = (form.elements.namedItem('warehouse') as HTMLSelectElement).value;
                            const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value;
                            if (await handleCreate(warehouseId, notes)) setShowCreate(false);
                        }}>
                            <div className="admin-form-group" style={{ marginTop: '24px' }}>
                                <label>Warehouse</label>
                                <select name="warehouse" className="form-input" required>
                                    <option value="">Select warehouse...</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name} ({w.totalItems} items)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="admin-form-group" style={{ marginTop: '16px' }}>
                                <label>Notes (Optional)</label>
                                <textarea name="notes" className="form-input" placeholder="Reason for count..." rows={2} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button type="button" onClick={() => setShowCreate(false)} className="admin-btn admin-btn-outline">Cancel</button>
                                <button type="submit" className="admin-btn admin-btn-primary">Create Count</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Count Dialog */}
            {activeCount && (
                <StockCountDialog
                    countId={activeCount.id}
                    isReadOnly={activeCount.status === 'COMPLETED'}
                    onClose={() => setActiveCount(null)}
                    onComplete={() => { setActiveCount(null); loadCounts(meta.page); }}
                />
            )}
        </div>
    );
}

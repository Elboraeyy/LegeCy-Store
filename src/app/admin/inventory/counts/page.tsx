'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { 
    fetchStockCounts, 
    createStockCount, 
    startStockCount, 
    cancelStockCount, 
    fetchStockCountStats,
    StockCountWithDetails,
    StockCountStats
} from '@/lib/actions/stockcount-actions';
import { fetchWarehouses, WarehouseWithStats } from '@/lib/actions/warehouse-actions';
import Link from 'next/link';
import { toast } from 'sonner';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
    DRAFT: { label: 'Draft', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)', icon: '📝' },
    IN_PROGRESS: { label: 'In Progress', color: '#b76e00', bgColor: 'rgba(183, 110, 0, 0.1)', icon: '⏳' },
    COMPLETED: { label: 'Completed', color: '#166534', bgColor: 'rgba(22, 101, 52, 0.1)', icon: '✅' },
    CANCELLED: { label: 'Cancelled', color: '#991b1b', bgColor: 'rgba(153, 27, 27, 0.1)', icon: '❌' },
};

export default function StockCountsPage() {
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();
    const [counts, setCounts] = useState<StockCountWithDetails[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseWithStats[]>([]);
    const [stats, setStats] = useState<StockCountStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

    // Form state for create dialog
    const [createForm, setCreateForm] = useState({ warehouseId: '', notes: '' });
    const [creating, setCreating] = useState(false);

    const loadCounts = useCallback(async (page: number, status: string, warehouse: string) => {
        const res = await fetchStockCounts({ 
            status: status !== 'ALL' ? status : undefined,
            warehouseId: warehouse || undefined,
            page 
        });
        setCounts(res.data);
        setMeta(res.meta);
        setLoading(false);
    }, []);

    const loadData = useCallback(async () => {
        const [warehouseData, statsData] = await Promise.all([
            fetchWarehouses(),
            fetchStockCountStats()
        ]);
        setWarehouses(warehouseData);
        setStats(statsData);
    }, []);

    useEffect(() => {
        if (!permLoading && hasPermission('INVENTORY_MANAGE')) {
            const timer = setTimeout(() => {
                loadCounts(1, statusFilter, warehouseFilter);
                loadData();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [permLoading, hasPermission, loadCounts, loadData, statusFilter, warehouseFilter]);

    const handleCreate = async () => {
        if (!createForm.warehouseId) {
            toast.error('Please select a warehouse');
            return;
        }
        setCreating(true);
        const res = await createStockCount(createForm.warehouseId, createForm.notes);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            toast.success('Stock count created');
            setShowCreate(false);
            setCreateForm({ warehouseId: '', notes: '' });
            loadCounts(1, statusFilter, warehouseFilter);
            loadData();
        }
        setCreating(false);
    };

    const handleStart = async (count: StockCountWithDetails) => {
        const res = await startStockCount(count.id);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Stock count started'); loadCounts(meta.page, statusFilter, warehouseFilter); }
    };

    const handleCancel = async (count: StockCountWithDetails) => {
        if (!confirm('Cancel this stock count? All progress will be lost.')) return;
        const res = await cancelStockCount(count.id);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Stock count cancelled'); loadCounts(meta.page, statusFilter, warehouseFilter); loadData(); }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
    };

    const formatTimeSince = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    // Filter counts by search
    const filteredCounts = counts.filter(c => 
        !search || 
        c.countNumber.toLowerCase().includes(search.toLowerCase()) ||
        c.warehouseName.toLowerCase().includes(search.toLowerCase())
    );

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
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <span style={{ fontSize: '18px' }}>📋</span>
                    New Count
                </button>
            </div>

            {/* Breadcrumb */}
            <div style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                <Link href="/admin/inventory" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}>Inventory</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: 'var(--admin-text-on-light)' }}>Stock Counts</span>
            </div>

            {/* Stats Dashboard */}
            {stats && (
                <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px' }}>
                    <div className="admin-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '32px', opacity: 0.15 }}>📋</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            This Month
                        </div>
                        <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--admin-text-on-light)', lineHeight: 1 }}>
                            {stats.totalCountsThisMonth}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginTop: '8px' }}>
                            {stats.completedThisMonth} completed
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '32px', opacity: 0.15 }}>⏳</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            Active Counts
                        </div>
                        <div style={{ fontSize: '36px', fontWeight: 700, color: stats.activeInProgress > 0 ? '#b76e00' : 'var(--admin-text-on-light)', lineHeight: 1 }}>
                            {stats.activeInProgress}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginTop: '8px' }}>
                            {stats.draftCounts} drafts pending
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '32px', opacity: 0.15 }}>🎯</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            Accuracy Rate
                        </div>
                        <div style={{ fontSize: '36px', fontWeight: 700, color: stats.accuracyRate >= 95 ? '#166534' : stats.accuracyRate >= 80 ? '#b76e00' : '#991b1b', lineHeight: 1 }}>
                            {stats.accuracyRate}%
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginTop: '8px' }}>
                            Items matching system
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '32px', opacity: 0.15 }}>📊</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            Net Variance
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                            <span style={{ fontSize: '20px', fontWeight: 600, color: '#1e40af' }}>
                                +{stats.totalPositiveVariance}
                            </span>
                            <span style={{ fontSize: '20px', fontWeight: 600, color: '#991b1b' }}>
                                -{stats.totalNegativeVariance}
                            </span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginTop: '8px' }}>
                            Total variance units
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="admin-toolbar" style={{ marginBottom: '20px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div className="admin-search-wrapper" style={{ flex: 1, maxWidth: '300px', minWidth: '200px' }}>
                        <span className="admin-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search counts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="admin-search-input"
                        />
                    </div>

                    {/* Warehouse Filter */}
                    <div style={{ minWidth: '200px' }}>
                        <AdminDropdown
                            value={warehouseFilter}
                            onChange={(val) => { setWarehouseFilter(val); }}
                            placeholder="All Warehouses"
                            size="sm"
                            options={[
                                { value: '', label: 'All Warehouses' },
                                ...warehouses.map(w => ({ value: w.id, label: w.name }))
                            ]}
                        />
                    </div>

                    {/* Status Tabs */}
                    <div className="admin-tabs-container" style={{ marginLeft: 'auto' }}>
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
            </div>

            {/* Table */}
            {loading ? (
                <div className="admin-table-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                    Loading stock counts...
                </div>
            ) : filteredCounts.length > 0 ? (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}></th>
                                <th>Count #</th>
                                <th>Warehouse</th>
                                <th style={{ textAlign: 'center' }}>Progress</th>
                                <th style={{ textAlign: 'center' }}>Variance</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th>Created</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCounts.map((count) => {
                                const status = statusConfig[count.status] || statusConfig.DRAFT;
                                const progress = count.itemCount > 0 ? Math.round((count.countedItems / count.itemCount) * 100) : 0;
                                return (
                                    <tr key={count.id}>
                                        <td>
                                            <div style={{ 
                                                width: '40px', 
                                                height: '40px', 
                                                borderRadius: '10px',
                                                background: status.bgColor,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '18px'
                                            }}>
                                                {status.icon}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '14px' }}>{count.countNumber}</div>
                                            {count.createdByName && (
                                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                                                    by {count.createdByName}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ 
                                                padding: '6px 14px', 
                                                borderRadius: '8px', 
                                                background: 'rgba(0,0,0,0.04)',
                                                fontSize: '13px',
                                                fontWeight: 500
                                            }}>
                                                🏭 {count.warehouseName}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                                <div style={{ 
                                                    width: '100px', 
                                                    height: '8px', 
                                                    background: 'var(--admin-border)', 
                                                    borderRadius: '4px', 
                                                    overflow: 'hidden' 
                                                }}>
                                                    <div style={{ 
                                                        width: `${progress}%`, 
                                                        height: '100%', 
                                                        background: progress === 100 ? '#166534' : progress > 0 ? '#b76e00' : 'var(--admin-border)',
                                                        transition: 'width 0.3s',
                                                        borderRadius: '4px'
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-muted)', minWidth: '50px' }}>
                                                    {count.countedItems}/{count.itemCount}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ 
                                                fontWeight: 700,
                                                fontSize: '15px',
                                                color: count.variance === 0 ? '#166534' : (count.variance > 0 ? '#1e40af' : '#991b1b')
                                            }}>
                                                {count.variance > 0 ? '+' : ''}{count.variance}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '6px 14px',
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
                                        <td>
                                            <div style={{ fontSize: '13px', color: 'var(--admin-text-on-light)' }}>
                                                {formatDate(count.countDate)}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                {formatTimeSince(count.createdAt)}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                {count.status === 'DRAFT' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStart(count)}
                                                            className="admin-btn admin-btn-primary"
                                                            style={{ padding: '8px 16px', fontSize: '12px' }}
                                                        >
                                                            ▶ Start
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(count)}
                                                            className="admin-btn admin-btn-outline"
                                                            style={{ padding: '8px 12px', fontSize: '12px', color: '#991b1b' }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                )}
                                                {count.status === 'IN_PROGRESS' && (
                                                    <>
                                                        <Link
                                                            href={`/admin/inventory/counts/${count.id}`}
                                                            className="admin-btn admin-btn-primary"
                                                            style={{ padding: '8px 16px', fontSize: '12px' }}
                                                        >
                                                            ▶ Continue
                                                        </Link>
                                                        <button
                                                            onClick={() => handleCancel(count)}
                                                            className="admin-btn admin-btn-outline"
                                                            style={{ padding: '8px 12px', fontSize: '12px', color: '#991b1b' }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                )}
                                                {count.status === 'COMPLETED' && (
                                                    <Link
                                                        href={`/admin/inventory/counts/${count.id}`}
                                                        className="admin-btn admin-btn-outline"
                                                        style={{ padding: '8px 16px', fontSize: '12px' }}
                                                    >
                                                        📊 Results
                                                    </Link>
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
                <div className="admin-table-container" style={{ padding: '80px 40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', marginBottom: '12px', color: 'var(--admin-text-on-light)' }}>
                        No stock counts found
                    </div>
                    <div style={{ fontSize: '15px', color: 'var(--admin-text-muted)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
                        Stock counts help you verify physical inventory against system records. Create your first count to get started.
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="admin-btn admin-btn-primary"
                        style={{ padding: '14px 28px', fontSize: '15px' }}
                    >
                        📋 Create Stock Count
                    </button>
                </div>
            )}

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '40px' }}>
                    <button 
                        onClick={() => loadCounts(meta.page - 1, statusFilter, warehouseFilter)} 
                        className="admin-btn admin-btn-outline" 
                        disabled={meta.page <= 1}
                        style={{ padding: '10px 20px' }}
                    >
                        ← Previous
                    </button>
                    <span style={{ padding: '10px 20px', fontWeight: 600, background: 'var(--admin-surface-light)', borderRadius: '8px' }}>
                        Page {meta.page} of {meta.totalPages}
                    </span>
                    <button 
                        onClick={() => loadCounts(meta.page + 1, statusFilter, warehouseFilter)} 
                        className="admin-btn admin-btn-outline" 
                        disabled={meta.page >= meta.totalPages}
                        style={{ padding: '10px 20px' }}
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Create Dialog */}
            {showCreate && (
                <div className="confirm-dialog-overlay" onClick={() => setShowCreate(false)}>
                    <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div className="confirm-dialog-icon" style={{ margin: 0, fontSize: '32px' }}>📋</div>
                            <div>
                                <h2 className="confirm-dialog-title" style={{ margin: 0 }}>New Stock Count</h2>
                                <p style={{ margin: '4px 0 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>
                                    Create a physical inventory audit
                                </p>
                            </div>
                        </div>
                        
                        <div className="admin-form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ marginBottom: '8px', display: 'block', fontWeight: 500 }}>Warehouse</label>
                            <AdminDropdown
                                value={createForm.warehouseId}
                                onChange={(val) => setCreateForm({ ...createForm, warehouseId: val })}
                                placeholder="Select warehouse..."
                                options={[
                                    { value: '', label: 'Select warehouse...', disabled: true },
                                    ...warehouses.map(w => ({ 
                                        value: w.id, 
                                        label: `${w.name} (${w.totalItems} SKUs)` 
                                    }))
                                ]}
                            />
                        </div>

                        <div className="admin-form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ marginBottom: '8px', display: 'block', fontWeight: 500 }}>Notes (Optional)</label>
                            <textarea 
                                value={createForm.notes}
                                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                                className="form-input" 
                                placeholder="Reason for count, special instructions..." 
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                type="button" 
                                onClick={() => setShowCreate(false)} 
                                className="admin-btn admin-btn-outline"
                                style={{ padding: '12px 24px' }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={handleCreate}
                                className="admin-btn admin-btn-primary"
                                disabled={creating || !createForm.warehouseId}
                                style={{ padding: '12px 24px' }}
                            >
                                {creating ? 'Creating...' : '📋 Create Count'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

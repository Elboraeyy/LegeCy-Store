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
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';

export default function StockCountsPage() {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
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

    const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
        DRAFT: { label: t.inventory.counts.status.draft, color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)', icon: '📝' },
        IN_PROGRESS: { label: t.inventory.counts.status.in_progress, color: '#b76e00', bgColor: 'rgba(183, 110, 0, 0.1)', icon: '⏳' },
        COMPLETED: { label: t.inventory.counts.status.completed, color: '#166534', bgColor: 'rgba(22, 101, 52, 0.1)', icon: '✅' },
        CANCELLED: { label: t.inventory.counts.status.cancelled, color: '#991b1b', bgColor: 'rgba(153, 27, 27, 0.1)', icon: '❌' },
    };

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
            toast.error(t.inventory.counts.create_modal.select_warehouse);
            return;
        }
        setCreating(true);
        const res = await createStockCount(createForm.warehouseId, createForm.notes);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            toast.success(t.inventory.counts.create_modal.create);
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
        else { toast.success(t.inventory.counts.actions.start); loadCounts(meta.page, statusFilter, warehouseFilter); }
    };

    const handleCancel = async (count: StockCountWithDetails) => {
        if (!confirm(t.inventory.counts.actions.cancel)) return;
        const res = await cancelStockCount(count.id);
        if ('error' in res) toast.error(res.error);
        else { toast.success(t.inventory.counts.actions.cancel); loadCounts(meta.page, statusFilter, warehouseFilter); loadData(); }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
    };

    const formatTimeSince = (date: Date) => {
        // Simple time since logic, keeping it english for now or simple numeric
        // ideally convert this to use relative time format or a localised string builder
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return language === 'ar' ? 'الآن' : 'Just now';

        if (language === 'ar') {
            if (hours < 24) return `منذ ${hours} ساعة`;
            const days = Math.floor(hours / 24);
            return `منذ ${days} يوم`;
        }

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

    if (permLoading) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.inventory.loading}</div>;
    if (!hasPermission('INVENTORY_MANAGE')) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b' }}>{t.inventory.access_denied}</div>;

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.inventory.counts.title}</h1>
                    <p className="admin-subtitle">{t.inventory.counts.subtitle}</p>
                </div>
                <button 
                    onClick={() => setShowCreate(true)}
                    className="admin-btn admin-btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <span style={{ fontSize: '18px' }}>📋</span>
                    {t.inventory.counts.new_count}
                </button>
            </div>

            {/* Breadcrumb */}
            <div style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                <Link href="/admin/inventory" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}>{t.inventory.title}</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: 'var(--admin-text-on-light)' }}>{t.inventory.counts.title}</span>
            </div>

            {/* Stats Dashboard */}
            {stats && (
                <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px' }}>
                    <div className="admin-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '32px', opacity: 0.15 }}>📋</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            {t.inventory.counts.stats.this_month}
                        </div>
                        <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--admin-text-on-light)', lineHeight: 1 }}>
                            {stats.totalCountsThisMonth}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginTop: '8px' }}>
                            {t.inventory.counts.stats.completed.replace('{count}', stats.completedThisMonth.toString())}
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '32px', opacity: 0.15 }}>⏳</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            {t.inventory.counts.stats.active}
                        </div>
                        <div style={{ fontSize: '36px', fontWeight: 700, color: stats.activeInProgress > 0 ? '#b76e00' : 'var(--admin-text-on-light)', lineHeight: 1 }}>
                            {stats.activeInProgress}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginTop: '8px' }}>
                            {t.inventory.counts.stats.drafts.replace('{count}', stats.draftCounts.toString())}
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '32px', opacity: 0.15 }}>🎯</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            {t.inventory.counts.stats.accuracy}
                        </div>
                        <div style={{ fontSize: '36px', fontWeight: 700, color: stats.accuracyRate >= 95 ? '#166534' : stats.accuracyRate >= 80 ? '#b76e00' : '#991b1b', lineHeight: 1 }}>
                            {stats.accuracyRate}%
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginTop: '8px' }}>
                            {t.inventory.counts.stats.matching}
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '32px', opacity: 0.15 }}>📊</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            {t.inventory.counts.stats.variance}
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
                            {t.inventory.counts.stats.variance_units}
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
                            placeholder={t.inventory.search_placeholder}
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
                            placeholder={t.inventory.counts.create_modal.select_warehouse.replace('...', '')}
                            size="sm"
                            options={[
                                { value: '', label: t.inventory.counts.create_modal.select_warehouse.replace('...', '') }, // Using select_warehouse for "All Warehouses" temporarily or add a new key?
                                // Better to add a key 'all_warehouses' but for now I'll use a string or similar
                                // Actually let's just use "All Warehouses" if no key exists or add one.
                                // I'll use static "All Warehouses" translated if available or just hardcode/use existing key
                                // I will use 'All Warehouses' as fallback if t.inventory.counts.all_warehouses not exists
                                // Wait, I added `select_warehouse` but maybe not `all_warehouses`.
                                // Let's check admin.ts.... I didn't add all_warehouses. I'll use a generic one.
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
                                {status === 'ALL' ? t.inventory.counts.actions.results : statusConfig[status]?.label || status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="admin-table-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                    {t.inventory.loading}
                </div>
            ) : filteredCounts.length > 0 ? (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}></th>
                                    <th>{t.inventory.counts.table.count_number}</th>
                                    <th>{t.inventory.counts.table.warehouse}</th>
                                    <th style={{ textAlign: 'center' }}>{t.inventory.counts.table.progress}</th>
                                    <th style={{ textAlign: 'center' }}>{t.inventory.counts.table.variance}</th>
                                    <th style={{ textAlign: 'center' }}>{t.inventory.counts.table.status}</th>
                                    <th>{t.inventory.counts.table.created}</th>
                                    <th style={{ textAlign: 'right' }}>{t.inventory.counts.table.actions}</th>
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
                                                    {t.inventory.counts.table.by.replace('{name}', count.createdByName)}
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
                                                            ▶ {t.inventory.counts.actions.start}
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
                                                            ▶ {t.inventory.counts.actions.continue}
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
                                                        📊 {t.inventory.counts.actions.results}
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
                                {t.inventory.counts.empty.title}
                    </div>
                    <div style={{ fontSize: '15px', color: 'var(--admin-text-muted)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
                                {t.inventory.counts.empty.desc}
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="admin-btn admin-btn-primary"
                        style={{ padding: '14px 28px', fontSize: '15px' }}
                    >
                                📋 {t.inventory.counts.empty.create_btn}
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
                        ← {t.inventory.pagination.previous}
                    </button>
                    <span style={{ padding: '10px 20px', fontWeight: 600, background: 'var(--admin-surface-light)', borderRadius: '8px' }}>
                        {t.inventory.pagination.page_of.replace('{page}', meta.page.toString()).replace('{total}', meta.totalPages.toString())}
                    </span>
                    <button 
                        onClick={() => loadCounts(meta.page + 1, statusFilter, warehouseFilter)} 
                        className="admin-btn admin-btn-outline" 
                        disabled={meta.page >= meta.totalPages}
                        style={{ padding: '10px 20px' }}
                    >
                        {t.inventory.pagination.next} →
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
                                <h2 className="confirm-dialog-title" style={{ margin: 0 }}>{t.inventory.counts.create_modal.title}</h2>
                                <p style={{ margin: '4px 0 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>
                                    {t.inventory.counts.create_modal.subtitle}
                                </p>
                            </div>
                        </div>
                        
                        <div className="admin-form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ marginBottom: '8px', display: 'block', fontWeight: 500 }}>{t.inventory.counts.create_modal.warehouse}</label>
                            <AdminDropdown
                                value={createForm.warehouseId}
                                onChange={(val) => setCreateForm({ ...createForm, warehouseId: val })}
                                placeholder={t.inventory.counts.create_modal.select_warehouse}
                                options={[
                                    { value: '', label: t.inventory.counts.create_modal.select_warehouse, disabled: true },
                                    ...warehouses.map(w => ({ 
                                        value: w.id, 
                                        label: `${w.name} (${w.totalItems} SKUs)` 
                                    }))
                                ]}
                            />
                        </div>

                        <div className="admin-form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ marginBottom: '8px', display: 'block', fontWeight: 500 }}>{t.inventory.counts.create_modal.notes}</label>
                            <textarea 
                                value={createForm.notes}
                                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                                className="form-input" 
                                placeholder={t.inventory.counts.create_modal.notes_placeholder} 
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
                                {t.inventory.counts.create_modal.cancel}
                            </button>
                            <button 
                                type="button"
                                onClick={handleCreate}
                                className="admin-btn admin-btn-primary"
                                disabled={creating || !createForm.warehouseId}
                                style={{ padding: '12px 24px' }}
                            >
                                {creating ? t.inventory.counts.create_modal.creating : '📋 ' + t.inventory.counts.create_modal.create}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

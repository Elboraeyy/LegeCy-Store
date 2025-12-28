'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { fetchAlerts, acknowledgeAlert, resolveAlert, bulkAcknowledgeAlerts, bulkResolveAlerts, generateStockAlerts, AlertWithDetails } from '@/lib/actions/alert-actions';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';

const alertTypeConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
    OUT_OF_STOCK: { label: 'Out of Stock', color: '#991b1b', bgColor: 'rgba(153, 27, 27, 0.1)', icon: '🚨' },
    LOW_STOCK: { label: 'Low Stock', color: '#b76e00', bgColor: 'rgba(183, 110, 0, 0.1)', icon: '⚠️' },
    OVERSTOCK: { label: 'Overstock', color: '#1e40af', bgColor: 'rgba(30, 64, 175, 0.1)', icon: '📦' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
    NEW: { label: 'New', color: '#991b1b' },
    ACKNOWLEDGED: { label: 'Acknowledged', color: '#b76e00' },
    RESOLVED: { label: 'Resolved', color: '#166534' },
};

export default function AlertsPage() {
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();
    const [alerts, setAlerts] = useState<AlertWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('NEW');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

    const loadAlerts = useCallback(async (page: number, status: string, type: string) => {
        const res = await fetchAlerts({ 
            status: status !== 'ALL' ? status : undefined,
            alertType: type !== 'ALL' ? type : undefined,
            page 
        });
        setAlerts(res.data);
        setMeta(res.meta);
        setSelectedIds([]);
        setLoading(false);
    }, []);

    // Data fetching in effect is the standard React pattern
    useEffect(() => {
        if (!permLoading && hasPermission('INVENTORY_MANAGE')) {
            const timer = setTimeout(() => {
                loadAlerts(1, statusFilter, typeFilter);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [permLoading, hasPermission, loadAlerts, statusFilter, typeFilter]);

    const handleAcknowledge = async (alert: AlertWithDetails) => {
        const res = await acknowledgeAlert(alert.id);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Alert acknowledged'); loadAlerts(meta.page, statusFilter, typeFilter); }
    };

    const handleResolve = async (alert: AlertWithDetails) => {
        const note = prompt('Resolution note (optional):');
        const res = await resolveAlert(alert.id, note || undefined);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Alert resolved'); loadAlerts(meta.page, statusFilter, typeFilter); }
    };

    const handleBulkAcknowledge = async () => {
        if (selectedIds.length === 0) return;
        const res = await bulkAcknowledgeAlerts(selectedIds);
        if ('error' in res) toast.error(res.error);
        else { toast.success(`${res.count} alerts acknowledged`); loadAlerts(meta.page, statusFilter, typeFilter); }
    };

    const handleBulkResolve = async () => {
        if (selectedIds.length === 0) return;
        const res = await bulkResolveAlerts(selectedIds);
        if ('error' in res) toast.error(res.error);
        else { toast.success(`${res.count} alerts resolved`); loadAlerts(meta.page, statusFilter, typeFilter); }
    };

    const handleGenerateAlerts = async () => {
        const res = await generateStockAlerts();
        if ('error' in res) toast.error(res.error);
        else { toast.success(`${res.created} new alerts generated`); loadAlerts(1, statusFilter, typeFilter); }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === alerts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(alerts.map(a => a.id));
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-GB', { 
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
        });
    };

    if (permLoading) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    if (!hasPermission('INVENTORY_MANAGE')) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b' }}>Access Denied</div>;

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Stock Alerts</h1>
                    <p className="admin-subtitle">Monitor low stock and out of stock items</p>
                </div>
                <button 
                    onClick={handleGenerateAlerts}
                    className="admin-btn admin-btn-primary"
                >
                    🔄 Scan for Alerts
                </button>
            </div>

            {/* Breadcrumb */}
            <div style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                <Link href="/admin/inventory" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}>Inventory</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: 'var(--admin-text-on-light)' }}>Alerts</span>
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div className="admin-tabs-container">
                    {['NEW', 'ACKNOWLEDGED', 'RESOLVED', 'ALL'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`admin-tab-pill ${statusFilter === status ? 'active' : ''}`}
                        >
                            {status === 'ALL' ? 'All' : statusConfig[status]?.label || status}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <AdminDropdown
                        value={typeFilter}
                        onChange={setTypeFilter}
                        variant="pill"
                        size="sm"
                        options={[
                            { value: 'ALL', label: 'All Types' },
                            { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
                            { value: 'LOW_STOCK', label: 'Low Stock' },
                            { value: 'OVERSTOCK', label: 'Overstock' },
                        ]}
                    />

                    {selectedIds.length > 0 && (
                        <>
                            <button onClick={handleBulkAcknowledge} className="admin-btn admin-btn-outline" style={{ padding: '8px 16px', fontSize: '12px' }}>
                                Acknowledge ({selectedIds.length})
                            </button>
                            <button onClick={handleBulkResolve} className="admin-btn admin-btn-outline" style={{ padding: '8px 16px', fontSize: '12px' }}>
                                Resolve ({selectedIds.length})
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="admin-table-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    Loading alerts...
                </div>
            ) : alerts.length > 0 ? (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.length === alerts.length && alerts.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th style={{ width: '50px' }}>Type</th>
                                <th>Product</th>
                                <th>Warehouse</th>
                                <th style={{ textAlign: 'center' }}>Stock</th>
                                <th style={{ textAlign: 'center' }}>Threshold</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th>Created</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((alert) => {
                                const typeInfo = alertTypeConfig[alert.alertType] || alertTypeConfig.LOW_STOCK;
                                const statusInfo = statusConfig[alert.status] || statusConfig.NEW;
                                return (
                                    <tr key={alert.id}>
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(alert.id)}
                                                onChange={() => toggleSelect(alert.id)}
                                            />
                                        </td>
                                        <td>
                                            <span title={typeInfo.label} style={{ fontSize: '20px' }}>{typeInfo.icon}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', position: 'relative', background: '#f8f8f8' }}>
                                                    {alert.productImage ? (
                                                        <Image src={alert.productImage} alt="" fill style={{ objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#999' }}>
                                                            NO IMG
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{alert.productName}</div>
                                                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--admin-text-muted)' }}>{alert.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{alert.warehouseName}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ 
                                                fontWeight: 700, 
                                                fontSize: '16px',
                                                color: alert.currentStock === 0 ? '#991b1b' : '#b76e00'
                                            }}>
                                                {alert.currentStock}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                            {alert.threshold}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 10px',
                                                borderRadius: '99px',
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                background: `${statusInfo.color}15`,
                                                color: statusInfo.color
                                            }}>
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                            {formatDate(alert.createdAt)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                {alert.status === 'NEW' && (
                                                    <button
                                                        onClick={() => handleAcknowledge(alert)}
                                                        className="admin-btn admin-btn-outline"
                                                        style={{ padding: '6px 12px', fontSize: '11px' }}
                                                    >
                                                        Acknowledge
                                                    </button>
                                                )}
                                                {alert.status !== 'RESOLVED' && (
                                                    <button
                                                        onClick={() => handleResolve(alert)}
                                                        className="admin-btn admin-btn-outline"
                                                        style={{ padding: '6px 12px', fontSize: '11px' }}
                                                    >
                                                        Resolve
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/admin/inventory?warehouse=${alert.warehouseId}`}
                                                    className="admin-btn admin-btn-outline"
                                                    style={{ padding: '6px 12px', fontSize: '11px' }}
                                                >
                                                    View Stock
                                                </Link>
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
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', marginBottom: '8px', color: 'var(--admin-text-on-light)' }}>
                        No alerts found
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)', marginBottom: '24px' }}>
                        {statusFilter !== 'ALL' 
                            ? 'Try changing the filter to see other alerts.' 
                            : 'All stock levels are healthy! Click "Scan for Alerts" to check again.'}
                    </div>
                </div>
            )}

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '40px' }}>
                    <button
                        onClick={() => loadAlerts(meta.page - 1, statusFilter, typeFilter)}
                        className="admin-btn admin-btn-outline"
                        disabled={meta.page <= 1}
                        style={{ opacity: meta.page <= 1 ? 0.5 : 1 }}
                    >
                        Previous
                    </button>
                    <span style={{ padding: '10px 16px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        Page {meta.page} of {meta.totalPages}
                    </span>
                    <button
                        onClick={() => loadAlerts(meta.page + 1, statusFilter, typeFilter)}
                        className="admin-btn admin-btn-outline"
                        disabled={meta.page >= meta.totalPages}
                        style={{ opacity: meta.page >= meta.totalPages ? 0.5 : 1 }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

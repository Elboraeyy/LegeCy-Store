'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { fetchTransfers, approveTransfer, shipTransfer, receiveTransfer, cancelTransfer, TransferWithDetails } from '@/lib/actions/transfer-actions';
import { fetchWarehouses, WarehouseWithStats } from '@/lib/actions/warehouse-actions';
import CreateTransferDialog from '@/components/admin/inventory/CreateTransferDialog';
import Link from 'next/link';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    PENDING: { label: 'Pending', color: '#b76e00', bgColor: 'rgba(183, 110, 0, 0.1)' },
    APPROVED: { label: 'Approved', color: '#1e40af', bgColor: 'rgba(30, 64, 175, 0.1)' },
    IN_TRANSIT: { label: 'In Transit', color: '#7c3aed', bgColor: 'rgba(124, 58, 237, 0.1)' },
    RECEIVED: { label: 'Received', color: '#166534', bgColor: 'rgba(22, 101, 52, 0.1)' },
    CANCELLED: { label: 'Cancelled', color: '#991b1b', bgColor: 'rgba(153, 27, 27, 0.1)' },
};

export default function TransfersPage() {
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();
    const [transfers, setTransfers] = useState<TransferWithDetails[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showCreate, setShowCreate] = useState(false);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

    const loadTransfers = useCallback(async (page = 1) => {
        setLoading(true);
        const res = await fetchTransfers({ 
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            page 
        });
        setTransfers(res.data);
        setMeta(res.meta);
        setLoading(false);
    }, [statusFilter]);

    const loadWarehouses = useCallback(async () => {
        const data = await fetchWarehouses();
        setWarehouses(data);
    }, []);

    useEffect(() => {
        if (!permLoading && hasPermission('INVENTORY_MANAGE')) {
            loadTransfers();
            loadWarehouses();
        }
    }, [permLoading, hasPermission, loadTransfers, loadWarehouses]);

    const handleApprove = async (transfer: TransferWithDetails) => {
        if (!confirm('Approve this transfer? Stock will be reserved from source warehouse.')) return;
        const res = await approveTransfer(transfer.id);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Transfer approved'); loadTransfers(meta.page); }
    };

    const handleShip = async (transfer: TransferWithDetails) => {
        if (!confirm('Mark as shipped? Stock will be deducted from source warehouse.')) return;
        const res = await shipTransfer(transfer.id);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Transfer shipped'); loadTransfers(meta.page); }
    };

    const handleReceive = async (transfer: TransferWithDetails) => {
        if (!confirm('Mark as received? Stock will be added to destination warehouse.')) return;
        const res = await receiveTransfer(transfer.id);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Transfer received'); loadTransfers(meta.page); }
    };

    const handleCancel = async (transfer: TransferWithDetails) => {
        const reason = prompt('Enter cancellation reason:');
        if (!reason) return;
        const res = await cancelTransfer(transfer.id, reason);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Transfer cancelled'); loadTransfers(meta.page); }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '-';
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
                    <h1 className="admin-title">Stock Transfers</h1>
                    <p className="admin-subtitle">Move inventory between warehouses</p>
                </div>
                <button 
                    onClick={() => setShowCreate(true)}
                    className="admin-btn admin-btn-primary"
                >
                    + New Transfer
                </button>
            </div>

            {/* Breadcrumb */}
            <div style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                <Link href="/admin/inventory" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}>Inventory</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: 'var(--admin-text-on-light)' }}>Transfers</span>
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar">
                <div className="admin-tabs-container">
                    {['ALL', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'].map(status => (
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
                    Loading transfers...
                </div>
            ) : transfers.length > 0 ? (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Transfer #</th>
                                <th>Route</th>
                                <th style={{ textAlign: 'center' }}>Items</th>
                                <th style={{ textAlign: 'center' }}>Qty</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th>Created</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.map((transfer) => {
                                const status = statusConfig[transfer.status] || statusConfig.PENDING;
                                return (
                                    <tr key={transfer.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{transfer.transferNumber}</div>
                                            {transfer.createdByName && (
                                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                    by {transfer.createdByName}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ 
                                                    padding: '4px 8px', 
                                                    borderRadius: '6px', 
                                                    background: 'rgba(0,0,0,0.05)',
                                                    fontSize: '12px'
                                                }}>
                                                    {transfer.fromWarehouseName}
                                                </span>
                                                <span style={{ color: 'var(--admin-text-muted)' }}>→</span>
                                                <span style={{ 
                                                    padding: '4px 8px', 
                                                    borderRadius: '6px', 
                                                    background: 'rgba(0,0,0,0.05)',
                                                    fontSize: '12px'
                                                }}>
                                                    {transfer.toWarehouseName}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{transfer.itemCount}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{transfer.totalQuantity}</td>
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
                                            {formatDate(transfer.createdAt)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                {transfer.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(transfer)}
                                                            className="admin-btn admin-btn-outline"
                                                            style={{ padding: '6px 12px', fontSize: '11px' }}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(transfer)}
                                                            className="admin-btn admin-btn-outline"
                                                            style={{ padding: '6px 12px', fontSize: '11px', color: '#991b1b' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {transfer.status === 'APPROVED' && (
                                                    <button
                                                        onClick={() => handleShip(transfer)}
                                                        className="admin-btn admin-btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '11px' }}
                                                    >
                                                        Ship
                                                    </button>
                                                )}
                                                {transfer.status === 'IN_TRANSIT' && (
                                                    <button
                                                        onClick={() => handleReceive(transfer)}
                                                        className="admin-btn admin-btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '11px' }}
                                                    >
                                                        Receive
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
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', marginBottom: '8px', color: 'var(--admin-text-on-light)' }}>
                        No transfers found
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)', marginBottom: '24px' }}>
                        {statusFilter !== 'ALL' ? 'Try changing the filter or ' : ''}Create your first transfer to move stock between warehouses.
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="admin-btn admin-btn-primary"
                    >
                        + Create Transfer
                    </button>
                </div>
            )}

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '40px' }}>
                    <button
                        onClick={() => loadTransfers(meta.page - 1)}
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
                        onClick={() => loadTransfers(meta.page + 1)}
                        className="admin-btn admin-btn-outline"
                        disabled={meta.page >= meta.totalPages}
                        style={{ opacity: meta.page >= meta.totalPages ? 0.5 : 1 }}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Create Dialog */}
            {showCreate && (
                <CreateTransferDialog
                    warehouses={warehouses}
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => { setShowCreate(false); loadTransfers(); }}
                />
            )}
        </div>
    );
}

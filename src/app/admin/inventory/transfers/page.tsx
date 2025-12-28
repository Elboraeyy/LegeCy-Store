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
        const res = await fetchTransfers({ 
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            page 
        });
        setTransfers(res.data);
        setMeta(res.meta);
        setLoading(false);
    }, [statusFilter]);

    useEffect(() => {
        if (!permLoading && hasPermission('INVENTORY_MANAGE')) {
            const timer = setTimeout(() => {
                void loadTransfers();
                fetchWarehouses().then(setWarehouses);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [permLoading, hasPermission, loadTransfers]);

    const handleApprove = async (transfer: TransferWithDetails) => {
        if (!confirm('Approve this transfer? Stock will be reserved from source warehouse.')) return;
        const res = await approveTransfer(transfer.id);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Transfer approved'); setLoading(true); loadTransfers(meta.page); }
    };

    const handleShip = async (transfer: TransferWithDetails) => {
        if (!confirm('Mark as shipped? Stock will be deducted from source warehouse.')) return;
        const res = await shipTransfer(transfer.id);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Transfer shipped'); setLoading(true); loadTransfers(meta.page); }
    };

    const handleReceive = async (transfer: TransferWithDetails) => {
        if (!confirm('Mark as received? Stock will be added to destination warehouse.')) return;
        const res = await receiveTransfer(transfer.id);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Transfer received'); setLoading(true); loadTransfers(meta.page); }
    };

    const handleCancel = async (transfer: TransferWithDetails) => {
        const reason = prompt('Enter cancellation reason:');
        if (!reason) return;
        const res = await cancelTransfer(transfer.id, reason);
        if ('error' in res) toast.error(res.error);
        else { toast.success('Transfer cancelled'); setLoading(true); loadTransfers(meta.page); }
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
                    + Create Transfer
                </button>
            </div>

            {/* Breadcrumb */}
            <div style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                <Link href="/admin/inventory" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}>Inventory</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: 'var(--admin-text-on-light)' }}>Transfers</span>
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar" style={{ marginBottom: '24px' }}>
                <div className="admin-tabs-container">
                    {['ALL', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'].map(status => (
                        <button
                            key={status}
                            onClick={() => { setLoading(true); setStatusFilter(status); }}
                            className={`admin-tab-pill ${statusFilter === status ? 'active' : ''}`}
                        >
                            {status === 'ALL' ? 'All' : statusConfig[status]?.label || status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="admin-table-container">
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                        Loading transfers...
                    </div>
                ) : transfers.length > 0 ? (
                    <>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Source</th>
                                    <th>Destination</th>
                                    <th style={{ textAlign: 'center' }}>Items</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transfers.map(transfer => {
                                    const statusInfo = statusConfig[transfer.status] || statusConfig.PENDING;
                                    return (
                                        <tr key={transfer.id}>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                {transfer.transferNumber}
                                            </td>
                                            <td>{transfer.fromWarehouseName}</td>
                                            <td>{transfer.toWarehouseName}</td>
                                            <td style={{ textAlign: 'center' }}>{transfer.itemCount}</td>
                                            <td>
                                                <span style={{ 
                                                    padding: '4px 10px', 
                                                    borderRadius: '99px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    background: statusInfo.bgColor,
                                                    color: statusInfo.color
                                                }}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                                {new Date(transfer.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {transfer.status === 'PENDING' && (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button 
                                                            onClick={() => handleApprove(transfer)}
                                                            className="admin-btn admin-btn-primary"
                                                            style={{ padding: '4px 10px', fontSize: '11px' }}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleCancel(transfer)}
                                                            className="admin-btn admin-btn-outline"
                                                            style={{ padding: '4px 10px', fontSize: '11px', color: '#991b1b' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                                {transfer.status === 'APPROVED' && (
                                                    <button 
                                                        onClick={() => handleShip(transfer)}
                                                        className="admin-btn admin-btn-primary"
                                                        style={{ padding: '4px 10px', fontSize: '11px' }}
                                                    >
                                                        Mark Shipped
                                                    </button>
                                                )}
                                                {transfer.status === 'IN_TRANSIT' && (
                                                    <button 
                                                        onClick={() => handleReceive(transfer)}
                                                        className="admin-btn admin-btn-primary"
                                                        style={{ padding: '4px 10px', fontSize: '11px' }}
                                                    >
                                                        Receive
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        {/* Pagination */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '12px' }}>
                            <button
                                onClick={() => { setLoading(true); loadTransfers(meta.page - 1); }}
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
                                onClick={() => { setLoading(true); loadTransfers(meta.page + 1); }}
                                className="admin-btn admin-btn-outline"
                                disabled={meta.page >= meta.totalPages}
                                style={{ opacity: meta.page >= meta.totalPages ? 0.5 : 1 }}
                            >
                                Next
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚚</div>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', marginBottom: '8px', color: 'var(--admin-text-on-light)' }}>
                            No transfers found
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                            {statusFilter !== 'ALL' ? 'No transfers matching the selected status.' : 'Create your first stock transfer to move inventory.'}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Dialog */}
            {showCreate && (
                <CreateTransferDialog
                    warehouses={warehouses}
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => { setShowCreate(false); setLoading(true); loadTransfers(); }}
                />
            )}
        </div>
    );
}

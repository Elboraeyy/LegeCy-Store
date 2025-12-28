'use client';

import { useState, useEffect } from 'react';
import { transferStock, fetchAllWarehouses, InventoryItemPro } from '@/lib/actions/inventory-pro';
import { toast } from 'sonner';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';

interface StockTransferDialogProps {
    item: InventoryItemPro;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StockTransferDialog({ item, onClose, onSuccess }: StockTransferDialogProps) {
    const [quantity, setQuantity] = useState(1);
    const [targetWarehouseId, setTargetWarehouseId] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        fetchAllWarehouses().then((wh) => {
            // Exclude current warehouse
            setWarehouses(wh.filter(w => w.id !== item.warehouseId));
        });
    }, [item.warehouseId]);

    const handleSubmit = async () => {
        if (quantity <= 0) {
            toast.error('Quantity must be greater than zero');
            return;
        }
        if (quantity > item.available) {
            toast.error('Cannot transfer more than available stock');
            return;
        }
        if (!targetWarehouseId) {
            toast.error('Please select a target warehouse');
            return;
        }
        if (!reason.trim()) {
            toast.error('Please provide a reason');
            return;
        }

        setLoading(true);
        try {
            const res = await transferStock({
                variantId: item.variantId,
                fromWarehouseId: item.warehouseId,
                toWarehouseId: targetWarehouseId,
                quantity,
                reason
            });

            if ('error' in res) {
                toast.error(res.error);
            } else {
                toast.success('Stock transferred successfully');
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to transfer stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="confirm-dialog-overlay" onClick={onClose}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', textAlign: 'left' }}>
                <div className="confirm-dialog-icon">🔄</div>
                <h2 className="confirm-dialog-title">Transfer Stock</h2>
                <p className="confirm-dialog-message" style={{ textAlign: 'left', marginBottom: '24px' }}>
                    <strong>{item.productName}</strong><br />
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.sku}</span><br />
                    From: <strong>{item.warehouseName}</strong> • Available: <strong>{item.available}</strong> units
                </p>

                {/* Target Warehouse */}
                <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                    <label>Transfer To</label>
                    <AdminDropdown
                        value={targetWarehouseId}
                        onChange={setTargetWarehouseId}
                        placeholder="Select destination warehouse..."
                        options={[
                            { value: '', label: 'Select destination warehouse...' },
                            ...warehouses.map(w => ({ value: w.id, label: w.name }))
                        ]}
                    />
                </div>

                {/* Quantity */}
                <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                    <label>Quantity to Transfer</label>
                    <input
                        type="number"
                        className="form-input"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        min={1}
                        max={item.available}
                    />
                </div>

                {/* Reason */}
                <div className="admin-form-group" style={{ marginBottom: '24px' }}>
                    <label>Reason for Transfer</label>
                    <textarea
                        className="form-input"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Rebalancing inventory, fulfilling regional demand..."
                        rows={3}
                    />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} className="admin-btn admin-btn-outline">
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSubmit} 
                        className="admin-btn admin-btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Transferring...' : 'Confirm Transfer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

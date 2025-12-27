'use client';

import { useState } from 'react';
import { adjustStockPro, InventoryItemPro } from '@/lib/actions/inventory-pro';
import { toast } from 'sonner';

interface StockAdjustmentDialogProps {
    item: InventoryItemPro;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StockAdjustmentDialog({ item, onClose, onSuccess }: StockAdjustmentDialogProps) {
    const [quantity, setQuantity] = useState(0);
    const [mode, setMode] = useState<'add' | 'remove' | 'set'>('add');
    const [reason, setReason] = useState('');
    const [newMinStock, setNewMinStock] = useState(item.minStock);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (mode !== 'set' && quantity === 0) {
            toast.error('Quantity cannot be zero');
            return;
        }
        if (!reason.trim()) {
            toast.error('Please provide a reason');
            return;
        }

        setLoading(true);
        try {
            let delta = quantity;
            if (mode === 'remove') delta = -quantity;
            if (mode === 'set') delta = quantity - item.available; // Calculate difference

            const res = await adjustStockPro({
                variantId: item.variantId,
                warehouseId: item.warehouseId,
                quantity: delta,
                reason,
                minStock: newMinStock !== item.minStock ? newMinStock : undefined
            });

            if ('error' in res) {
                toast.error(res.error);
            } else {
                toast.success('Stock updated successfully');
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="confirm-dialog-overlay" onClick={onClose}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', textAlign: 'left' }}>
                <div className="confirm-dialog-icon">📦</div>
                <h2 className="confirm-dialog-title">Adjust Stock</h2>
                <p className="confirm-dialog-message" style={{ textAlign: 'left', marginBottom: '24px' }}>
                    <strong>{item.productName}</strong><br />
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.sku}</span> • Current: <strong>{item.available}</strong> units
                </p>

                {/* Mode Selection */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {(['add', 'remove', 'set'] as const).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            className={`admin-btn ${mode === m ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                            style={{ flex: 1, padding: '10px', fontSize: '12px', textTransform: 'capitalize' }}
                        >
                            {m === 'add' ? '+ Add' : m === 'remove' ? '- Remove' : '= Set To'}
                        </button>
                    ))}
                </div>

                {/* Quantity */}
                <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                    <label>{mode === 'set' ? 'New Quantity' : 'Quantity'}</label>
                    <input
                        type="number"
                        className="form-input"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        min={0}
                        placeholder={mode === 'set' ? 'Enter new stock level' : 'Enter quantity'}
                    />
                </div>

                {/* Min Stock */}
                <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                    <label>Minimum Stock Threshold</label>
                    <input
                        type="number"
                        className="form-input"
                        value={newMinStock}
                        onChange={(e) => setNewMinStock(parseInt(e.target.value) || 0)}
                        min={0}
                    />
                </div>

                {/* Reason */}
                <div className="admin-form-group" style={{ marginBottom: '24px' }}>
                    <label>Reason for Adjustment</label>
                    <textarea
                        className="form-input"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Inventory audit, damaged goods, supplier delivery..."
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
                        {loading ? 'Saving...' : 'Confirm Adjustment'}
                    </button>
                </div>
            </div>
        </div>
    );
}

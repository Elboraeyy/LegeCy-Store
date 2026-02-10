'use client';

import { useState } from 'react';
import { adjustStockPro, InventoryItemPro } from '@/lib/actions/inventory-pro';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface StockAdjustmentDialogProps {
    item: InventoryItemPro;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StockAdjustmentDialog({ item, onClose, onSuccess }: StockAdjustmentDialogProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const [quantity, setQuantity] = useState(0);
    const [mode, setMode] = useState<'add' | 'remove' | 'set'>('add');
    const [reason, setReason] = useState('');
    const [newMinStock, setNewMinStock] = useState(item.minStock);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (mode !== 'set' && quantity === 0) {
            toast.error(t.inventory.adjust.zero_error);
            return;
        }
        if (!reason.trim()) {
            toast.error(t.inventory.adjust.reason_error);
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
                toast.success(t.inventory.adjust.success);
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            toast.error(t.inventory.adjust.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="confirm-dialog-overlay" onClick={onClose}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', textAlign: 'left' }}>
                <div className="confirm-dialog-icon">📦</div>
                <h2 className="confirm-dialog-title">{t.inventory.adjust.title}</h2>
                <p className="confirm-dialog-message" style={{ textAlign: 'left', marginBottom: '24px' }}>
                    <strong>{item.productName}</strong><br />
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.sku}</span> • {t.inventory.adjust.current}: <strong>{item.available}</strong> {t.inventory.adjust.units}
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
                            {m === 'add' ? t.inventory.adjust.mode.add : m === 'remove' ? t.inventory.adjust.mode.remove : t.inventory.adjust.mode.set}
                        </button>
                    ))}
                </div>

                {/* Quantity */}
                <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                    <label>{mode === 'set' ? t.inventory.adjust.new_quantity : t.inventory.adjust.quantity}</label>
                    <input
                        type="number"
                        className="form-input"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        min={0}
                        placeholder={mode === 'set' ? t.inventory.adjust.enter_new_stock : t.inventory.adjust.enter_quantity}
                    />
                </div>

                {/* Min Stock */}
                <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                    <label>{t.inventory.adjust.min_stock}</label>
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
                    <label>{t.inventory.adjust.reason}</label>
                    <textarea
                        className="form-input"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t.inventory.adjust.reason_placeholder}
                        rows={3}
                    />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} className="admin-btn admin-btn-outline">
                        {t.inventory.adjust.cancel}
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSubmit} 
                        className="admin-btn admin-btn-primary"
                        disabled={loading}
                    >
                        {loading ? t.inventory.adjust.saving : t.inventory.adjust.confirm}
                    </button>
                </div>
            </div>
        </div>
    );
}

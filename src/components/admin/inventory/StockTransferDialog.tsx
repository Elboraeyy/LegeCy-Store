'use client';

import { useState, useEffect } from 'react';
import { transferStock, fetchAllWarehouses, InventoryItemPro } from '@/lib/actions/inventory-pro';
import { toast } from 'sonner';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface StockTransferDialogProps {
    item: InventoryItemPro;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StockTransferDialog({ item, onClose, onSuccess }: StockTransferDialogProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
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
            toast.error(t.inventory.transfer.zero_error);
            return;
        }
        if (quantity > item.available) {
            toast.error(t.inventory.transfer.availability_error);
            return;
        }
        if (!targetWarehouseId) {
            toast.error(t.inventory.transfer.warehouse_error);
            return;
        }
        if (!reason.trim()) {
            toast.error(t.inventory.transfer.reason_error);
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
                toast.success(t.inventory.transfer.success);
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            toast.error(t.inventory.transfer.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="confirm-dialog-overlay" onClick={onClose}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', textAlign: 'left' }}>
                <div className="confirm-dialog-icon">🔄</div>
                <h2 className="confirm-dialog-title">{t.inventory.transfer.title}</h2>
                <p className="confirm-dialog-message" style={{ textAlign: 'left', marginBottom: '24px' }}>
                    <strong>{item.productName}</strong><br />
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.sku}</span><br />
                    {t.inventory.transfer.from}: <strong>{item.warehouseName}</strong> • {t.inventory.table.available}: <strong>{item.available}</strong> {t.inventory.adjust.units}
                </p>

                {/* Target Warehouse */}
                <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                    <label>{t.inventory.transfer.to}</label>
                    <AdminDropdown
                        value={targetWarehouseId}
                        onChange={setTargetWarehouseId}
                        placeholder={t.inventory.transfer.select_dest}
                        options={[
                            { value: '', label: t.inventory.transfer.select_dest },
                            ...warehouses.map(w => ({ value: w.id, label: w.name }))
                        ]}
                    />
                </div>

                {/* Quantity */}
                <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                    <label>{t.inventory.transfer.quantity}</label>
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
                    <label>{t.inventory.transfer.reason}</label>
                    <textarea
                        className="form-input"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t.inventory.transfer.reason_placeholder}
                        rows={3}
                    />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} className="admin-btn admin-btn-outline">
                        {t.inventory.transfer.cancel}
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSubmit} 
                        className="admin-btn admin-btn-primary"
                        disabled={loading}
                    >
                        {loading ? t.inventory.transfer.transferring : t.inventory.transfer.confirm}
                    </button>
                </div>
            </div>
        </div>
    );
}

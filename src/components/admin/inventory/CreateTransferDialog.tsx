'use client';

import { useState, useEffect } from 'react';
import { createTransfer, fetchInventoryForTransfer } from '@/lib/actions/transfer-actions';
import { WarehouseWithStats } from '@/lib/actions/warehouse-actions';
import { toast } from 'sonner';
import Image from 'next/image';

interface CreateTransferDialogProps {
    warehouses: WarehouseWithStats[];
    onClose: () => void;
    onSuccess: () => void;
}

type InventoryItem = {
    variantId: string;
    sku: string;
    productName: string;
    productImage: string | null;
    available: number;
    reserved: number;
};

type SelectedItem = {
    variantId: string;
    sku: string;
    productName: string;
    productImage: string | null;
    available: number;
    quantity: number;
};

export default function CreateTransferDialog({ warehouses, onClose, onSuccess }: CreateTransferDialogProps) {
    const [step, setStep] = useState(1);
    const [fromWarehouseId, setFromWarehouseId] = useState('');
    const [toWarehouseId, setToWarehouseId] = useState('');
    const [notes, setNotes] = useState('');
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingInventory, setLoadingInventory] = useState(false);

    // Load inventory when source warehouse changes
    useEffect(() => {
        if (fromWarehouseId) {
            setLoadingInventory(true);
            fetchInventoryForTransfer(fromWarehouseId).then(items => {
                setInventoryItems(items);
                setLoadingInventory(false);
            });
        } else {
            setInventoryItems([]);
        }
        setSelectedItems([]); // Reset selection when warehouse changes
    }, [fromWarehouseId]);

    const toggleItem = (item: InventoryItem) => {
        const existing = selectedItems.find(s => s.variantId === item.variantId);
        if (existing) {
            setSelectedItems(selectedItems.filter(s => s.variantId !== item.variantId));
        } else {
            setSelectedItems([...selectedItems, {
                variantId: item.variantId,
                sku: item.sku,
                productName: item.productName,
                productImage: item.productImage,
                available: item.available,
                quantity: 1
            }]);
        }
    };

    const updateQuantity = (variantId: string, quantity: number) => {
        setSelectedItems(selectedItems.map(s => 
            s.variantId === variantId ? { ...s, quantity: Math.max(1, Math.min(quantity, s.available)) } : s
        ));
    };

    const handleSubmit = async () => {
        if (!fromWarehouseId || !toWarehouseId) {
            toast.error('Please select source and destination warehouses');
            return;
        }
        if (fromWarehouseId === toWarehouseId) {
            toast.error('Source and destination must be different');
            return;
        }
        if (selectedItems.length === 0) {
            toast.error('Please select at least one item');
            return;
        }

        setLoading(true);
        try {
            const res = await createTransfer({
                fromWarehouseId,
                toWarehouseId,
                notes,
                items: selectedItems.map(s => ({ variantId: s.variantId, quantity: s.quantity }))
            });

            if ('error' in res) {
                toast.error(res.error);
            } else {
                toast.success('Transfer created successfully');
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to create transfer');
        } finally {
            setLoading(false);
        }
    };

    const fromWarehouse = warehouses.find(w => w.id === fromWarehouseId);
    const toWarehouse = warehouses.find(w => w.id === toWarehouseId);
    const totalQuantity = selectedItems.reduce((sum, s) => sum + s.quantity, 0);

    return (
        <div className="confirm-dialog-overlay" onClick={onClose}>
            <div 
                className="confirm-dialog" 
                onClick={(e) => e.stopPropagation()} 
                style={{ maxWidth: '800px', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div className="confirm-dialog-icon" style={{ margin: 0 }}>🔄</div>
                    <div>
                        <h2 className="confirm-dialog-title" style={{ margin: 0 }}>New Transfer</h2>
                        <p style={{ margin: '4px 0 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>
                            Step {step} of 3
                        </p>
                    </div>
                </div>

                {/* Step 1: Select Warehouses */}
                {step === 1 && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center' }}>
                            <div className="admin-form-group">
                                <label>From Warehouse</label>
                                <select
                                    value={fromWarehouseId}
                                    onChange={(e) => setFromWarehouseId(e.target.value)}
                                    className="form-input"
                                >
                                    <option value="">Select source...</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id} disabled={w.id === toWarehouseId}>
                                            {w.name} ({w.totalQuantity} units)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div style={{ fontSize: '24px', color: 'var(--admin-text-muted)', marginTop: '20px' }}>→</div>
                            
                            <div className="admin-form-group">
                                <label>To Warehouse</label>
                                <select
                                    value={toWarehouseId}
                                    onChange={(e) => setToWarehouseId(e.target.value)}
                                    className="form-input"
                                >
                                    <option value="">Select destination...</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id} disabled={w.id === fromWarehouseId}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label>Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="form-input"
                                placeholder="Reason for transfer..."
                                rows={2}
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Select Items */}
                {step === 2 && (
                    <div>
                        <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                            Select items from <strong>{fromWarehouse?.name}</strong> to transfer
                        </div>

                        {loadingInventory ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                Loading inventory...
                            </div>
                        ) : inventoryItems.length > 0 ? (
                            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: '12px' }}>
                                {inventoryItems.map(item => {
                                    const isSelected = selectedItems.some(s => s.variantId === item.variantId);
                                    return (
                                        <div 
                                            key={item.variantId}
                                            onClick={() => toggleItem(item)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px 16px',
                                                borderBottom: '1px solid var(--admin-border)',
                                                cursor: 'pointer',
                                                background: isSelected ? 'rgba(26, 60, 52, 0.05)' : 'transparent',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '4px',
                                                border: '2px solid var(--admin-border)',
                                                background: isSelected ? 'var(--admin-bg-dark)' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '12px'
                                            }}>
                                                {isSelected && '✓'}
                                            </div>
                                            
                                            <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', position: 'relative', background: '#f8f8f8' }}>
                                                {item.productImage ? (
                                                    <Image src={item.productImage} alt="" fill style={{ objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#999' }}>
                                                        NO IMG
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.productName}</div>
                                                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--admin-text-muted)' }}>{item.sku}</div>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 600 }}>{item.available}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)' }}>available</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                No items available in this warehouse
                            </div>
                        )}

                        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--admin-surface-light)', borderRadius: '8px', fontSize: '14px' }}>
                            <strong>{selectedItems.length}</strong> items selected
                        </div>
                    </div>
                )}

                {/* Step 3: Set Quantities */}
                {step === 3 && (
                    <div>
                        <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                            Set quantities to transfer from <strong>{fromWarehouse?.name}</strong> to <strong>{toWarehouse?.name}</strong>
                        </div>

                        <div style={{ border: '1px solid var(--admin-border)', borderRadius: '12px', overflow: 'hidden' }}>
                            {selectedItems.map(item => (
                                <div 
                                    key={item.variantId}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        borderBottom: '1px solid var(--admin-border)'
                                    }}
                                >
                                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', position: 'relative', background: '#f8f8f8' }}>
                                        {item.productImage ? (
                                            <Image src={item.productImage} alt="" fill style={{ objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#999' }}>
                                                NO IMG
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.productName}</div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--admin-text-muted)' }}>{item.sku}</div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                            className="admin-btn admin-btn-outline"
                                            style={{ padding: '4px 10px', fontSize: '14px' }}
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.variantId, parseInt(e.target.value) || 1)}
                                            className="form-input"
                                            style={{ width: '70px', textAlign: 'center', padding: '6px' }}
                                            min={1}
                                            max={item.available}
                                        />
                                        <button
                                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                            className="admin-btn admin-btn-outline"
                                            style={{ padding: '4px 10px', fontSize: '14px' }}
                                        >
                                            +
                                        </button>
                                        <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', minWidth: '60px' }}>
                                            / {item.available}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '16px', padding: '16px', background: 'var(--admin-surface-light)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Total Items:</span>
                                <strong>{selectedItems.length}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Total Quantity:</span>
                                <strong>{totalQuantity}</strong>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '24px' }}>
                    <button 
                        type="button" 
                        onClick={step === 1 ? onClose : () => setStep(step - 1)} 
                        className="admin-btn admin-btn-outline"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    
                    {step < 3 ? (
                        <button 
                            type="button" 
                            onClick={() => setStep(step + 1)} 
                            className="admin-btn admin-btn-primary"
                            disabled={
                                (step === 1 && (!fromWarehouseId || !toWarehouseId)) ||
                                (step === 2 && selectedItems.length === 0)
                            }
                        >
                            Next
                        </button>
                    ) : (
                        <button 
                            type="button" 
                            onClick={handleSubmit} 
                            className="admin-btn admin-btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Transfer'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

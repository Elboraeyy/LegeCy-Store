import { useState, useEffect, useCallback } from 'react';
import { fetchStockCountById, updateCountItem, completeStockCount, StockCountItemWithDetails } from '@/lib/actions/stockcount-actions';
import { toast } from 'sonner';
import Image from 'next/image';

interface StockCountDialogProps {
    countId: string;
    isReadOnly: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export default function StockCountDialog({ countId, isReadOnly, onClose, onComplete }: StockCountDialogProps) {
    const [items, setItems] = useState<StockCountItemWithDetails[]>([]);
    const [countInfo, setCountInfo] = useState<{ countNumber: string; warehouseName: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);

    const loadCount = useCallback(async () => {
        const res = await fetchStockCountById(countId);
        if (res) {
            setCountInfo({ countNumber: res.count.countNumber, warehouseName: res.count.warehouseName });
            setItems(res.items);
        }
        setLoading(false);
    }, [countId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void loadCount();
        }, 0);
        return () => clearTimeout(timer);
    }, [loadCount]);

    const handleUpdateItem = async (item: StockCountItemWithDetails, countedQty: number) => {
        const res = await updateCountItem(item.id, countedQty);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            // Update local state
            setItems(items.map(i => 
                i.id === item.id 
                    ? { ...i, countedQty, variance: countedQty - i.systemQty } 
                    : i
            ));
        }
    };

    const handleComplete = async (applyAdjustments: boolean) => {
        if (!confirm(applyAdjustments 
            ? 'Complete and apply inventory adjustments? This will update stock levels.' 
            : 'Complete without applying adjustments? Variances will be recorded but not applied.'
        )) return;

        setCompleting(true);
        const res = await completeStockCount(countId, applyAdjustments);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            toast.success('Stock count completed');
            onComplete();
        }
        setCompleting(false);
    };

    const countedCount = items.filter(i => i.countedQty !== null).length;
    const totalVariance = items.reduce((sum, i) => sum + (i.variance || 0), 0);
    const allCounted = countedCount === items.length;

    return (
        <div className="confirm-dialog-overlay" onClick={onClose}>
            <div 
                className="confirm-dialog" 
                onClick={(e) => e.stopPropagation()} 
                style={{ maxWidth: '900px', textAlign: 'left', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexShrink: 0 }}>
                    <div className="confirm-dialog-icon" style={{ margin: 0 }}>📋</div>
                    <div style={{ flex: 1 }}>
                        <h2 className="confirm-dialog-title" style={{ margin: 0 }}>
                            {isReadOnly ? 'Count Results' : 'Stock Count'}
                        </h2>
                        {countInfo && (
                            <p style={{ margin: '4px 0 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>
                                {countInfo.countNumber} • {countInfo.warehouseName}
                            </p>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Progress</div>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{countedCount}/{items.length}</div>
                    </div>
                </div>

                {/* Items List */}
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                        Loading items...
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: '12px' }}>
                        {items.map((item, idx) => (
                            <div 
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    borderBottom: idx < items.length - 1 ? '1px solid var(--admin-border)' : 'none',
                                    background: item.countedQty !== null 
                                        ? (item.variance === 0 ? 'rgba(22, 101, 52, 0.03)' : 'rgba(183, 110, 0, 0.03)') 
                                        : 'transparent'
                                }}
                            >
                                {/* Image */}
                                <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', position: 'relative', background: '#f8f8f8', flexShrink: 0 }}>
                                    {item.productImage ? (
                                        <Image src={item.productImage} alt="" fill style={{ objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#999' }}>
                                            NO IMG
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 500, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.productName}
                                    </div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                        {item.sku}
                                    </div>
                                </div>

                                {/* System Qty */}
                                <div style={{ textAlign: 'center', width: '80px' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>System</div>
                                    <div style={{ fontSize: '18px', fontWeight: 600 }}>{item.systemQty}</div>
                                </div>

                                {/* Counted Qty */}
                                <div style={{ textAlign: 'center', width: '100px' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Counted</div>
                                    {isReadOnly ? (
                                        <div style={{ fontSize: '18px', fontWeight: 600 }}>{item.countedQty ?? '-'}</div>
                                    ) : (
                                        <input
                                            type="number"
                                            value={item.countedQty ?? ''}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val) && val >= 0) {
                                                    handleUpdateItem(item, val);
                                                }
                                            }}
                                            className="form-input"
                                            style={{ width: '70px', textAlign: 'center', padding: '6px', fontSize: '16px', fontWeight: 600 }}
                                            min={0}
                                            placeholder="-"
                                        />
                                    )}
                                </div>

                                {/* Variance */}
                                <div style={{ textAlign: 'center', width: '80px' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Variance</div>
                                    <div style={{ 
                                        fontSize: '16px', 
                                        fontWeight: 600,
                                        color: item.variance === null ? 'var(--admin-text-muted)' :
                                            item.variance === 0 ? '#166534' :
                                            item.variance > 0 ? '#1e40af' : '#991b1b'
                                    }}>
                                        {item.variance === null ? '-' : (item.variance > 0 ? '+' : '')}{item.variance ?? ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary & Actions */}
                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <div>
                            <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Total Variance: </span>
                            <span style={{ 
                                fontWeight: 700,
                                color: totalVariance === 0 ? '#166534' : (totalVariance > 0 ? '#1e40af' : '#991b1b')
                            }}>
                                {totalVariance > 0 ? '+' : ''}{totalVariance}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={onClose} className="admin-btn admin-btn-outline">
                            {isReadOnly ? 'Close' : 'Save & Exit'}
                        </button>
                        {!isReadOnly && (
                            <>
                                <button 
                                    type="button" 
                                    onClick={() => handleComplete(false)} 
                                    className="admin-btn admin-btn-outline"
                                    disabled={!allCounted || completing}
                                    style={{ opacity: allCounted ? 1 : 0.5 }}
                                >
                                    Complete (No Apply)
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => handleComplete(true)} 
                                    className="admin-btn admin-btn-primary"
                                    disabled={!allCounted || completing}
                                    style={{ opacity: allCounted ? 1 : 0.5 }}
                                >
                                    {completing ? 'Completing...' : 'Complete & Apply'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

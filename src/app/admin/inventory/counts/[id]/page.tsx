'use client';

import { useEffect, useState, useCallback, useRef, KeyboardEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { 
    fetchStockCountById, 
    updateCountItem, 
    completeStockCount,
    StockCountWithDetails,
    StockCountItemWithDetails
} from '@/lib/actions/stockcount-actions';
import { toast } from 'sonner';

export default function StockCountPage() {
    const params = useParams();
    const router = useRouter();
    const countId = params.id as string;
    
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();
    const [count, setCount] = useState<StockCountWithDetails | null>(null);
    const [items, setItems] = useState<StockCountItemWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COUNTED' | 'VARIANCE'>('ALL');
    const [activeIndex, setActiveIndex] = useState(0);
    
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const searchRef = useRef<HTMLInputElement>(null);

    const loadCount = useCallback(async (id: string) => {
        setLoading(true);
        const res = await fetchStockCountById(id);
        if (res) {
            setCount(res.count);
            setItems(res.items);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!permLoading && hasPermission('INVENTORY_MANAGE') && countId) {
            const timer = setTimeout(() => {
                void loadCount(countId);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [permLoading, hasPermission, loadCount, countId]);

    const handleUpdateItem = async (item: StockCountItemWithDetails, countedQty: number) => {
        const res = await updateCountItem(item.id, countedQty);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            setItems(items.map(i => 
                i.id === item.id 
                    ? { ...i, countedQty, variance: countedQty - i.systemQty } 
                    : i
            ));
        }
    };

    const handleComplete = async (applyAdjustments: boolean) => {
        const action = applyAdjustments 
            ? 'Complete and apply inventory adjustments? This will update stock levels.' 
            : 'Complete without applying adjustments? Variances will be recorded but not applied.';
        
        if (!confirm(action)) return;

        setCompleting(true);
        const res = await completeStockCount(countId, applyAdjustments);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            toast.success('Stock count completed successfully!');
            router.push('/admin/inventory/counts');
        }
        setCompleting(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const nextIndex = index + 1;
            if (nextIndex < filteredItems.length) {
                setActiveIndex(nextIndex);
                inputRefs.current[nextIndex]?.focus();
                inputRefs.current[nextIndex]?.select();
            }
        } else if (e.key === 'ArrowUp' && index > 0) {
            e.preventDefault();
            setActiveIndex(index - 1);
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowDown' && index < filteredItems.length - 1) {
            e.preventDefault();
            setActiveIndex(index + 1);
            inputRefs.current[index + 1]?.focus();
        } else if (e.key === 'Escape') {
            searchRef.current?.focus();
        }
    };

    // Filter items
    const filteredItems = items.filter(item => {
        const matchesSearch = !search || 
            item.sku.toLowerCase().includes(search.toLowerCase()) ||
            item.productName.toLowerCase().includes(search.toLowerCase());
        
        if (!matchesSearch) return false;
        
        if (filter === 'PENDING') return item.countedQty === null;
        if (filter === 'COUNTED') return item.countedQty !== null;
        if (filter === 'VARIANCE') return item.variance !== null && item.variance !== 0;
        return true;
    });

    const countedCount = items.filter(i => i.countedQty !== null).length;
    const totalVariance = items.reduce((sum, i) => sum + (i.variance || 0), 0);
    const allCounted = countedCount === items.length;
    const isReadOnly = count?.status === 'COMPLETED' || count?.status === 'CANCELLED';
    const accuracyPercent = items.length > 0 ? Math.round((items.filter(i => i.variance === 0).length / items.length) * 100) : 100;

    if (permLoading || loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '48px' }}>📋</div>
                <div style={{ color: 'var(--admin-text-muted)' }}>Loading stock count...</div>
            </div>
        );
    }

    if (!hasPermission('INVENTORY_MANAGE')) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#991b1b' }}>Access Denied</div>;
    }

    if (!count) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '48px' }}>❌</div>
                <div style={{ color: 'var(--admin-text-muted)' }}>Stock count not found</div>
                <Link href="/admin/inventory/counts" className="admin-btn admin-btn-outline">← Back to Counts</Link>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Link href="/admin/inventory/counts" className="admin-btn admin-btn-outline" style={{ padding: '10px 16px' }}>
                        ← Back
                    </Link>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 className="admin-title" style={{ margin: 0 }}>{count.countNumber}</h1>
                            <span style={{
                                padding: '6px 14px',
                                borderRadius: 'var(--admin-radius)',
                                fontSize: '11px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                background: isReadOnly ? 'rgba(22, 101, 52, 0.1)' : 'rgba(183, 110, 0, 0.1)',
                                color: isReadOnly ? '#166534' : '#b76e00'
                            }}>
                                {count.status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="admin-subtitle" style={{ margin: '4px 0 0' }}>
                            📦 {count.warehouseName} • {items.length} items
                        </p>
                    </div>
                </div>
            </div>

            {/* Results Summary for Completed */}
            {isReadOnly && count.status === 'COMPLETED' && (
                <div className="admin-card" style={{ padding: '28px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <span style={{ fontSize: '28px' }}>📊</span>
                        <div>
                            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', margin: 0, color: 'var(--admin-text-on-light)' }}>
                                Count Results
                            </h2>
                            {count.completedByName && (
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                                    Completed by {count.completedByName}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        <div style={{ textAlign: 'center', padding: '20px', background: 'var(--admin-surface-light)', borderRadius: 'var(--admin-radius-sm)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginBottom: '8px' }}>Total Items</div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--admin-text-on-light)' }}>{items.length}</div>
                        </div>
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '20px', 
                            background: accuracyPercent >= 95 ? 'rgba(22, 101, 52, 0.08)' : 'rgba(183, 110, 0, 0.08)', 
                            borderRadius: 'var(--admin-radius-sm)' 
                        }}>
                            <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginBottom: '8px' }}>Accuracy</div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: accuracyPercent >= 95 ? '#166534' : '#b76e00' }}>{accuracyPercent}%</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(30, 64, 175, 0.06)', borderRadius: 'var(--admin-radius-sm)' }}>
                            <div style={{ fontSize: '13px', color: '#1e40af', marginBottom: '8px' }}>Over (+)</div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e40af' }}>
                                +{items.filter(i => i.variance && i.variance > 0).reduce((sum, i) => sum + (i.variance || 0), 0)}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(153, 27, 27, 0.06)', borderRadius: 'var(--admin-radius-sm)' }}>
                            <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '8px' }}>Short (-)</div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: '#991b1b' }}>
                                {items.filter(i => i.variance && i.variance < 0).reduce((sum, i) => sum + (i.variance || 0), 0)}
                            </div>
                        </div>
                    </div>

                    {count.notes && (
                        <div style={{ marginTop: '20px', padding: '16px', background: 'var(--admin-surface-light)', borderRadius: 'var(--admin-radius-sm)', fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                            <strong>Notes:</strong> {count.notes}
                        </div>
                    )}
                </div>
            )}

            {/* Progress Card for Active Counts */}
            {!isReadOnly && (
                <div className="admin-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>Progress</div>
                                <div style={{ fontSize: '24px', fontWeight: 700 }}>{countedCount}/{items.length}</div>
                            </div>
                            <div style={{ width: '200px', height: '10px', background: 'var(--admin-border)', borderRadius: 'var(--admin-radius)' }}>
                                <div style={{
                                    width: `${items.length > 0 ? (countedCount / items.length) * 100 : 0}%`,
                                    height: '100%',
                                    background: allCounted ? '#166534' : 'var(--admin-accent)',
                                    borderRadius: 'var(--admin-radius)',
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>Net Variance</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: totalVariance === 0 ? '#166534' : (totalVariance > 0 ? '#1e40af' : '#991b1b') }}>
                                {totalVariance > 0 ? '+' : ''}{totalVariance}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="admin-toolbar" style={{ marginBottom: '20px' }}>
                <div className="admin-search-wrapper" style={{ flex: 1, maxWidth: '350px' }}>
                    <span className="admin-search-icon">🔍</span>
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search SKU or product..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="admin-search-input"
                    />
                </div>

                <div className="admin-tabs-container">
                    {[
                        { key: 'ALL', label: 'All' },
                        { key: 'PENDING', label: 'Pending' },
                        { key: 'COUNTED', label: 'Counted' },
                        { key: 'VARIANCE', label: 'Variance' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key as typeof filter)}
                            className={`admin-tab-pill ${filter === f.key ? 'active' : ''}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Items Table */}
            {filteredItems.length > 0 ? (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}></th>
                                <th>Product</th>
                                <th style={{ textAlign: 'center', width: '100px' }}>System</th>
                                <th style={{ textAlign: 'center', width: '120px' }}>Counted</th>
                                <th style={{ textAlign: 'center', width: '100px' }}>Variance</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item, idx) => (
                                <tr 
                                    key={item.id}
                                    style={{ 
                                        background: activeIndex === idx && !isReadOnly ? 'rgba(212, 175, 55, 0.05)' : undefined 
                                    }}
                                >
                                    <td>
                                        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--admin-radius-sm)', overflow: 'hidden', position: 'relative', background: '#f8f8f8' }}>
                                            {item.productImage ? (
                                                <Image src={item.productImage} alt="" fill style={{ objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>
                                                    NO IMG
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.productName}</div>
                                        <code style={{ fontSize: '12px', color: 'var(--admin-text-muted)', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: '4px' }}>
                                            {item.sku}
                                        </code>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 700 }}>{item.systemQty}</span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {isReadOnly ? (
                                            <span style={{ fontSize: '20px', fontWeight: 700 }}>{item.countedQty ?? '-'}</span>
                                        ) : (
                                            <input
                                                ref={el => { inputRefs.current[idx] = el; }}
                                                type="number"
                                                value={item.countedQty ?? ''}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val) && val >= 0) handleUpdateItem(item, val);
                                                }}
                                                onFocus={() => setActiveIndex(idx)}
                                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                                className="form-input"
                                                style={{ width: '80px', textAlign: 'center', padding: '10px', fontSize: '18px', fontWeight: 700, borderRadius: 'var(--admin-radius-sm)' }}
                                                min={0}
                                                placeholder="-"
                                            />
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{ 
                                            display: 'inline-block',
                                            padding: '8px 16px',
                                            borderRadius: 'var(--admin-radius)',
                                            fontSize: '16px', 
                                            fontWeight: 700,
                                            background: item.variance === null ? 'transparent' :
                                                item.variance === 0 ? 'rgba(22, 101, 52, 0.1)' :
                                                item.variance > 0 ? 'rgba(30, 64, 175, 0.1)' : 'rgba(153, 27, 27, 0.1)',
                                            color: item.variance === null ? 'var(--admin-text-muted)' :
                                                item.variance === 0 ? '#166534' :
                                                item.variance > 0 ? '#1e40af' : '#991b1b'
                                        }}>
                                            {item.variance === null ? '-' : (item.variance > 0 ? '+' : '')}{item.variance ?? ''}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {item.countedQty !== null ? (
                                            item.variance === 0 ? '✅' : '⚠️'
                                        ) : (
                                            <span style={{ color: 'var(--admin-text-muted)' }}>○</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="admin-card" style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <div style={{ color: 'var(--admin-text-muted)' }}>No items match your search</div>
                </div>
            )}

            {/* Footer Actions */}
            {!isReadOnly && (
                <div style={{ 
                    marginTop: '24px',
                    padding: '20px 24px',
                    background: 'var(--admin-surface)',
                    borderRadius: 'var(--admin-radius)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                        {allCounted ? (
                            <span style={{ color: '#166534' }}>✓ All items counted!</span>
                        ) : (
                            <span>{items.length - countedCount} items remaining</span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link href="/admin/inventory/counts" className="admin-btn admin-btn-outline" style={{ padding: '12px 24px' }}>
                            Save & Exit
                        </Link>
                        <button 
                            onClick={() => handleComplete(false)} 
                            className="admin-btn admin-btn-outline"
                            disabled={!allCounted || completing}
                            style={{ padding: '12px 24px', opacity: allCounted ? 1 : 0.5 }}
                        >
                            Complete Only
                        </button>
                        <button 
                            onClick={() => handleComplete(true)} 
                            className="admin-btn admin-btn-primary"
                            disabled={!allCounted || completing}
                            style={{ padding: '12px 24px', opacity: allCounted ? 1 : 0.5 }}
                        >
                            {completing ? 'Completing...' : '✓ Complete & Apply'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

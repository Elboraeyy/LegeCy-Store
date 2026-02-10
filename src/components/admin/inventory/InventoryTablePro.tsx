'use client';

import { useState } from 'react';
import Image from 'next/image';
import { InventoryItemPro } from '@/lib/actions/inventory-pro';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import StockAdjustmentDialog from './StockAdjustmentDialog';
import StockTransferDialog from './StockTransferDialog';

interface InventoryTableProProps {
    data: InventoryItemPro[];
    onRefresh: () => void;
}

export default function InventoryTablePro({ data, onRefresh }: InventoryTableProProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];

    const [adjustItem, setAdjustItem] = useState<InventoryItemPro | null>(null);
    const [transferItem, setTransferItem] = useState<InventoryItemPro | null>(null);

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'IN_STOCK': return 'status-paid';
            case 'LOW_STOCK': return 'status-pending';
            case 'OUT_OF_STOCK': return 'status-cancelled';
            default: return '';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'IN_STOCK': return t.inventory.filters.in_stock;
            case 'LOW_STOCK': return t.inventory.filters.low_stock;
            case 'OUT_OF_STOCK': return t.inventory.filters.out_of_stock;
            default: return status;
        }
    };

    return (
        <>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>{t.inventory.table.image}</th>
                            <th>{t.inventory.table.product_details}</th>
                            <th>{t.inventory.table.warehouse}</th>
                            <th style={{ textAlign: 'right' }}>{t.inventory.table.available}</th>
                            <th style={{ textAlign: 'right' }}>{t.inventory.table.reserved}</th>
                            <th style={{ textAlign: 'center' }}>{t.inventory.table.status}</th>
                            <th style={{ textAlign: 'right' }}>{t.inventory.table.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        background: '#fff',
                                        border: '1px solid var(--admin-border)',
                                        position: 'relative'
                                    }}>
                                        {item.productImage ? (
                                            <Image 
                                                src={item.productImage} 
                                                alt={item.productName} 
                                                fill
                                                style={{ objectFit: 'cover' }} 
                                            />
                                        ) : (
                                            <div style={{ 
                                                width: '100%', 
                                                height: '100%', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                fontSize: '10px', 
                                                color: '#999', 
                                                background: '#f8f8f8' 
                                            }}>
                                                    {t.inventory.table.no_img}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--admin-text-on-light)', fontSize: '15px' }}>
                                        {item.productName}
                                    </div>
                                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--admin-text-muted)', background: 'rgba(0,0,0,0.03)', padding: '2px 6px', borderRadius: '3px', width: 'fit-content', marginTop: '4px' }}>
                                        {item.sku}
                                    </div>
                                </td>
                                <td>
                                    <span style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        padding: '4px 12px', 
                                        borderRadius: '99px', 
                                        fontSize: '11px', 
                                        fontWeight: 600,
                                        background: 'rgba(18, 64, 60, 0.08)',
                                        color: 'var(--admin-text-on-light)'
                                    }}>
                                        {item.warehouseName}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ 
                                        fontWeight: 700, 
                                        fontSize: '18px',
                                        color: item.available <= item.minStock ? (item.available === 0 ? '#991b1b' : '#b76e00') : '#166534'
                                    }}>
                                        {item.available}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)' }}>
                                        {t.inventory.table.min}: {item.minStock}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--admin-text-muted)' }}>
                                    {item.reserved}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
                                        {getStatusLabel(item.status)}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                        <button
                                            onClick={() => setAdjustItem(item)}
                                            className="admin-btn admin-btn-outline"
                                            style={{ padding: '8px 16px', fontSize: '11px' }}
                                        >
                                            {t.inventory.table.adjust}
                                        </button>
                                        <button
                                            onClick={() => setTransferItem(item)}
                                            className="admin-btn admin-btn-outline"
                                            style={{ padding: '8px 16px', fontSize: '11px' }}
                                        >
                                            {t.inventory.table.transfer}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Dialogs */}
            {adjustItem && (
                <StockAdjustmentDialog 
                    item={adjustItem} 
                    onClose={() => setAdjustItem(null)} 
                    onSuccess={() => { setAdjustItem(null); onRefresh(); }} 
                />
            )}
            
            {transferItem && (
                <StockTransferDialog 
                    item={transferItem} 
                    onClose={() => setTransferItem(null)} 
                    onSuccess={() => { setTransferItem(null); onRefresh(); }} 
                />
            )}
        </>
    );
}

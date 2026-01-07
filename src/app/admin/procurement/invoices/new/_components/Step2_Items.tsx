'use client';

import { addInvoiceItem, getInvoice } from '@/lib/actions/procurement';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Props {
    invoiceId: string;
    onNext: () => void;
    onBack: () => void;
}

import { PurchaseInvoiceItem } from '@prisma/client';

export function Step2_Items({ invoiceId, onNext, onBack }: Props) {
    const [items, setItems] = useState<PurchaseInvoiceItem[]>([]); 
    // Fetch items on mount
    useEffect(() => {
        getInvoice(invoiceId).then(inv => {
            if(inv) setItems(inv.items);
        });
    }, [invoiceId]);

    const [newItem, setNewItem] = useState({ description: '', quantity: 1, unitCost: 0, productId: '' });

    async function handleAddItem() {
        if (!newItem.description || newItem.quantity <= 0) return;
        
        try {
            await addInvoiceItem(invoiceId, newItem); 
            // Optimistic update or refetch
             getInvoice(invoiceId).then(inv => {
                if(inv) setItems(inv.items);
            });
            setNewItem({ description: '', quantity: 1, unitCost: 0, productId: '' });
            toast.success('Item added');
        } catch {
            toast.error('Failed to add item');
        }
    }

    return (
        <div className="space-y-6">
            <div className="admin-card bg-base-200">
                <h3 className="font-bold mb-4">Add Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="form-group md:col-span-2">
                        <label>Description / Product</label>
                        <input 
                            type="text" 
                            className="admin-input" 
                            placeholder="Enter description..." 
                            value={newItem.description}
                            onChange={e => setNewItem({...newItem, description: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Qty</label>
                        <input 
                            type="number" 
                            className="admin-input" 
                            min="1"
                            value={newItem.quantity}
                            onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Unit Cost</label>
                        <input 
                            type="number" 
                            className="admin-input" 
                            min="0"
                            step="0.01"
                            value={newItem.unitCost}
                            onChange={e => setNewItem({...newItem, unitCost: parseFloat(e.target.value)})}
                        />
                    </div>
                </div>
                <div className="mt-4 text-right">
                    <button onClick={handleAddItem} className="admin-btn admin-btn-secondary">
                        + Add Row
                    </button>
                </div>
            </div>

            <div className="admin-card p-0 overflow-hidden">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Cost</th>
                            <th>Total</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.description}</td>
                                <td>{item.quantity}</td>
                                <td>{Number(item.unitCost).toFixed(2)}</td>
                                <td>{(item.quantity * Number(item.unitCost)).toFixed(2)}</td>
                                <td>
                                    <button className="text-red-500 hover:text-red-700 hover:scale-105 transition-all font-medium text-sm" onClick={() => {/* Handle remove locally and server side */}}>
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {items.length === 0 && (
                            <tr><td colSpan={5} className="text-center text-muted py-4">No items added yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between pt-4">
                <button onClick={onBack} className="admin-btn admin-btn-secondary">Back</button>
                <button onClick={onNext} className="admin-btn admin-btn-primary" disabled={items.length === 0}>Review & Post</button>
            </div>
        </div>
    );
}

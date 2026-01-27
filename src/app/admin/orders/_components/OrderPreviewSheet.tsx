"use client";

import { useEffect, useState } from "react";
import { OrderStatus } from "@/lib/orderStatus";
import { formatCurrency } from "../../../../lib/utils";
import Link from "next/link";
import { updateOrderStatusAction } from "@/lib/actions/order";
import { toast } from "sonner";
import AdminDropdown from "@/components/admin/ui/AdminDropdown";
import { fetchOrderDetails } from "@/app/admin/actions"; 

interface OrderLineItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    variant: { sku: string } | null;
}

interface OrderDetails {
    id: string;
    createdAt: string;
    status: OrderStatus;
    totalPrice: number;
    items: OrderLineItem[];
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    shippingAddress?: string | null;
    shippingGovernorate?: string | null;
    shippingCity?: string | null;
    user: { name: string | null; email: string | null } | null;
}

interface OrderPreviewProps {
    orderId: string | null;
    onClose: () => void;
    onUpdate?: () => void; // Callback to refresh parent list
}

// Using a custom Drawer implementation since I don't see a UI library in file list
export default function OrderPreviewSheet({ orderId, onClose, onUpdate }: OrderPreviewProps) {
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (orderId) {
            setLoading(true);
            fetchOrderDetails(orderId)
                .then(data => {
                    // Start fix: Ensure data shape matches OrderDetails or null
                    // Assuming fetchOrderDetails returns correct shape or we cast it if specific fields missing
                    setOrder(data as OrderDetails); 
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setOrder(null);
        }
    }, [orderId]);

    if (!orderId) return null;

    const handleStatusChange = async (newStatus: string) => {
        setUpdating(true);
        try {
            const res = await updateOrderStatusAction(orderId, newStatus as OrderStatus);
            if (res.success) {
                toast.success("Order status updated");
                setOrder((prev) => prev ? ({ ...prev, status: newStatus as OrderStatus }) : null);
                if (onUpdate) onUpdate();
            } else {
                toast.error(res.error || "Failed to update status");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
            pointerEvents: 'none' // Allow clicks through transparent part if needed, but usually we want backdrop
        }}>
            {/* Backdrop */}
            <div 
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(2px)',
                    pointerEvents: 'auto',
                    opacity: orderId ? 1 : 0,
                    transition: 'opacity 0.2s'
                }}
            />

            {/* Drawer */}
            <div style={{
                width: '450px',
                maxWidth: '90vw',
                height: '100%',
                background: 'var(--admin-card-bg, white)',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
                position: 'relative',
                transform: orderId ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Header */}
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Order #{orderId.slice(0, 8)}</h2>
                        <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                            {loading ? 'Loading...' : (order ? new Date(order.createdAt).toLocaleString() : '')}
                        </span>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--admin-text-muted)' }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-text-muted)' }}>Loading details...</div>
                    ) : order ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            
                            {/* Status Control */}
                            <div className="admin-card" style={{ padding: '16px' }}>
                                <label className="stat-label" style={{ marginBottom: '8px', display: 'block' }}>Order Status</label>
                                <AdminDropdown 
                                    value={order.status}
                                    onChange={handleStatusChange}
                                    options={[
                                        { value: 'pending', label: 'Pending' },
                                        { value: 'paid', label: 'Paid' },
                                        { value: 'shipped', label: 'Shipped' },
                                        { value: 'delivered', label: 'Delivered' },
                                        { value: 'cancelled', label: 'Cancelled' }
                                    ]}
                                    disabled={updating}
                                />
                            </div>

                            {/* Customer Info */}
                            <div>
                                <h3 className="stat-label" style={{ marginBottom: '12px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px' }}>Customer</h3>
                                <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                                    <div style={{ fontWeight: 500 }}>{order.user?.name || order.customerName || 'Guest'}</div>
                                    <div style={{ color: 'var(--admin-text-muted)' }}>{order.user?.email || order.customerEmail}</div>
                                    <div style={{ color: 'var(--admin-text-muted)' }}>{order.customerPhone || 'No phone'}</div>
                                    <div style={{ marginTop: '8px', lineHeight: '1.4' }}>
                                            {order.shippingAddress}, {order.shippingCity}{order.shippingGovernorate && `, ${order.shippingGovernorate}`}
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h3 className="stat-label" style={{ marginBottom: '12px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px' }}>Items ({order.items.length})</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {order.items.map((item: OrderLineItem) => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '24px', height: '24px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                    {item.quantity}x
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{item.variant?.sku || 'No SKU'}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 600 }}>
                                               {formatCurrency(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600 }}>Total</span>
                                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--admin-primary)' }}>
                                        {formatCurrency(order.totalPrice)}
                                    </span>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div>Order not found</div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '20px', borderTop: '1px solid var(--admin-border)', display: 'flex', gap: '12px' }}>
                    <Link href={`/admin/orders/${orderId}`} style={{ flex: 1, textAlign: 'center' }} className="admin-btn admin-btn-primary">
                        View Full Details
                    </Link>
                </div>
            </div>
        </div>
    );
}

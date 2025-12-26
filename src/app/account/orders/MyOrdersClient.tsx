"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { createReturnRequest } from "@/lib/actions/returns";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  productId: string;
  price: number;
}

interface Order {
  id: string;
  status: string;
  createdAt: string;
  totalPrice: number;
  itemCount: number;
  items: OrderItem[];
  returnStatus?: string;
}

interface Props {
  orders: Order[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#d97706", bg: "#fef3c7" },
  confirmed: { label: "Confirmed", color: "#2563eb", bg: "#dbeafe" },
  paid: { label: "Paid", color: "#059669", bg: "#d1fae5" },
  processing: { label: "Processing", color: "#7c3aed", bg: "#ede9fe" },
  shipped: { label: "Shipped", color: "#0891b2", bg: "#cffafe" },
  delivered: { label: "Delivered", color: "#16a34a", bg: "#dcfce7" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fee2e2" },
};

export default function MyOrdersClient({ orders }: Props) {
  const [activeReturn, setActiveReturn] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const activeOrder = orders.find(o => o.id === activeReturn);

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReturn) return;
    
    // Construct items array
    const itemsToReturn = Object.entries(selectedItems)
        .filter((entry) => entry[1] > 0)
        .map(([id, qty]) => ({ id, quantity: qty }));

    if (itemsToReturn.length === 0) {
        toast.error("Please select at least one item to return");
        return;
    }

    setLoading(true);
    try {
        const result = await createReturnRequest(activeReturn, returnReason, itemsToReturn);
        if (result.success) {
            toast.success("Return request submitted");
            setActiveReturn(null);
            setReturnReason("");
            setSelectedItems({});
            window.location.reload(); 
        } else {
            toast.error(result.error || "Failed to submit request");
        }
    } catch {
        toast.error("An error occurred");
    } finally {
        setLoading(false);
    }
  }

  return (
    <main>
      <section className="shop-hero">
        <div className="container">
          <Reveal>
            <h1 className="fade-in">My Orders</h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="fade-in">View and track all your orders</p>
          </Reveal>
        </div>
      </section>

      <section className="container" style={{ marginBottom: "80px" }}>
        {orders.length === 0 ? (
          <Reveal>
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
              <h2 style={{ marginBottom: "12px" }}>No orders yet</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
                Browse our collection and discover luxury timepieces
              </p>
              <Link href="/shop" className="btn btn-primary">
                Browse Products
              </Link>
            </div>
          </Reveal>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {orders.map((order, idx) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              
              return (
                <Reveal key={order.id} delay={idx * 0.1}>
                  <div style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "20px",
                    alignItems: "center"
                  }}>
                    <div>
                      {/* Order Header */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: "18px",
                          color: "#1a3c34"
                        }}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: status.color,
                          background: status.bg
                        }}>
                          {status.label}
                        </span>
                        {order.returnStatus && (
                            <span style={{
                                padding: "4px 12px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#dc2626",
                                background: "#fee2e2"
                            }}>
                                Return: {order.returnStatus}
                            </span>
                        )}
                      </div>

                      {/* Order Info */}
                      <div style={{ 
                        display: "flex", 
                        gap: "24px", 
                        fontSize: "14px", 
                        color: "var(--text-muted)",
                        flexWrap: "wrap"
                      }}>
                        <span>📅 {formatDate(order.createdAt)}</span>
                        <span>📦 {order.itemCount} item{order.itemCount > 1 ? 's' : ''}</span>
                        <span style={{ fontWeight: 600, color: "#1a3c34" }}>
                          {formatPrice(order.totalPrice)}
                        </span>
                      </div>

                      {/* Items Preview */}
                      <p style={{ 
                        marginTop: "12px", 
                        fontSize: "13px", 
                        color: "var(--text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {order.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        {order.status === 'delivered' && !order.returnStatus && (
                            <button
                                onClick={() => setActiveReturn(order.id)}
                                style={{ 
                                    background: 'none', 
                                    border: '1px solid #dc2626', 
                                    color: '#dc2626', 
                                    padding: '10px 16px', 
                                    borderRadius: '8px', 
                                    cursor: 'pointer' 
                                }}
                            >
                                Request Return
                            </button>
                        )}
                      <Link 
                        href={`/track/${order.id}`}
                        className="btn btn-outline"
                        style={{ fontSize: "14px", padding: "10px 20px" }}
                      >
                        Track Order
                      </Link>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}

        {/* Return Modal */}
        {activeReturn && activeOrder && (
            <div style={{
                position: 'fixed',
                top: 0, 
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    background: '#fff',
                    padding: '32px',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '500px',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}>
                    <h2 style={{ marginBottom: '16px' }}>Request Return</h2>
                    <form onSubmit={handleCreateReturn}>
                         <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', padding: '12px' }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Select Items to Return:</p>
                            {activeOrder.items.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px' }}>{item.name}</span>
                                    <select 
                                      value={selectedItems[item.id] || 0}
                                      onChange={(e) => setSelectedItems({...selectedItems, [item.id]: Number(e.target.value)})}
                                      style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                       <option value={0}>0</option>
                                       {[...Array(item.quantity)].map((_, i) => (
                                           <option key={i+1} value={i+1}>{i+1}</option>
                                       ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <textarea 
                            placeholder="Reason for return..."
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                minHeight: '100px',
                                marginBottom: '16px',
                                fontFamily: 'inherit'
                            }}
                            required
                        />
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                type="button" 
                                onClick={() => { setActiveReturn(null); setSelectedItems({}); }}
                                style={{ padding: '10px 20px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn btn-primary"
                            >
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Back Link */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link href="/account" style={{ color: "var(--accent)", textDecoration: "underline" }}>
            ← Back to My Account
          </Link>
        </div>
      </section>
    </main>
  );
}

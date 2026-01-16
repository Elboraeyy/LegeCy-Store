"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { createReturnRequest } from "@/lib/actions/returns";
import { toast } from "sonner";
import styles from "./Orders.module.css";

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
    <main className={styles.ordersPage}>
      {/* Hero Section */}
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
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📦</div>
              <h2 className={styles.emptyTitle}>No orders yet</h2>
              <p className={styles.emptyText}>
                Browse our collection and discover luxury timepieces
              </p>
              <Link href="/shop" className="btn btn-primary">
                Browse Products
              </Link>
            </div>
          </Reveal>
        ) : (
            <div className={styles.ordersList}>
            {orders.map((order, idx) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              
              return (
                <Reveal key={order.id} delay={idx * 0.1}>
                  <div className={styles.orderCard}>
                    {/* Order Content */}
                    <div className={styles.orderContent}>
                      {/* Header with ID and Status */}
                      <div className={styles.orderHeader}>
                        <span className={styles.orderId}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={styles.statusBadge}
                          style={{ color: status.color, background: status.bg }}
                        >
                          {status.label}
                        </span>
                        {order.returnStatus && (
                          <span className={styles.returnBadge}>
                            Return: {order.returnStatus}
                          </span>
                        )}
                      </div>

                      {/* Meta Info */}
                      <div className={styles.orderMeta}>
                        <span>📅 {formatDate(order.createdAt)}</span>
                        <span>📦 {order.itemCount} item{order.itemCount > 1 ? 's' : ''}</span>
                      </div>

                      {/* Price */}
                      <div className={styles.orderPrice}>
                        {formatPrice(order.totalPrice)}
                      </div>

                      {/* Items Preview */}
                      <p className={styles.itemsPreview}>
                        {order.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className={styles.orderActions}>
                      {order.status === 'delivered' && !order.returnStatus && (
                        <Link
                          href={`/account/returns/${order.id}`}
                          className={styles.btnReturn}
                        >
                          Request Return
                        </Link>
                      )}
                      <Link 
                        href={`/track/${order.id}`}
                        className={styles.btnTrack}
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
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2 className={styles.modalTitle}>Request Return</h2>
              <form onSubmit={handleCreateReturn}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Items to Return:</label>
                  <div className={styles.itemSelector}>
                    {activeOrder.items.map(item => (
                      <div key={item.id} className={styles.itemRow}>
                        <span className={styles.itemName}>{item.name}</span>
                        <select
                          value={selectedItems[item.id] || 0}
                          onChange={(e) => setSelectedItems({
                            ...selectedItems,
                            [item.id]: Number(e.target.value)
                          })}
                          className={styles.qtySelect}
                        >
                          <option value={0}>0</option>
                          {[...Array(item.quantity)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reason for Return</label>
                  <textarea 
                    placeholder="Please describe why you want to return..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className={styles.textarea}
                    required
                  />
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => { setActiveReturn(null); setSelectedItems({}); }}
                    className={styles.btnCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.btnSubmit}
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

"use client";

import React from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderHistory {
  id: string;
  from: string;
  to: string;
  reason: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  status: string;
  createdAt: string;
  totalPrice: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  paymentMethod: string;
  items: OrderItem[];
  history: OrderHistory[];
}

interface Props {
  order: Order;
}

const statusConfig: Record<string, { label: string; color: string; icon: string; step: number }> = {
  pending: { label: "Pending", color: "#f59e0b", icon: "⏳", step: 1 },
  confirmed: { label: "Confirmed", color: "#3b82f6", icon: "✓", step: 2 },
  paid: { label: "Paid", color: "#10b981", icon: "💳", step: 2 },
  processing: { label: "Processing", color: "#8b5cf6", icon: "📦", step: 3 },
  shipped: { label: "Shipped", color: "#06b6d4", icon: "🚚", step: 4 },
  delivered: { label: "Delivered", color: "#22c55e", icon: "✅", step: 5 },
  cancelled: { label: "Cancelled", color: "#ef4444", icon: "❌", step: 0 },
};

const steps = [
  { key: "pending", label: "Order Placed", icon: "📋" },
  { key: "confirmed", label: "Confirmed", icon: "✓" },
  { key: "processing", label: "Processing", icon: "📦" },
  { key: "shipped", label: "On the Way", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "🏠" },
];

export default function TrackOrderClient({ order }: Props) {
  const currentStatus = statusConfig[order.status] || statusConfig.pending;
  const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isCancelled = order.status === 'cancelled';

  return (
    <main>
      <section className="shop-hero">
        <div className="container">
          <Reveal>
            <h1 className="fade-in">Track Order</h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="fade-in">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          </Reveal>
        </div>
      </section>

      <section className="container" style={{ marginBottom: "80px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          {/* Status Header */}
          <Reveal>
            <div style={{
              background: isCancelled ? "#fef2f2" : "#f0fdf4",
              borderRadius: "16px",
              padding: "32px",
              textAlign: "center",
              marginBottom: "32px",
              border: `2px solid ${isCancelled ? "#fecaca" : "#bbf7d0"}`
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                background: isCancelled ? "#fee2e2" : "#dcfce7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "36px"
              }}>
                {currentStatus.icon}
              </div>
              <h2 style={{ 
                fontSize: "28px", 
                color: currentStatus.color, 
                marginBottom: "8px" 
              }}>
                {currentStatus.label}
              </h2>
              <p style={{ color: "var(--text-muted)" }}>
                Order Date: {formatDate(order.createdAt)}
              </p>
            </div>
          </Reveal>

          {/* Progress Steps */}
          {!isCancelled && (
            <Reveal delay={0.1}>
              <div style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "32px",
                marginBottom: "32px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  position: "relative"
                }}>
                  {/* Progress Line */}
                  <div style={{
                    position: "absolute",
                    top: "24px",
                    left: "10%",
                    right: "10%",
                    height: "4px",
                    background: "#e5e7eb",
                    zIndex: 0
                  }}>
                    <div style={{
                      width: `${Math.max(0, ((currentStatus.step - 1) / (steps.length - 1)) * 100)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #12403C, #2d5a4e)",
                      transition: "width 0.5s ease"
                    }} />
                  </div>

                  {steps.map((step, idx) => {
                    const isCompleted = currentStatus.step > idx + 1;
                    const isCurrent = currentStatus.step === idx + 1;
                    
                    return (
                      <div key={step.key} style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        zIndex: 1,
                        flex: 1
                      }}>
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: isCompleted || isCurrent ? "#12403C" : "#e5e7eb",
                          color: isCompleted || isCurrent ? "#fff" : "#9ca3af",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          marginBottom: "12px",
                          transition: "all 0.3s",
                          boxShadow: isCurrent ? "0 0 0 4px rgba(26,60,52,0.2)" : "none"
                        }}>
                          {isCompleted ? "✓" : step.icon}
                        </div>
                        <span style={{
                          fontSize: "13px",
                          color: isCompleted || isCurrent ? "#12403C" : "#9ca3af",
                          fontWeight: isCurrent ? 600 : 400,
                          textAlign: "center"
                        }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          )}

          {/* Order Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            
            {/* Shipping Info */}
            <Reveal delay={0.2}>
              <div style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}>
                <h3 style={{ fontSize: "18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  📍 Shipping Information
                </h3>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
                  <p><strong>{order.customerName}</strong></p>
                  <p>{order.shippingAddress}</p>
                  <p>{order.shippingCity}</p>
                  <p style={{ marginTop: "12px" }}>
                    📞 {order.customerPhone}
                  </p>
                  <p>📧 {order.customerEmail}</p>
                </div>
              </div>
            </Reveal>

            {/* Order Summary */}
            <Reveal delay={0.3}>
              <div style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}>
                <h3 style={{ fontSize: "18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  🛒 Order Summary
                </h3>
                <div style={{ fontSize: "14px" }}>
                  {order.items.map(item => (
                    <div key={item.id} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0"
                    }}>
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0 0",
                    marginTop: "8px",
                    fontWeight: 700,
                    fontSize: "16px"
                  }}>
                    <span>Total</span>
                    <span style={{ color: "var(--accent)" }}>{formatPrice(order.totalPrice)}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Order History */}
          {order.history.length > 0 && (
            <Reveal delay={0.4}>
              <div style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                marginTop: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}>
                <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>📜 Order History</h3>
                <div>
                  {order.history.map((h, idx) => (
                    <div key={h.id} style={{
                      display: "flex",
                      gap: "16px",
                      padding: "12px 0",
                      borderBottom: idx < order.history.length - 1 ? "1px solid #f0f0f0" : "none"
                    }}>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#12403C",
                        marginTop: "6px"
                      }} />
                      <div>
                        <p style={{ fontWeight: 600, marginBottom: "4px" }}>
                          {statusConfig[h.to]?.label || h.to}
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                          {formatDate(h.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* Actions */}
          <Reveal delay={0.5}>
            <div style={{
              display: "flex",
              gap: "16px",
              marginTop: "32px",
              justifyContent: "center"
            }}>
              <Link href="/shop" className="btn btn-outline">
                Continue Shopping
              </Link>
              <Link href="/contact" className="btn btn-primary">
                Contact Us
              </Link>
            </div>
          </Reveal>

        </div>
      </section>

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

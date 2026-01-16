"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import styles from "./TrackOrder.module.css";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string | null;
  productSlug: string | null;
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
  deliveredAt: string | null;
  totalPrice: number;
  subtotal: number;
  discountAmount: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingNotes: string | null;
  paymentMethod: string;
  orderSource: string;
  pointsEarned: number;
  pointsRedeemed: number;
  couponCode: string | null;
  estimatedDelivery: string;
  items: OrderItem[];
  history: OrderHistory[];
}

interface Props {
  order: Order;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string; step: number }> = {
  pending: { label: "Order Placed", color: "#d97706", bg: "#fef3c7", icon: "📋", step: 1 },
  confirmed: { label: "Confirmed", color: "#2563eb", bg: "#dbeafe", icon: "✓", step: 2 },
  paid: { label: "Paid", color: "#059669", bg: "#d1fae5", icon: "💳", step: 2 },
  processing: { label: "Processing", color: "#7c3aed", bg: "#ede9fe", icon: "📦", step: 3 },
  shipped: { label: "On the Way", color: "#0891b2", bg: "#cffafe", icon: "🚚", step: 4 },
  delivered: { label: "Delivered", color: "#16a34a", bg: "#dcfce7", icon: "✅", step: 5 },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fee2e2", icon: "❌", step: 0 },
};

const steps = [
  { key: "pending", label: "Order Placed", icon: "📋" },
  { key: "confirmed", label: "Confirmed", icon: "✓" },
  { key: "processing", label: "Processing", icon: "📦" },
  { key: "shipped", label: "On the Way", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "🏠" },
];

export default function TrackOrderClient({ order }: Props) {
  const [copied, setCopied] = useState(false);
  const currentStatus = statusConfig[order.status] || statusConfig.pending;
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatDateTime = (d: string) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getRelativeTime = (d: string) => {
    const now = new Date();
    const date = new Date(d);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(d);
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    toast.success('Order ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getProgressWidth = () => {
    if (isCancelled) return 0;
    return Math.max(0, ((currentStatus.step - 1) / (steps.length - 1)) * 100);
  };

  const maskEmail = (email: string | null) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  };

  return (
    <main className={styles.trackPage}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroLabel}>Order Tracking</span>
          <h1 className={styles.heroTitle}>#{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className={styles.heroSubtitle}>Placed on {formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className={styles.container}>
        {/* Status Card */}
        <div className={`${styles.statusCard} ${isCancelled ? styles.cancelledCard : ''}`}>
          <div
            className={styles.statusIcon}
            style={{ background: currentStatus.bg }}
          >
            {currentStatus.icon}
          </div>
          <h2 className={styles.statusTitle} style={{ color: currentStatus.color }}>
            {currentStatus.label}
          </h2>
          <p className={styles.statusDate}>
            {isDelivered && order.deliveredAt
              ? `Delivered on ${formatDate(order.deliveredAt)}`
              : isCancelled
                ? 'This order has been cancelled'
                : `Estimated delivery: ${formatDate(order.estimatedDelivery)}`
            }
          </p>

          <div className={styles.statusMeta}>
            <div className={styles.metaItem}>
              <span>Order ID:</span>
              <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
              <button onClick={copyOrderId} className={styles.copyBtn} title="Copy order ID">
                {copied ? '✓' : '📋'}
              </button>
            </div>
            <div className={styles.metaItem}>
              <span
                className={`${styles.paymentBadge} ${order.paymentMethod === 'cod' ? styles.paymentCod : styles.paymentOnline}`}
              >
                {order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Paid Online'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        {!isCancelled && (
          <div className={styles.timelineCard}>
            <h3 className={styles.timelineTitle}>
              📍 Order Progress
            </h3>
            <div className={styles.timeline}>
              <div className={styles.timelineTrack}>
                <div
                  className={styles.timelineProgress}
                  style={{ width: `${getProgressWidth()}%` }}
                />
              </div>

              {steps.map((step, idx) => {
                const isCompleted = currentStatus.step > idx + 1;
                const isCurrent = currentStatus.step === idx + 1;

                return (
                  <div key={step.key} className={styles.timelineStep}>
                    <div
                      className={`${styles.stepDot} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''} ${!isCompleted && !isCurrent ? styles.pending : ''}`}
                    >
                      {isCompleted ? '✓' : step.icon}
                    </div>
                    <span className={`${styles.stepLabel} ${(isCompleted || isCurrent) ? styles.active : ''}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className={styles.infoGrid}>
          {/* Shipping Information */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📍</span>
              Delivery Address
            </h3>
            <div className={styles.shippingDetails}>
              <p className={styles.shippingName}>{order.customerName}</p>
              <p className={styles.shippingAddress}>
                {order.shippingAddress}
                <br />
                {order.shippingCity}
              </p>
              {order.shippingNotes && (
                <p className={styles.shippingAddress} style={{ marginTop: '8px', fontStyle: 'italic' }}>
                  📝 {order.shippingNotes}
                </p>
              )}
              <div className={styles.shippingContact}>
                <div className={styles.contactItem}>
                  📞 {order.customerPhone}
                </div>
                <div className={styles.contactItem}>
                  📧 {maskEmail(order.customerEmail)}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>🛒</span>
              Order Items
            </h3>
            <div className={styles.itemsList}>
              {order.items.map(item => (
                <div key={item.id} className={styles.orderItem}>
                  <div className={styles.itemImage}>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={60}
                        height={60}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      '⌚'
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemMeta}>Qty: {item.quantity}</p>
                  </div>
                  <span className={styles.itemPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className={styles.pricingSummary}>
              <div className={styles.priceRow}>
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className={`${styles.priceRow} ${styles.discount}`}>
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              {order.pointsRedeemed > 0 && (
                <div className={`${styles.priceRow} ${styles.discount}`}>
                  <span>Points Redeemed</span>
                  <span>-{order.pointsRedeemed} pts</span>
                </div>
              )}
              <div className={`${styles.priceRow} ${styles.total}`}>
                <span>Total</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        {order.history.length > 0 && (
          <div className={styles.card} style={{ marginBottom: '24px' }}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📜</span>
              Order Timeline
            </h3>
            <div className={styles.historyList}>
              {order.history.map((h) => (
                <div key={h.id} className={styles.historyItem}>
                  <div className={styles.historyDot} />
                  <div className={styles.historyContent}>
                    <p className={styles.historyStatus}>
                      {statusConfig[h.to]?.label || h.to}
                    </p>
                    <p className={styles.historyTime}>
                      {getRelativeTime(h.createdAt)} • {formatDateTime(h.createdAt)}
                    </p>
                    {h.reason && (
                      <p className={styles.historyTime} style={{ marginTop: '4px' }}>
                        Note: {h.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Points Earned */}
        {order.pointsEarned > 0 && !isCancelled && (
          <div className={styles.rewardsCard}>
            <div className={styles.rewardsInfo}>
              <h4>Points Earned</h4>
              <p className={styles.rewardsPoints}>+{order.pointsEarned}</p>
            </div>
            <div className={styles.rewardsIcon}>🏆</div>
          </div>
        )}

        {/* Help Section */}
        <div className={styles.helpCard}>
          <h4 className={styles.helpTitle}>Need Help?</h4>
          <div className={styles.helpActions}>
            <a
              href={`https://wa.me/201278432630?text=Hi, I need help with order %23${order.id.slice(0, 8).toUpperCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.helpBtn} ${styles.helpBtnWhatsapp}`}
            >
              💬 WhatsApp
            </a>
            <Link href="/help" className={`${styles.helpBtn} ${styles.helpBtnEmail}`}>
              ✉️ Contact Support
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/shop" className={`${styles.actionBtn} ${styles.btnOutline}`}>
            🛍️ Continue Shopping
          </Link>
          <Link href="/account/orders" className={`${styles.actionBtn} ${styles.btnPrimary}`}>
            📦 My Orders
          </Link>
        </div>
      </div>
    </main>
  );
}

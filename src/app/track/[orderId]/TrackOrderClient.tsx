"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import styles from "./TrackOrder.module.css";
import { useLanguage } from "@/context/LanguageContext";

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
  orderNumber: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  totalPrice: number;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  shippingGovernorate: string | null;
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
  isLoyaltyEnabled: boolean;
}

export default function TrackOrderClient({ order, isLoyaltyEnabled }: Props) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string; step: number }> = {
    pending: { label: t.orders.status.pending, color: "#d97706", bg: "#fef3c7", icon: "📋", step: 1 },
    confirmed: { label: t.orders.status.confirmed, color: "#2563eb", bg: "#dbeafe", icon: "✓", step: 2 },
    paid: { label: t.orders.status.paid, color: "#059669", bg: "#d1fae5", icon: "💳", step: 2 },
    processing: { label: t.orders.status.processing, color: "#7c3aed", bg: "#ede9fe", icon: "📦", step: 3 },
    shipped: { label: t.orders.status.shipped, color: "#0891b2", bg: "#cffafe", icon: "🚚", step: 4 },
    delivered: { label: t.orders.status.delivered, color: "#16a34a", bg: "#dcfce7", icon: "✅", step: 5 },
    cancelled: { label: t.orders.status.cancelled, color: "#dc2626", bg: "#fee2e2", icon: "❌", step: 0 },
  };

  const steps = [
    { key: "pending", label: t.orders.tracking.steps.placed, icon: "📋" },
    { key: "confirmed", label: t.orders.tracking.steps.confirmed, icon: "✓" },
    { key: "processing", label: t.orders.tracking.steps.processing, icon: "📦" },
    { key: "shipped", label: t.orders.tracking.steps.shipped, icon: "🚚" },
    { key: "delivered", label: t.orders.tracking.steps.delivered, icon: "🏠" },
  ];

  const currentStatus = statusConfig[order.status] || statusConfig.pending;
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(p);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatDateTime = (d: string) => new Date(d).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
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

    if (diffMinutes < 60) return t.orders.tracking.relative_time.minutes_ago.replace('{count}', diffMinutes.toString());
    if (diffHours < 24) return t.orders.tracking.relative_time.hours_ago.replace('{count}', diffHours.toString());
    if (diffDays === 1) return t.orders.tracking.relative_time.yesterday;
    if (diffDays < 7) return t.orders.tracking.relative_time.days_ago.replace('{count}', diffDays.toString());
    return formatDate(d);
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    toast.success(t.orders.tracking.id_copied);
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

  const getPaymentLabel = () => {
    if (order.paymentMethod === 'cod') return t.orders.tracking.payment_info.cod;
    if (order.paymentMethod === 'wallet') return t.orders.tracking.payment_info.wallet;
    return order.paymentMethod;
  };

  return (
    <main className={styles.trackPage} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroLabel}>{t.orders.tracking.title}</span>
          <h1 className={styles.heroTitle}>#{order.orderNumber}</h1>
          <p className={styles.heroSubtitle}>{t.orders.tracking.placed_on.replace('{date}', formatDate(order.createdAt))}</p>
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
              ? t.orders.tracking.delivered_on.replace('{date}', formatDate(order.deliveredAt))
              : isCancelled
                ? t.orders.tracking.cancelled_msg
                : t.orders.tracking.estimated_delivery.replace('{date}', formatDate(order.estimatedDelivery))
            }
          </p>

          <div className={styles.statusMeta}>
            <div className={styles.metaItem}>
              <span>{t.orders.tracking.subtitle.split('#')[0]}</span>
              <strong>#{order.orderNumber}</strong>
              <button onClick={copyOrderId} className={styles.copyBtn} title={t.orders.tracking.copy_id}>
                {copied ? '✓' : '📋'}
              </button>
            </div>
            <div className={styles.metaItem}>
              <span
                className={`${styles.paymentBadge} ${order.paymentMethod === 'cod' ? styles.paymentCod : styles.paymentOnline}`}
              >
                {order.paymentMethod === 'cod' ? '💵 ' : '💳 '}
                {getPaymentLabel()}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        {!isCancelled && (
          <div className={styles.timelineCard}>
            <h3 className={styles.timelineTitle}>
              📍 {t.orders.tracking.timeline}
            </h3>
            <div className={styles.timeline}>
              <div className={styles.timelineTrack}>
                <div
                  className={styles.timelineProgress}
                  style={{ width: `${getProgressWidth()}%`, [language === 'ar' ? 'right' : 'left']: 0 }}
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
              {t.orders.details.shipping}
            </h3>
            <div className={styles.shippingDetails}>
              <p className={styles.shippingName}>{order.customerName}</p>
              <p className={styles.shippingAddress}>
                {order.shippingAddress}
                <br />
                {order.shippingCity}{order.shippingGovernorate && `, ${order.shippingGovernorate}`}
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
              {t.orders.details.items}
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
                    <p className={styles.itemMeta}>{t.product.quantity}: {item.quantity}</p>
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
                <span>{t.orders.details.summary.subtotal}</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className={styles.priceRow}>
                <span>{t.orders.details.summary.shipping}</span>
                <span>{order.shippingCost > 0 ? formatPrice(order.shippingCost) : t.common.free}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className={`${styles.priceRow} ${styles.discount}`}>
                  <span>{t.orders.details.summary.discount} {order.couponCode && `(${order.couponCode})`}</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              {isLoyaltyEnabled && order.pointsRedeemed > 0 && (
                <div className={`${styles.priceRow} ${styles.discount}`}>
                  <span>{t.orders.details.summary.points_redeemed}</span>
                  <span>-{order.pointsRedeemed}</span>
                </div>
              )}
              <div className={`${styles.priceRow} ${styles.total}`}>
                <span>{t.orders.details.summary.total}</span>
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
              {t.orders.tracking.history.title}
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
                        {t.orders.tracking.history.note.replace('{note}', h.reason)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Points Earned */}
        {isLoyaltyEnabled && order.pointsEarned > 0 && !isCancelled && (
          <div className={styles.rewardsCard}>
            <div className={styles.rewardsInfo}>
              <h4>{t.orders.details.summary.points_earned}</h4>
              <p className={styles.rewardsPoints}>+{order.pointsEarned}</p>
            </div>
            <div className={styles.rewardsIcon}>🏆</div>
          </div>
        )}

        {/* Help Section */}
        <div className={styles.helpCard}>
          <h4 className={styles.helpTitle}>{t.orders.details.help.title}</h4>
          <div className={styles.helpActions}>
            <button
              onClick={async () => {
                const { trackGALead } = await import('@/components/GoogleAnalytics');
                const { trackMetaContact } = await import('@/components/MetaPixel');
                trackGALead('WhatsApp', `Order: ${order.orderNumber}`);
                trackMetaContact('OrderSupport');
                window.open(`https://wa.me/201515205073?text=Hi, I need help with order %23${order.id.slice(0, 8).toUpperCase()}`, '_blank');
              }}
              className={`${styles.helpBtn} ${styles.helpBtnWhatsapp}`}
            >
              💬 {t.orders.details.help.whatsapp}
            </button>
            <Link href="/help" className={`${styles.helpBtn} ${styles.helpBtnEmail}`}>
              ✉️ {t.orders.details.help.contact}
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/shop" className={`${styles.actionBtn} ${styles.btnOutline}`}>
            🛍️ {t.orders.details.actions.continue}
          </Link>
          <Link href="/account/orders" className={`${styles.actionBtn} ${styles.btnPrimary}`}>
            📦 {t.account.orders_page.title}
          </Link>
        </div>
      </div>
    </main>
  );
}

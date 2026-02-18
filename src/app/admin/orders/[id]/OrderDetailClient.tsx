'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import { Order } from '@/types/order';

import StatusUpdateControl from '@/components/admin/StatusUpdateControl';
import BackButton from '@/components/admin/BackButton';
import { useRouter } from 'next/navigation';
import {
    Package,
    Truck,
    CheckCircle2,
    Clock,
    ChevronRight,
    Printer,
    Download,
    CreditCard,
    User,
    Mail,
    Phone,
    MapPin,
    MessageCircle,
    Pencil
} from 'lucide-react';
import styles from '../OrderDetails.module.css';

interface OrderDetailClientProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    order: any; // Using any for now to match the fetchOrderDetails return type precisely
}

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language];
    const router = useRouter();
    const isRtl = language === 'ar';

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(isRtl ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    // Helper to get status color
    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (['delivered', 'paid', 'succeeded'].includes(s)) return '#166534';
        if (['cancelled', 'failed', 'payment_failed'].includes(s)) return '#991b1b';
        if (['pending', 'payment_pending'].includes(s)) return '#b76e00';
        return '#1e40af';
    };

    // Helper to get date for a specific status from history
    const getStatusDate = (targetStatus: string) => {
        // Find the most recent transition TO this status
        // History is sorted by createdAt desc in fetchOrderDetails, so finding the first one is the most recent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = order.history.find((h: any) => h.to.toLowerCase() === targetStatus.toLowerCase());
        return entry ? formatDate(entry.createdAt) : undefined;
    };

    const getWhatsAppUrl = (order: Order): string | null => {
        const phone = order.customerPhone || order.alternativePhone;
        if (!phone || (typeof phone === 'string' && !phone.trim())) {
            return null;
        }

        try {
            // Clean phone number (remove spaces, dashes, etc.)
            const cleanPhone = String(phone).replace(/\D/g, '');
            
            if (!cleanPhone || cleanPhone.length < 10) {
                return null;
            }

            // If phone starts with 0, replace with country code
            let phoneNumber: string;
            if (cleanPhone.startsWith('0')) {
                phoneNumber = `20${cleanPhone.substring(1)}`;
            } else if (cleanPhone.startsWith('20')) {
                phoneNumber = cleanPhone;
            } else {
                phoneNumber = `20${cleanPhone}`;
            }

            // Validate phone number format (should be 12-13 digits for Egypt)
            if (phoneNumber.length < 12 || phoneNumber.length > 13) {
                return null;
            }

            const isCod = order.paymentMethod === 'cod';
            const customerName = order.firstName || order.user?.name || (isRtl ? 'عميلنا العزيز' : 'Dear Customer');
            const orderId = order.orderNumber || order.id.slice(0, 8).toUpperCase();
            const total = formatCurrency(order.totalPrice || 0);
            const address = `${order.shippingAddress || ''}, ${order.shippingCity || ''}`;

            let message = '';

            if (isRtl) {
                if (isCod) {
                    message = `أهلاً بك يا ${customerName}، 👋\n\nمعك خدمة عملاء ليجاسي ستور.\nبنأكد مع حضرتك تفاصيل الطلب رقم: *#${orderId}*\n\n💰 الإجمالي المطلوب: *${total}*\n📍 العنوان: ${address}\n\nيرجى تأكيد البيانات لنقوم بشحن الطلب في أسرع وقت. 🚀\nشكراً لتسوقك معنا!`;
                } else {
                    message = `أهلاً بك يا ${customerName}، 👋\n\nمعك خدمة عملاء ليجاسي ستور.\nتم تأكيد الدفع للطلب رقم: *#${orderId}* بنجاح! ✅\n\nجاري تجهيز طلبك حالياً للشحن إلى:\n📍 ${address}\n\nشكراً لثقتك في ليجاسي ستور! ❤️`;
                }
            } else {
                if (isCod) {
                    message = `Hello ${customerName}, 👋\n\nThis is Legacy Store Customer Support.\nWe are confirming your order details for Order: *#${orderId}*\n\n💰 Total Due: *${total}*\n📍 Address: ${address}\n\nPlease confirm so we can ship your order ASAP. 🚀\nThanks for shopping with us!`;
                } else {
                    message = `Hello ${customerName}, 👋\n\nThis is Legacy Store Customer Support.\nPayment received for Order: *#${orderId}* ✅\n\nWe are preparing your order for shipping to:\n📍 ${address}\n\nThanks for choosing Legacy Store! ❤️`;
                }
            }

            return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        } catch (error) {
            console.error('[WhatsApp] Error generating URL:', error);
            return null;
        }
    };

    return (
        <div className={styles.container} dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Top Navigation Bar */}
            <div className={styles.navBar}>
                <div className={styles.navLeft}>
                    <BackButton
                        fallbackHref="/admin/orders"
                        label={`${isRtl ? '→' : '←'} ${t.orders.details_page.back}`}
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--admin-text-muted)', fontSize: '14px', cursor: 'pointer' }}
                    />
                    <span className={styles.separator}>|</span>
                    <div className={styles.breadcrumb}>
                        <span>{t.orders.title}</span>
                        <ChevronRight size={14} className={isRtl ? styles.rotate180 : ''} />
                        <span className={styles.activeBreadcrumb}>#{order.orderNumber}</span>
                    </div>
                </div>
                <div className={styles.navActions}>
                    <button className="admin-btn admin-btn-outline" onClick={() => router.push(`/admin/orders/${order.id}/edit`)}>
                        <Pencil size={16} />
                        <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                    </button>
                    <button className="admin-btn admin-btn-outline">
                        <Printer size={16} />
                        <span>{isRtl ? 'طباعة' : 'Print'}</span>
                    </button>
                    <button className="admin-btn admin-btn-primary">
                        <Download size={16} />
                        <span>{t.orders.details_page.download_invoice}</span>
                    </button>
                </div>
            </div>

            {/* Header / Title Section */}
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.orderTitle}>
                        {t.orders.details.title} <span className={styles.orderId}>#{order.orderNumber}</span>
                    </h1>
                    <div className={styles.metaInfo}>
                        <Clock size={14} />
                        <span>{formatDate(order.createdAt)}</span>
                        <span className={styles.dot}>•</span>
                        <span>{order.items.length} {t.orders.details_page.item}s</span>
                    </div>
                </div>
                <div className={styles.statusGroup}>
                    <StatusUpdateControl
                        orderId={order.id}
                        currentStatus={order.status}
                        paymentMethod={order.paymentMethod}
                    />
                </div>
            </div>

            {/* Status Timeline / Progress Bar */}
            <div className={styles.timelineCard}>
                <div className={styles.timelineTracker}>
                    <TimelineItem
                        icon={<CheckCircle2 />}
                        label={isRtl ? 'تم الاستلام' : 'Received'}
                        completed={true}
                        date={formatDate(order.createdAt)}
                    />
                    {order.paymentMethod !== 'cod' && (
                        <TimelineItem
                            icon={<CreditCard />}
                            label={t.orders.status.paid}
                            active={order.status.toLowerCase() === 'paid' || order.status.toLowerCase() === 'pending'}
                            completed={['paid', 'pending', 'confirmed', 'preparing', 'shipped', 'delivered'].includes(order.status.toLowerCase())}
                            date={getStatusDate('paid') || getStatusDate('payment_pending')}
                        />
                    )}
                    <TimelineItem
                        icon={<CheckCircle2 />}
                        label={t.orders.status.confirmed}
                        active={order.status.toLowerCase() === 'confirmed'}
                        completed={['confirmed', 'preparing', 'shipped', 'delivered'].includes(order.status.toLowerCase())}
                        date={getStatusDate('confirmed')}
                    />
                    <TimelineItem
                        icon={<Package />}
                        label={t.orders.status.preparing}
                        active={order.status.toLowerCase() === 'preparing'}
                        completed={['preparing', 'shipped', 'delivered'].includes(order.status.toLowerCase())}
                        date={getStatusDate('preparing')}
                    />
                    <TimelineItem
                        icon={<Truck />}
                        label={t.orders.status.shipped}
                        active={order.status.toLowerCase() === 'shipped'}
                        completed={['shipped', 'delivered'].includes(order.status.toLowerCase())}
                        date={getStatusDate('shipped')}
                    />
                    <TimelineItem
                        icon={<CheckCircle2 />}
                        label={t.orders.status.delivered}
                        active={order.status.toLowerCase() === 'delivered'}
                        completed={order.status.toLowerCase() === 'delivered'}
                        date={getStatusDate('delivered')}
                    />
                </div>
            </div>

            <div className={styles.mainGrid}>
                {/* Left Side: Order Items & Summary */}
                <div className={styles.leftColumn}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t.orders.details_page.line_items}</h2>
                            <span className={styles.badge}>{order.items.length}</span>
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.itemsTable}>
                                <thead>
                                    <tr>
                                        <th>{t.orders.details_page.item}</th>
                                        <th>{t.orders.details_page.qty}</th>
                                        <th>{t.orders.details_page.price}</th>
                                        <th className={styles.textEnd}>{t.orders.details.total}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {order.items.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className={styles.itemCell}>
                                                <div className={styles.itemImgPlaceholder}>
                                                    <Package size={20} />
                                                </div>
                                                <div className={styles.itemInfo}>
                                                    <div className={styles.itemName}>{item.name}</div>
                                                    <div className={styles.itemSku}>{item.variant?.sku || 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.price)}</td>
                                            <td className={styles.textEnd}>{formatCurrency(item.price * item.quantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className={styles.summaryFooter}>
                            <div className={styles.summaryGrid}>
                                <div className={styles.summaryRow}>
                                    <span>{t.orders.details_page.subtotal}</span>
                                    <span>{formatCurrency(order.totalPrice - order.shippingCost)}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>{t.orders.details_page.shipping}</span>
                                    <span>{order.shippingCost > 0 ? formatCurrency(order.shippingCost) : t.orders.details_page.free}</span>
                                </div>
                                <div className={`${styles.summaryRow} ${styles.grandTotal}`}>
                                    <span>{t.orders.details.total}</span>
                                    <span>{formatCurrency(order.totalPrice)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / History Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t.orders.details_page.timeline}</h2>
                        </div>
                        <div className={styles.historyList}>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {order.history.map((h: any) => (
                                <div key={h.id} className={styles.historyItem}>
                                    <div className={styles.historyDot}></div>
                                    <div className={styles.historyContent}>
                                        <div className={styles.historyStatus}>{h.to}</div>
                                        <div className={styles.historyMeta}>
                                            <span>{h.actor || 'System'}</span>
                                            <span className={styles.dot}>•</span>
                                            <span>{formatDate(h.createdAt)}</span>
                                        </div>
                                        {h.reason && <div className={styles.historyReason}>&quot;{h.reason}&quot;</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Customer & Shipping Details */}
                <div className={styles.rightColumn}>
                    {/* Customer Info Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t.orders.details.customer}</h2>
                        </div>
                        <div className={styles.customerProfile}>
                            <div className={styles.avatar}>
                                {order.user?.name?.[0] || <User size={20} />}
                            </div>
                            <div className={styles.customerDetails}>
                                <div className={styles.customerName}>
                                    {order.firstName ? `${order.firstName} ${order.lastName || ''}` : (order.customerName || order.user?.name || t.orders.details.guest)}
                                </div>
                                <div className={styles.customerSince}>
                                    {isRtl ? 'عميل منذ ' : 'Customer since '}
                                    {order.user ? new Date(order.user.createdAt).getFullYear() : 'N/A'}
                                </div>
                            </div>
                        </div>
                        <div className={styles.contactList}>
                            <div className={styles.contactItem}>
                                <div className={styles.contactIcon}><Mail size={16} /></div>
                                <div className={styles.contactText}>{order.customerEmail || order.user?.email || 'N/A'}</div>
                            </div>
                            <div className={styles.contactItem}>
                                <div className={styles.contactIcon}><Phone size={16} /></div>
                                <div className={styles.contactText}>
                                    {order.customerPhone || 'N/A'}
                                    {order.alternativePhone && (
                                        <div style={{ fontSize: '0.85em', opacity: 0.8, marginTop: '2px', color: 'var(--admin-text-muted)' }}>
                                            {isRtl ? 'احتياطي: ' : 'Backup: '} {order.alternativePhone}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* WhatsApp Button - Moved inside contactList padding area for better flow */}
                            <div style={{ marginTop: '16px' }}>
                                {(() => {
                                    const phone = order.customerPhone || order.alternativePhone;
                                    const hasPhone = phone && phone.trim && phone.trim().length > 0;
                                    const whatsappUrl = hasPhone ? getWhatsAppUrl(order) : null;
                                    
                                    if (hasPhone && whatsappUrl && whatsappUrl !== '#') {
                                        return (
                                            <a
                                                href={whatsappUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.whatsappBtn}
                                            >
                                                <MessageCircle size={18} />
                                                <span>
                                                    {isRtl ? 'تأكيد الطلب عبر واتساب' : 'Confirm Order via WhatsApp'}
                                                    {order.alternativePhone && !order.customerPhone && ' (Alt)'}
                                                </span>
                                            </a>
                                        );
                                    } else {
                                        return (
                                            <div className={styles.whatsappDisabled}>
                                                <MessageCircle size={18} />
                                                <span>{isRtl ? 'لا يوجد رقم هاتف' : 'No Phone Number'}</span>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t.orders.details_page.shipping_delivery}</h2>
                            <MapPin size={18} className={styles.titleIcon} />
                        </div>
                        <div className={styles.addressDisplay}>
                            <div className={styles.addressLabel}>{t.orders.details_page.address}</div>
                            <div className={styles.addressValue}>
                                {order.shippingAddress}
                                <br />
                                {order.shippingCity}, {order.shippingGovernorate}
                            </div>
                        </div>
                        {order.shippingNotes && (
                            <div className={styles.notesBox}>
                                <div className={styles.notesLabel}>{t.orders.details_page.notes}</div>
                                <div className={styles.notesValue}>{order.shippingNotes}</div>
                            </div>
                        )}
                    </div>

                    {/* Payment Info Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t.orders.details_page.payment}</h2>
                            <CreditCard size={18} className={styles.titleIcon} />
                        </div>
                        <div className={styles.paymentStatus}>
                            <div className={styles.paymentMethod}>
                                {order.paymentMethod?.toUpperCase() || 'COD'}
                            </div>
                            <div className={styles.paymentStatusBadge} style={{
                                backgroundColor: getStatusColor(order.paymentIntent?.status || 'pending') + '15',
                                color: getStatusColor(order.paymentIntent?.status || 'pending')
                            }}>
                                {order.paymentIntent?.status || (isRtl ? 'بانتظار الدفع' : 'Payment Pending')}
                            </div>
                        </div>
                        {order.paymentIntent?.providerReference && (
                            <div className={styles.refCode}>
                                <span>{t.orders.details_page.verification_details}:</span>
                                <code>{order.paymentIntent.providerReference}</code>
                            </div>
                        )}
                    </div>

                    {/* Manual Payment Details (Wallet / InstaPay) */}
                    {(order.paymentPhoneNumber || order.paymentRef) && (
                        <div className={styles.card} style={{ marginTop: '16px', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                            <div className={styles.cardHeader} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '12px' }}>
                                <h3 className={styles.cardTitle} style={{ fontSize: '14px', color: '#374151' }}>
                                    {t.orders.details_page.payment_details || (isRtl ? 'تفاصيل الدفع اليدوي' : 'Manual Payment Details')}
                                </h3>
                            </div>
                            <div className={styles.detailGrid}>
                                {order.paymentPhoneNumber && (
                                    <div className={styles.detailRow} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#6b7280', fontSize: '13px' }}>{isRtl ? 'رقم المحفظة/الهاتف:' : 'Wallet/Phone:'}</span>
                                        <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{order.paymentPhoneNumber}</span>
                                    </div>
                                )}
                                {order.paymentRef && (
                                    <div className={styles.detailRow} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280', fontSize: '13px' }}>{isRtl ? 'رقم العملية:' : 'Reference ID:'}</span>
                                        <span style={{ fontWeight: 500, fontFamily: 'monospace', background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', color: '#3730a3' }}>
                                            {order.paymentRef}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TimelineItem({ icon, label, completed, active, date }: any) {
    return (
        <div className={`${styles.timelineItem} ${completed ? styles.completed : ''} ${active ? styles.active : ''}`}>
            <div className={styles.timelineIcon}>{icon}</div>
            <div className={styles.timelineLabel}>{label}</div>
            {date && <div className={styles.timelineDate}>{date}</div>}
            <div className={styles.timelineConnector}></div>
        </div>
    );
}

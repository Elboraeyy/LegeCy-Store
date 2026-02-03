'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../Account.module.css';

interface LoyaltyData {
    points: number;
    userName: string;
    potentialDiscount: number;
    canGenerateCoupon: boolean;
    config: {
        pointValue: number;
        minCouponValue: number;
        minPointsForCoupon: number;
        couponValidityDays: number;
    };
    transactions: Array<{
        id: string;
        type: string;
        points: number;
        balance: number;
        description: string | null;
        createdAt: string;
    }>;
    coupons: Array<{
        id: string;
        code: string;
        discountValue: number;
        isUsed: boolean;
        isActive: boolean;
        expiresAt: string | null;
        createdAt: string;
    }>;
}

export default function LoyaltyClient({ initialData }: { initialData: LoyaltyData }) {
    const { direction, t, language } = useLanguage();
    const lp = t.account.loyalty_page;
    const [data] = useState(initialData);
    const [pointsToConvert, setPointsToConvert] = useState('');
    const [converting, setConverting] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleConvert = async () => {
        const points = parseInt(pointsToConvert);
        if (!points || points < data.config.minPointsForCoupon) {
            toast.error(lp.min_points_error.replace('{points}', data.config.minPointsForCoupon.toString()));
            return;
        }
        if (points > data.points) {
            toast.error(lp.balance_error);
            return;
        }

        setConverting(true);
        try {
            const { generateLoyaltyCouponAction } = await import('./actions');
            const result = await generateLoyaltyCouponAction(points);

            if (result.success && result.couponCode) {
                toast.success(lp.coupon_created
                    .replace('{code}', result.couponCode)
                    .replace('{amount}', result.discount?.toString() || ''));
                window.location.reload();
            } else {
                toast.error(result.error || lp.error);
            }
        } catch (error) {
            console.error(error);
            toast.error(lp.error);
        } finally {
            setConverting(false);
        }
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.success(lp.copied);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const discountFromPoints = parseInt(pointsToConvert || '0') * data.config.pointValue;
    const dateLocale = language === 'ar' ? 'ar-EG' : 'en-US';
    const arrow = language === 'ar' ? '←' : '→';

    return (
        <div className={styles.accountContainer} dir={direction}>
            {/* Back Button */}
            <Link href="/account" className={styles.backLink}>
                {arrow} {lp.back_link}
            </Link>

            {/* Header */}
            <div className={styles.loyaltyHeader}>
                <div className={styles.loyaltyIcon}>⭐</div>
                <h1 className={styles.loyaltyTitle}>{lp.title}</h1>
                <p className={styles.loyaltySubtitle}>{lp.subtitle}</p>
            </div>

            {/* Points Balance Card */}
            <div className={styles.loyaltyBalanceCard}>
                <div className={styles.balanceMain}>
                    <span className={styles.balanceLabel}>{lp.balance_label}</span>
                    <span className={styles.balanceValue}>{data.points.toLocaleString()}</span>
                    <span className={styles.balanceUnit}>{lp.points_unit}</span>
                </div>
                <div className={styles.balanceEquivalent}>
                    {lp.equivalent.replace('{amount}', data.potentialDiscount.toLocaleString())}
                </div>
            </div>

            {/* Conversion Section */}
            <div className={styles.loyaltyConvertCard}>
                <h2 className={styles.sectionTitle}>{lp.convert_title}</h2>

                <div className={styles.conversionInfo}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>{lp.point_rate}</span>
                        <span className={styles.infoValue}>{lp.point_rate_value}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>{lp.min_coupon}</span>
                        <span className={styles.infoValue}>
                            {lp.min_coupon_value
                                .replace('{points}', data.config.minPointsForCoupon.toString())
                                .replace('{amount}', data.config.minCouponValue.toString())}
                        </span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>{lp.validity}</span>
                        <span className={styles.infoValue}>
                            {lp.validity_value.replace('{days}', data.config.couponValidityDays.toString())}
                        </span>
                    </div>
                </div>

                {data.canGenerateCoupon ? (
                    <div className={styles.convertForm}>
                        <div className={styles.inputGroup}>
                            <label>{lp.points_input_label}</label>
                            <input
                                type="number"
                                value={pointsToConvert}
                                onChange={(e) => setPointsToConvert(e.target.value)}
                                placeholder={lp.points_input_placeholder.replace('{min}', data.config.minPointsForCoupon.toString())}
                                max={data.points}
                                min={data.config.minPointsForCoupon}
                                className={styles.input}
                            />
                            {discountFromPoints > 0 && (
                                <span className={styles.discountPreview}>
                                    {lp.discount_preview.replace('{amount}', discountFromPoints.toLocaleString())}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleConvert}
                            disabled={converting || !pointsToConvert || parseInt(pointsToConvert) < data.config.minPointsForCoupon}
                            className={styles.convertBtn}
                        >
                            {converting ? lp.converting : lp.convert_btn}
                        </button>
                        <button
                            type="button"
                            onClick={() => setPointsToConvert(data.points.toString())}
                            className={styles.useAllBtn}
                        >
                            {lp.use_all_btn.replace('{points}', data.points.toString())}
                        </button>
                    </div>
                ) : (
                    <div className={styles.notEnoughPoints}>
                        <span className={styles.warningIcon}>⚠️</span>
                        <p>{lp.not_enough_desc.replace('{points}', (data.config.minPointsForCoupon - data.points).toString())}</p>
                        <span className={styles.hint}>{lp.not_enough_hint}</span>
                    </div>
                )}
            </div>

            {/* My Coupons Section */}
            {data.coupons.length > 0 && (
                <div className={styles.loyaltyCouponsCard}>
                    <h2 className={styles.sectionTitle}>{lp.coupons_title}</h2>

                    <div className={styles.couponsList}>
                        {data.coupons.map(coupon => {
                            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                            const status = coupon.isUsed ? 'used' : isExpired ? 'expired' : 'active';

                            return (
                                <div key={coupon.id} className={`${styles.couponItem} ${styles[`coupon_${status}`]}`}>
                                    <div className={styles.couponMain}>
                                        <span className={styles.couponCode}>{coupon.code}</span>
                                        <span className={styles.couponValue}>
                                            {lp.coupon_discount.replace('{amount}', coupon.discountValue.toString())}
                                        </span>
                                    </div>
                                    <div className={styles.couponMeta}>
                                        {status === 'active' && coupon.expiresAt && (
                                            <span>{lp.expires.replace('{date}', new Date(coupon.expiresAt).toLocaleDateString(dateLocale))}</span>
                                        )}
                                        {status === 'used' && <span className={styles.usedBadge}>{lp.used_badge}</span>}
                                        {status === 'expired' && <span className={styles.expiredBadge}>{lp.expired_badge}</span>}
                                    </div>
                                    {status === 'active' && (
                                        <button
                                            onClick={() => handleCopy(coupon.code)}
                                            className={styles.copyBtn}
                                        >
                                            {copiedCode === coupon.code ? lp.copied : lp.copy_btn}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Transaction History */}
            {data.transactions.length > 0 && (
                <div className={styles.loyaltyHistoryCard}>
                    <h2 className={styles.sectionTitle}>{lp.history_title}</h2>

                    <div className={styles.historyList}>
                        {data.transactions.map(tx => (
                            <div key={tx.id} className={styles.historyItem}>
                                <div className={styles.historyMain}>
                                    <span className={`${styles.historyType} ${styles[`type_${tx.type.toLowerCase()}`]}`}>
                                        {tx.type === 'EARN' ? '➕' : tx.type === 'REDEEM' ? '🎫' : '🔄'}
                                    </span>
                                    <span className={styles.historyDesc}>
                                        {tx.description || (tx.type === 'EARN' ? lp.earn_desc : lp.redeem_desc)}
                                    </span>
                                </div>
                                <div className={styles.historyPoints}>
                                    <span className={tx.points > 0 ? styles.positive : styles.negative}>
                                        {tx.points > 0 ? '+' : ''}{tx.points}
                                    </span>
                                    <span className={styles.historyDate}>
                                        {new Date(tx.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* How it works */}
            <div className={styles.loyaltyHowItWorks}>
                <h2 className={styles.sectionTitle}>{lp.how_title}</h2>
                <div className={styles.stepsGrid}>
                    <div className={styles.step}>
                        <span className={styles.stepIcon}>🛒</span>
                        <span className={styles.stepText}>{lp.step_order}</span>
                    </div>
                    <div className={styles.stepArrow}>{arrow}</div>
                    <div className={styles.step}>
                        <span className={styles.stepIcon}>⭐</span>
                        <span className={styles.stepText}>{lp.step_earn}</span>
                    </div>
                    <div className={styles.stepArrow}>{arrow}</div>
                    <div className={styles.step}>
                        <span className={styles.stepIcon}>🎫</span>
                        <span className={styles.stepText}>{lp.step_convert}</span>
                    </div>
                    <div className={styles.stepArrow}>{arrow}</div>
                    <div className={styles.step}>
                        <span className={styles.stepIcon}>💰</span>
                        <span className={styles.stepText}>{lp.step_save}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

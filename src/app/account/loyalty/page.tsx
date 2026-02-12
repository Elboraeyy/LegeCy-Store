// Server Component

import { validateCustomerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getLoyaltyPageData, getLoyaltySettings } from '@/lib/services/loyaltyService';
import LoyaltyClient from './LoyaltyClient';

export default async function LoyaltyPage() {
    const session = await validateCustomerSession();

    if (!session || !session.user) {
        redirect('/login?redirect=/account/loyalty');
    }

    const [data, loyaltySettings] = await Promise.all([
        getLoyaltyPageData(session.user.id),
        getLoyaltySettings()
    ]);

    if (!data || !loyaltySettings.enabled) {
        redirect('/account');
    }

    return (
        <LoyaltyClient
            initialData={{
                points: data.user.points,
                userName: data.user.name || 'عميل',
                potentialDiscount: data.potentialDiscount,
                canGenerateCoupon: data.canGenerateCoupon,
                config: data.config,
                transactions: data.transactions.map(t => ({
                    id: t.id,
                    type: t.type,
                    points: t.points,
                    balance: t.balance,
                    description: t.description,
                    createdAt: t.createdAt.toISOString()
                })),
                coupons: data.coupons.map(c => ({
                    id: c.id,
                    code: c.code,
                    discountValue: Number(c.discountValue),
                    isUsed: c.currentUsage >= (c.usageLimit || 1),
                    isActive: c.isActive,
                    expiresAt: c.endDate?.toISOString() || null,
                    createdAt: c.createdAt.toISOString()
                }))
            }}
        />
    );
}

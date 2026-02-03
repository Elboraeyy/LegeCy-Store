'use server';

import prisma from '@/lib/prisma';

// ==========================================
// Loyalty Points Configuration
// ==========================================

// ==========================================
// Loyalty Points Configuration
// ==========================================

const DEFAULT_CONFIG = {
    enabled: true,
    pointsPerEgp: 0.1,        // 1 point per 10 EGP
    pointValue: 0.1,          // 1 point = 0.1 EGP
    minRedeemPoints: 1000,    // Minimum points to redeem
    minOrderTotal: 0,
    couponValidity: 30,       // Days
};

/**
 * Get current loyalty settings from DB or return defaults
 */
export async function getLoyaltySettings() {
    try {
        let settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            // Create default settings if not exists
            settings = await prisma.loyaltySettings.create({
                data: { id: 'default', ...DEFAULT_CONFIG }
            });
        }

        return settings;
    } catch (error) {
        console.error('Error fetching loyalty settings:', error);
        return { id: 'default', ...DEFAULT_CONFIG, updatedAt: new Date() };
    }
}

/**
 * Update loyalty settings
 */
export async function updateLoyaltySettings(data: Partial<typeof DEFAULT_CONFIG>) {
    try {
        const settings = await prisma.loyaltySettings.upsert({
            where: { id: 'default' },
            create: { id: 'default', ...DEFAULT_CONFIG, ...data },
            update: data
        });
        return { success: true, settings };
    } catch (error) {
        console.error('Error updating loyalty settings:', error);
        return { success: false, error: 'Failed to update settings' };
    }
}

// ==========================================
// Core Loyalty Functions
// ==========================================

/**
 * Get user's current points balance
 */
export async function getPointsBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true }
    });
    return user?.points || 0;
}

/**
 * Get user's loyalty transaction history
 */
export async function getPointsHistory(userId: string, limit = 20) {
    return prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            order: {
                select: {
                    id: true,
                    totalPrice: true,
                    status: true,
                    createdAt: true
                }
            }
        }
    });
}

/**
 * Award points to user (called when order is delivered)
 */
export async function awardPoints(params: {
    userId: string;
    orderId: string;
    orderTotal: number;
}): Promise<{ success: boolean; pointsAwarded: number; newBalance: number }> {
    const { userId, orderId, orderTotal } = params;

    const settings = await getLoyaltySettings();

    if (!settings.enabled) {
        return { success: false, pointsAwarded: 0, newBalance: await getPointsBalance(userId) };
    }

    // Calculate points to award
    const pointsToAward = Math.floor(orderTotal * settings.pointsPerEgp);

    if (pointsToAward <= 0) {
        return { success: true, pointsAwarded: 0, newBalance: await getPointsBalance(userId) };
    }

    // Check if points already awarded for this order
    const existingTransaction = await prisma.loyaltyTransaction.findFirst({
        where: {
            orderId,
            type: 'EARN'
        }
    });

    if (existingTransaction) {
        // Points already awarded
        return { success: true, pointsAwarded: 0, newBalance: await getPointsBalance(userId) };
    }

    // Award points in a transaction
    const result = await prisma.$transaction(async (tx) => {
        // Get current balance
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { points: true }
        });

        const currentBalance = user?.points || 0;
        const newBalance = currentBalance + pointsToAward;

        // Update user points
        await tx.user.update({
            where: { id: userId },
            data: { points: newBalance }
        });

        // Create transaction record
        await tx.loyaltyTransaction.create({
            data: {
                userId,
                orderId,
                type: 'EARN',
                points: pointsToAward,
                balance: newBalance,
                description: `نقاط من الطلب #${orderId.slice(-6).toUpperCase()}`
            }
        });

        // Update order record
        await tx.order.update({
            where: { id: orderId },
            data: { pointsEarned: pointsToAward }
        });

        return { pointsAwarded: pointsToAward, newBalance };
    });

    return { success: true, ...result };
}

/**
 * Redeem points for discount at checkout
 */
export async function redeemPoints(params: {
    userId: string;
    orderId: string;
    pointsToRedeem: number;
}): Promise<{ success: boolean; discount: number; error?: string }> {
    const { userId, orderId, pointsToRedeem } = params;

    const settings = await getLoyaltySettings();
    if (!settings.enabled) {
        return { success: false, discount: 0, error: 'Loyalty system is disabled' };
    }

    // Validate minimum points
    if (pointsToRedeem < settings.minRedeemPoints) {
        return {
            success: false,
            discount: 0,
            error: `الحد الأدنى للاستبدال هو ${settings.minRedeemPoints} نقطة`
        };
    }

    // Get current balance
    const currentBalance = await getPointsBalance(userId);

    if (pointsToRedeem > currentBalance) {
        return {
            success: false,
            discount: 0,
            error: 'رصيد النقاط غير كافي'
        };
    }

    // Calculate discount value
    const discountValue = pointsToRedeem * settings.pointValue;
    const newBalance = currentBalance - pointsToRedeem;

    // Process redemption in a transaction
    await prisma.$transaction(async (tx) => {
        // Update user points
        await tx.user.update({
            where: { id: userId },
            data: { points: newBalance }
        });

        // Create transaction record
        await tx.loyaltyTransaction.create({
            data: {
                userId,
                orderId,
                type: 'REDEEM',
                points: -pointsToRedeem, // Negative for redemption
                balance: newBalance,
                description: `استبدال نقاط في الطلب #${orderId.slice(-6).toUpperCase()}`
            }
        });

        // Update order record
        await tx.order.update({
            where: { id: orderId },
            data: { pointsRedeemed: pointsToRedeem }
        });
    });

    return { success: true, discount: discountValue };
}

/**
 * Refund redeemed points (when order is cancelled/refunded)
 */
export async function refundRedeemedPoints(params: {
    userId: string;
    orderId: string;
}): Promise<{ success: boolean; pointsRefunded: number }> {
    const { userId, orderId } = params;

    // Find redemption transaction for this order
    const redemptionTx = await prisma.loyaltyTransaction.findFirst({
        where: {
            orderId,
            type: 'REDEEM'
        }
    });

    if (!redemptionTx) {
        // No points were redeemed for this order
        return { success: true, pointsRefunded: 0 };
    }

    // Check if already refunded
    const existingRefund = await prisma.loyaltyTransaction.findFirst({
        where: {
            orderId,
            type: 'ADJUST',
            description: { contains: 'استرداد' }
        }
    });

    if (existingRefund) {
        return { success: true, pointsRefunded: 0 };
    }

    const pointsToRefund = Math.abs(redemptionTx.points);

    // Process refund
    await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { points: true }
        });

        const currentBalance = user?.points || 0;
        const newBalance = currentBalance + pointsToRefund;

        await tx.user.update({
            where: { id: userId },
            data: { points: newBalance }
        });

        await tx.loyaltyTransaction.create({
            data: {
                userId,
                orderId,
                type: 'ADJUST',
                points: pointsToRefund,
                balance: newBalance,
                description: `استرداد نقاط من الطلب الملغي #${orderId.slice(-6).toUpperCase()}`
            }
        });
    });

    return { success: true, pointsRefunded: pointsToRefund };
}



/**
 * Get loyalty statistics for admin dashboard
 */
export async function getLoyaltyStats() {
    const [
        totalPointsInCirculation,
        totalPointsRedeemedThisMonth,
        activeLoyaltyMembers,
        recentTransactions,
        settings
    ] = await Promise.all([
        // Total points in circulation
        prisma.user.aggregate({
            _sum: { points: true }
        }).then(r => r._sum.points || 0),

        // Points redeemed this month
        prisma.loyaltyTransaction.aggregate({
            where: {
                type: 'REDEEM',
                createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            },
            _sum: { points: true }
        }).then(r => Math.abs(r._sum.points || 0)),

        // Users with at least 1 point
        prisma.user.count({
            where: { points: { gt: 0 } }
        }),

        // Recent transactions
        prisma.loyaltyTransaction.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: { select: { name: true, email: true } },
                order: { select: { id: true, totalPrice: true } }
            }
        }),
        getLoyaltySettings()
    ]);

    // Serialize Decimal to number for client components
    const formattedTransactions = recentTransactions.map(t => ({
        ...t,
        order: t.order ? { ...t.order, totalPrice: Number(t.order.totalPrice) } : null
    }));

    return {
        totalPointsInCirculation,
        totalPointsRedeemedThisMonth,
        activeLoyaltyMembers,
        recentTransactions: formattedTransactions,
        config: settings
    };
}

/**
 * Calculate potential points for an order
 */
export async function calculatePointsForOrder(orderTotal: number): Promise<number> {
    const settings = await getLoyaltySettings();
    if (!settings.enabled) return 0;
    return Math.floor(orderTotal * settings.pointsPerEgp);
}

/**
 * Calculate discount value for points
 */
export async function calculatePointsValue(points: number): Promise<number> {
    const settings = await getLoyaltySettings();
    return points * settings.pointValue;
}

/**
 * Get loyalty configuration
 */
export async function getLoyaltyConfig() {
    return getLoyaltySettings();
}

/**
 * Search users for admin management
 */
export async function searchUsersForLoyalty(query: string, limit = 20) {
    return prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query } }
            ]
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            points: true,
            createdAt: true,
            _count: {
                select: { orders: true }
            }
        },
        take: limit,
        orderBy: { points: 'desc' }
    });
}

/**
 * Get user details with loyalty info for admin
 */
export async function getUserLoyaltyDetails(userId: string) {
    const [user, transactions] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                points: true,
                createdAt: true,
                _count: {
                    select: { orders: true }
                }
            }
        }),
        prisma.loyaltyTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                order: {
                    select: { id: true, totalPrice: true, status: true }
                }
            }
        }),

    ]);

    if (!user) return null;

    const totalEarned = transactions
        .filter(t => t.points > 0)
        .reduce((sum, t) => sum + t.points, 0);

    const totalRedeemed = transactions
        .filter(t => t.points < 0)
        .reduce((sum, t) => sum + Math.abs(t.points), 0);

    return {
        ...user,
        totalEarned,
        totalRedeemed,
        transactions
    };
}

// ==========================================
// Coupon Generation from Points
// ==========================================



/**
 * Generate a discount coupon from loyalty points
 */
export async function generateLoyaltyCoupon(params: {
    userId: string;
    pointsToConvert: number;
}): Promise<{ success: boolean; couponCode?: string; discount?: number; error?: string }> {
    const { userId, pointsToConvert } = params;

    // Calculate discount value (10 points = 1 EGP)
    const settings = await getLoyaltySettings();

    if (!settings.enabled) {
        return { success: false, error: 'Loyalty system is disabled' };
    }

    // Calculate discount value
    const discountValue = Math.floor(pointsToConvert * settings.pointValue);

    const MIN_COUPON_VALUE = 100; // Keep minimum hardcoded or move to settings

    // Validate minimum discount
    if (discountValue < MIN_COUPON_VALUE) {
        return {
            success: false,
            error: `Minimum discount value is ${MIN_COUPON_VALUE} EGP (${MIN_COUPON_VALUE / settings.pointValue} points)`
        };
    }

    // Check current balance
    const currentBalance = await getPointsBalance(userId);
    if (pointsToConvert > currentBalance) {
        return {
            success: false,
            error: 'Insufficient points balance'
        };
    }

    // Get user info for coupon code generation
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
    });

    if (!user) {
        return { success: false, error: 'User not found' };
    }

    // Generate coupon code: USERNAME_001, USERNAME_002, etc.
    const baseName = (user.name || user.email.split('@')[0])
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 10);

    // Count existing coupons for this user pattern
    const existingCoupons = await prisma.coupon.count({
        where: {
            code: { startsWith: baseName + '_' }
        }
    });

    const couponNumber = (existingCoupons + 1).toString().padStart(3, '0');
    const couponCode = `${baseName}_${couponNumber}`;

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + settings.couponValidity);

    // Process in transaction
    const result = await prisma.$transaction(async (tx) => {
        // Deduct points from user
        const newBalance = currentBalance - pointsToConvert;
        await tx.user.update({
            where: { id: userId },
            data: { points: newBalance }
        });

        // Create the coupon
        await tx.coupon.create({
            data: {
                code: couponCode,
                discountType: 'FIXED_AMOUNT',
                discountValue: discountValue,
                minOrderValue: discountValue, // Min order = discount value
                usageLimit: 1, // Single use
                currentUsage: 0,
                isActive: true,
                startDate: new Date(),
                endDate: expiryDate
            }
        });

        // Record the transaction
        await tx.loyaltyTransaction.create({
            data: {
                userId,
                type: 'REDEEM',
                points: -pointsToConvert,
                balance: newBalance,
                description: `Converted to coupon ${couponCode} worth ${discountValue} EGP`
            }
        });

        return { couponCode, discountValue, newBalance };
    });

    return {
        success: true,
        couponCode: result.couponCode,
        discount: result.discountValue
    };
}

/**
 * Get user's generated loyalty coupons
 */
export async function getUserLoyaltyCoupons(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
    });

    if (!user) return [];

    const baseName = (user.name || user.email.split('@')[0])
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 10);

    return prisma.coupon.findMany({
        where: {
            code: { startsWith: baseName + '_' }
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            code: true,
            discountValue: true,
            currentUsage: true,
            usageLimit: true,
            isActive: true,
            endDate: true,
            createdAt: true
        }
    });
}

/**
 * Get loyalty page data for a user
 */
export async function getLoyaltyPageData(userId: string) {
    const [user, transactions, coupons] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                points: true
            }
        }),
        prisma.loyaltyTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        }),
        getUserLoyaltyCoupons(userId)
    ]);

    const settings = await getLoyaltySettings();

    if (!user) return null;

    const MIN_COUPON_VALUE = 100;
    const potentialDiscount = Math.floor(user.points * settings.pointValue);
    // Ensure minPointsForCoupon is valid even if pointValue is very small
    const minPointsForCoupon = settings.pointValue > 0 ? Math.max(settings.minRedeemPoints, MIN_COUPON_VALUE / settings.pointValue) : settings.minRedeemPoints;

    return {
        user,
        transactions,
        coupons,
        config: {
            pointValue: settings.pointValue,
            minCouponValue: MIN_COUPON_VALUE,
            minPointsForCoupon,
            couponValidityDays: settings.couponValidity
        },
        potentialDiscount,
        canGenerateCoupon: user.points >= minPointsForCoupon
    };
}

/**
 * Adjust user points manually (Admin)
 */
export async function adjustUserPoints(userId: string, points: number, reason: string) {
    // Process in transaction
    const result = await prisma.$transaction(async (tx) => {
        // Get current balance
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { points: true }
        });

        const currentBalance = user?.points || 0;
        const newBalance = currentBalance + points;

        // Prevent negative balance
        if (newBalance < 0) {
            throw new Error('Adjustment would result in negative balance');
        }

        // Update user
        await tx.user.update({
            where: { id: userId },
            data: { points: newBalance }
        });

        // Record transaction
        await tx.loyaltyTransaction.create({
            data: {
                userId,
                type: 'ADJUST',
                points,
                balance: newBalance,
                description: reason
            }
        });

        return newBalance;
    });

    return { success: true, newBalance: result };
}

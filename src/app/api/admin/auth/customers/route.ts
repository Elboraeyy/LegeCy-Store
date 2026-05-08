import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/customers
 * Ultra-comprehensive customer analytics & loyalty statistics
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const ninetyDaysAgo = new Date(now); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // ── Core Counts ──
        const [totalUsers, newThisMonth, newLastMonth, activeUsersRaw] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
            prisma.user.count({ where: { orders: { some: { createdAt: { gte: thirtyDaysAgo } } } } }),
        ]);

        // ── Order-based Customer Analysis ──
        const [totalOrders, deliveredOrders, cancelledOrders, returnRequests] = await Promise.all([
            prisma.order.count(),
            prisma.order.count({ where: { status: 'delivered' } }),
            prisma.order.count({ where: { status: 'cancelled' } }),
            prisma.returnRequest.count(),
        ]);

        // ── Revenue Stats ──
        const [totalRevenueAgg, avgOrderAgg] = await Promise.all([
            prisma.order.aggregate({ where: { status: 'delivered' }, _sum: { totalPrice: true } }),
            prisma.order.aggregate({ where: { status: 'delivered' }, _avg: { totalPrice: true } }),
        ]);
        const totalRevenue = totalRevenueAgg._sum.totalPrice?.toNumber() || 0;
        const avgOrderValue = avgOrderAgg._avg.totalPrice?.toNumber() || 0;

        // ── Repeat vs One-time Customers ──
        const usersWithOrderCounts = await prisma.user.findMany({
            select: {
                id: true,
                _count: { select: { orders: { where: { status: 'delivered' } } } },
            },
            where: { orders: { some: { status: 'delivered' } } },
        });
        const repeatCustomers = usersWithOrderCounts.filter(u => u._count.orders > 1).length;
        const oneTimeCustomers = usersWithOrderCounts.filter(u => u._count.orders === 1).length;
        const totalBuyers = usersWithOrderCounts.length;
        const repeatRate = totalBuyers > 0 ? Math.round((repeatCustomers / totalBuyers) * 100) : 0;

        // ── Customer Lifetime Value (CLV) ──
        const clvData = await prisma.user.findMany({
            select: {
                id: true, name: true, email: true, createdAt: true,
                orders: { where: { status: 'delivered' }, select: { totalPrice: true, createdAt: true } },
            },
            where: { orders: { some: { status: 'delivered' } } },
        });

        let totalCLV = 0;
        const clvList = clvData.map(u => {
            const rev = u.orders.reduce((s, o) => s + o.totalPrice.toNumber(), 0);
            totalCLV += rev;
            return { id: u.id, name: u.name || u.email || 'Guest', revenue: rev, orders: u.orders.length, joinedAt: u.createdAt };
        }).sort((a, b) => b.revenue - a.revenue);
        const avgCLV = totalBuyers > 0 ? totalCLV / totalBuyers : 0;

        // ── Top 10 Customers ──
        const topCustomers = clvList.slice(0, 10).map(c => ({
            name: c.name, revenue: Math.round(c.revenue), orders: c.orders,
        }));

        // ── Loyalty Program ──
        const [loyaltySettings, totalPointsEarned, totalPointsRedeemed, loyaltyMembers] = await Promise.all([
            prisma.loyaltySettings.findFirst(),
            prisma.loyaltyTransaction.aggregate({ where: { type: 'EARN' }, _sum: { points: true } }),
            prisma.loyaltyTransaction.aggregate({ where: { type: 'REDEEM' }, _sum: { points: true } }),
            prisma.user.count({ where: { points: { gt: 0 } } }),
        ]);
        const pointsEarned = totalPointsEarned._sum.points || 0;
        const pointsRedeemed = Math.abs(totalPointsRedeemed._sum.points || 0);
        const pointsOutstanding = pointsEarned - pointsRedeemed;

        // Top loyalty holders
        const topLoyaltyHolders = await prisma.user.findMany({
            where: { points: { gt: 0 } },
            select: { name: true, email: true, points: true },
            orderBy: { points: 'desc' },
            take: 5,
        });

        // ── Reviews ──
        const [totalReviews, reviewAvg, fiveStars, fourStars, threeStars, twoStars, oneStar, featuredReviews] = await Promise.all([
            prisma.review.count(),
            prisma.review.aggregate({ _avg: { rating: true } }),
            prisma.review.count({ where: { rating: 5 } }),
            prisma.review.count({ where: { rating: 4 } }),
            prisma.review.count({ where: { rating: 3 } }),
            prisma.review.count({ where: { rating: 2 } }),
            prisma.review.count({ where: { rating: 1 } }),
            prisma.review.count({ where: { featured: true } }),
        ]);
        const avgRating = reviewAvg._avg.rating || 0;

        // Recent reviews
        const recentReviews = await prisma.review.findMany({
            take: 5, orderBy: { createdAt: 'desc' },
            select: { name: true, rating: true, text: true, createdAt: true, product: { select: { name: true } } },
        });

        // ── Returns & Disputes ──
        const [returnsByStatus, disputeCount] = await Promise.all([
            prisma.returnRequest.groupBy({ by: ['status'], _count: true }),
            prisma.orderDispute.count(),
        ]);

        // ── Risk Profiles ──
        const riskProfiles = await prisma.customerRiskProfile.groupBy({
            by: ['riskLevel'],
            _count: true,
        });
        const blockedUsers = await prisma.customerRiskProfile.count({ where: { blockedAt: { not: null } } });
        const highRiskUsers = await prisma.customerRiskProfile.findMany({
            where: { riskLevel: { in: ['high', 'critical'] } },
            select: { email: true, phone: true, riskScore: true, riskLevel: true, flagReason: true, returnCount: true, cancelCount: true },
            orderBy: { riskScore: 'desc' },
            take: 5,
        });

        // ── Coupons ──
        const [totalCoupons, activeCoupons, couponUsageCount, couponRevenueAgg] = await Promise.all([
            prisma.coupon.count(),
            prisma.coupon.count({ where: { isActive: true } }),
            prisma.couponUsage.count(),
            prisma.order.aggregate({
                where: { couponId: { not: null }, status: 'delivered' },
                _sum: { totalPrice: true, discountAmount: true },
                _count: true,
            }),
        ]);

        // Top used coupons
        const topCoupons = await prisma.coupon.findMany({
            where: { currentUsage: { gt: 0 } },
            select: { code: true, discountType: true, discountValue: true, currentUsage: true, usageLimit: true },
            orderBy: { currentUsage: 'desc' },
            take: 5,
        });

        // ── Geographic Distribution ──
        const geoDistribution = await prisma.order.groupBy({
            by: ['shippingGovernorate'],
            where: { status: 'delivered', shippingGovernorate: { not: null } },
            _count: true,
            _sum: { totalPrice: true },
            orderBy: { _count: { shippingGovernorate: 'desc' } },
            take: 10,
        });

        // ── Customer Registration Trend (last 6 months) ──
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const registrationData = await prisma.user.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true },
        });
        const regTrend = new Map<string, number>();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            regTrend.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
        }
        for (const user of registrationData) {
            const key = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, '0')}`;
            if (regTrend.has(key)) regTrend.set(key, (regTrend.get(key) || 0) + 1);
        }

        // ── Order Sources Distribution ──
        const orderSources = await prisma.order.groupBy({
            by: ['orderSource'],
            _count: true,
            orderBy: { _count: { orderSource: 'desc' } },
        });

        // ── Abandoned Carts ──
        const abandonedCarts = await prisma.cart.count({
            where: { items: { some: {} }, user: { orders: { none: { createdAt: { gte: thirtyDaysAgo } } } } },
        });

        // ── Customer Activity Segments ──
        const dormant = await prisma.user.count({
            where: { orders: { some: {} }, NOT: { orders: { some: { createdAt: { gte: ninetyDaysAgo } } } } },
        });
        const atRisk = await prisma.user.count({
            where: {
                orders: { some: { createdAt: { gte: ninetyDaysAgo } } },
                NOT: { orders: { some: { createdAt: { gte: thirtyDaysAgo } } } },
            },
        });

        const newCustomerGrowth = newLastMonth > 0
            ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
            : 0;

        return NextResponse.json({
            overview: {
                totalUsers,
                newThisMonth,
                newLastMonth,
                newCustomerGrowth,
                activeUsers: activeUsersRaw,
                totalBuyers,
                totalOrders,
                deliveredOrders,
                cancelledOrders,
                returnRequests,
                disputeCount,
                totalRevenue: Math.round(totalRevenue),
                avgOrderValue: Math.round(avgOrderValue),
                avgCLV: Math.round(avgCLV),
                repeatCustomers,
                oneTimeCustomers,
                repeatRate,
                abandonedCarts,
            },
            segments: {
                active: activeUsersRaw,
                atRisk,
                dormant,
                blocked: blockedUsers,
            },
            topCustomers,
            loyalty: {
                enabled: loyaltySettings?.enabled ?? false,
                pointsPerEgp: loyaltySettings?.pointsPerEgp ?? 0,
                pointValue: loyaltySettings?.pointValue ?? 0,
                minRedeem: loyaltySettings?.minRedeemPoints ?? 0,
                totalEarned: pointsEarned,
                totalRedeemed: pointsRedeemed,
                outstanding: pointsOutstanding,
                members: loyaltyMembers,
                topHolders: topLoyaltyHolders.map(u => ({
                    name: u.name || u.email || 'Guest',
                    points: u.points,
                })),
            },
            reviews: {
                total: totalReviews,
                avgRating: Math.round(avgRating * 10) / 10,
                featured: featuredReviews,
                distribution: [
                    { stars: 5, count: fiveStars },
                    { stars: 4, count: fourStars },
                    { stars: 3, count: threeStars },
                    { stars: 2, count: twoStars },
                    { stars: 1, count: oneStar },
                ],
                recent: recentReviews.map(r => ({
                    name: r.name, rating: r.rating, text: r.text,
                    product: r.product?.name || '', date: r.createdAt.toISOString(),
                })),
            },
            risk: {
                distribution: riskProfiles.map(r => ({ level: r.riskLevel, count: r._count })),
                blocked: blockedUsers,
                highRisk: highRiskUsers.map(u => ({
                    email: u.email, phone: u.phone, score: u.riskScore,
                    level: u.riskLevel, reason: u.flagReason,
                    returns: u.returnCount, cancels: u.cancelCount,
                })),
            },
            returns: {
                total: returnRequests,
                byStatus: returnsByStatus.map(r => ({ status: r.status, count: r._count })),
                returnRate: deliveredOrders > 0 ? Math.round((returnRequests / deliveredOrders) * 100) : 0,
            },
            coupons: {
                total: totalCoupons,
                active: activeCoupons,
                totalUsage: couponUsageCount,
                revenueWithCoupons: (couponRevenueAgg._sum as { totalPrice: { toNumber: () => number } | null })?.totalPrice?.toNumber() || 0,
                discountGiven: (couponRevenueAgg._sum as { discountAmount: { toNumber: () => number } | null })?.discountAmount?.toNumber() || 0,
                ordersWithCoupons: couponRevenueAgg._count || 0,
                topCoupons: topCoupons.map(c => ({
                    code: c.code, type: c.discountType,
                    value: c.discountValue.toNumber(),
                    used: c.currentUsage, limit: c.usageLimit,
                })),
            },
            geography: geoDistribution.map(g => ({
                governorate: g.shippingGovernorate || 'Unknown',
                orders: g._count,
                revenue: (g._sum as { totalPrice: { toNumber: () => number } | null })?.totalPrice?.toNumber() || 0,
            })),
            registrationTrend: Array.from(regTrend.entries()).map(([month, count]) => ({ month, count })),
            orderSources: orderSources.map(s => ({ source: s.orderSource, count: s._count })),
        });
    } catch (error) {
        console.error('Customers API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch customer analytics' }, { status: 500 });
    }
}

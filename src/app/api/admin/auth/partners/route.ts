import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';
import { getPartnersInsights } from '@/lib/services/mobileInsightsService';

/**
 * GET /api/admin/auth/partners
 * Comprehensive partners & investors statistics
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // ── Investors (Equity Partners) ──
        const investors = await prisma.investor.findMany({
            include: {
                transactions: { orderBy: { date: 'desc' } },
            },
        });

        const investorStats = investors.map(inv => {
            const deposits = inv.transactions
                .filter(t => t.type === 'DEPOSIT')
                .reduce((s, t) => s + t.amount.toNumber(), 0);
            const withdrawals = inv.transactions
                .filter(t => t.type === 'WITHDRAWAL')
                .reduce((s, t) => s + t.amount.toNumber(), 0);
            const recentTx = inv.transactions.slice(0, 5).map(t => ({
                id: t.id,
                type: t.type,
                amount: t.amount.toNumber(),
                date: t.date.toISOString(),
                description: t.description,
                snapshotShare: t.snapshotShare.toNumber(),
            }));

            return {
                id: inv.id,
                name: inv.name,
                type: inv.type,
                isActive: inv.isActive,
                currentShare: inv.currentShare.toNumber(),
                netContributed: inv.netContributed.toNumber(),
                totalDeposits: deposits,
                totalWithdrawals: withdrawals,
                balance: deposits - withdrawals,
                transactionCount: inv.transactions.length,
                joinedAt: inv.joinedAt.toISOString(),
                recentTransactions: recentTx,
            };
        });

        const totalCapital = investorStats.reduce((s, i) => s + i.netContributed, 0);
        const totalShares = investorStats.reduce((s, i) => s + i.currentShare, 0);

        // ── Commission Partners ──
        const partners = await prisma.partner.findMany({
            include: {
                transactions: { orderBy: { createdAt: 'desc' } },
            },
        });

        const partnerStats = partners.map(p => {
            const commissions = p.transactions
                .filter(t => t.type === 'COMMISSION' || t.type === 'commission')
                .reduce((s, t) => s + t.amount.toNumber(), 0);
            const payouts = p.transactions
                .filter(t => t.type === 'PAYOUT' || t.type === 'payout')
                .reduce((s, t) => s + t.amount.toNumber(), 0);

            // This month
            const thisMonthTx = p.transactions.filter(t => new Date(t.createdAt) >= startOfMonth);
            const thisMonthCommissions = thisMonthTx
                .filter(t => t.type === 'COMMISSION' || t.type === 'commission')
                .reduce((s, t) => s + t.amount.toNumber(), 0);

            // Last month
            const lastMonthTx = p.transactions.filter(t => {
                const d = new Date(t.createdAt);
                return d >= startOfLastMonth && d <= endOfLastMonth;
            });
            const lastMonthCommissions = lastMonthTx
                .filter(t => t.type === 'COMMISSION' || t.type === 'commission')
                .reduce((s, t) => s + t.amount.toNumber(), 0);

            const recentTx = p.transactions.slice(0, 5).map(t => ({
                id: t.id,
                type: t.type,
                amount: t.amount.toNumber(),
                orderId: t.orderId,
                reference: t.reference,
                status: t.status,
                date: t.createdAt.toISOString(),
            }));

            const orderCount = p.transactions.filter(t => t.orderId != null).length;

            return {
                id: p.id,
                name: p.name,
                code: p.code,
                email: p.email,
                phone: p.phone,
                commissionRate: p.commissionRate.toNumber(),
                walletBalance: p.walletBalance.toNumber(),
                isActive: p.isActive,
                totalCommissions: commissions,
                totalPayouts: payouts,
                pendingBalance: commissions - payouts,
                thisMonthCommissions,
                lastMonthCommissions,
                orderCount,
                transactionCount: p.transactions.length,
                createdAt: p.createdAt.toISOString(),
                recentTransactions: recentTx,
            };
        });

        const sourceOfTruth = await getPartnersInsights();

        const netProfit = sourceOfTruth.monthClosingCumulativeNet;
        const rev = sourceOfTruth.auditedRevenueThisMonth;
        const investorProfitShares = investorStats
            .filter((inv) => inv.type === 'PARTNER')
            .map((inv) => {
                const sharePercent = inv.currentShare > 0 ? inv.currentShare : 0;
                const row = sourceOfTruth.investors.find((i) => i.name === inv.name);
                return {
                    name: inv.name,
                    share: sharePercent,
                    profitShare: row?.cumulativeDistributions ?? sharePercent * netProfit,
                    walletBalance: row?.walletBalance ?? 0,
                };
            });

        // ── Partner Alerts ──
        const alerts = await prisma.partnerAlert.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        return NextResponse.json({
            sourceOfTruth,
            overview: {
                totalCapital,
                totalShares,
                netProfit,
                totalRevenue: rev,
                totalExpenses: 0,
                investorCount: investors.length,
                partnerCount: partners.length,
                activeInvestors: investors.filter(i => i.isActive).length,
                activePartners: partners.filter(p => p.isActive).length,
                totalWalletBalance: sourceOfTruth.totalWalletBalance,
                pendingWithdrawals: sourceOfTruth.pendingWithdrawalCount,
                pendingWithdrawalAmount: sourceOfTruth.pendingWithdrawalAmount,
                auditedNetProfitThisMonth: sourceOfTruth.auditedNetProfitThisMonth,
            },
            investors: investorStats,
            investorProfitShares,
            partners: partnerStats,
            alerts: alerts.map(a => ({
                id: a.id,
                type: a.type,
                severity: a.severity,
                title: a.title,
                message: a.message,
                createdAt: a.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Partners API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch partners data' }, { status: 500 });
    }
}

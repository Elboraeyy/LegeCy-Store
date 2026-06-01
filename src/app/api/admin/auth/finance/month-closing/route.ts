import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/finance/month-closing
 * Get month closing data (preview or historical)
 * Query: ?month=5&year=2026
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

        // Fetch active safes
        const safesRaw = await prisma.safe.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
        const safes = safesRaw.map(s => ({
            id: s.id,
            name: s.name,
            balance: s.balance.toNumber(),
        }));

        // Check if already closed
        const existing = await prisma.monthClosing.findUnique({
            where: { month_year: { month, year } },
            include: {
                partnerDistributions: {
                    include: { investor: { select: { name: true, netContributed: true } } },
                },
            },
        });

        if (existing) {
            // Calculate cumulative brand reinvestment up to this closed month
            const pastClosings = await prisma.monthClosing.findMany({
                where: {
                    status: 'CLOSED',
                    OR: [
                        { year: { lt: year } },
                        { year: year, month: { lte: month } }
                    ]
                }
            });
            const cumulativeReinvestment = pastClosings.reduce((sum, mc) => sum + mc.reinvestmentAmount.toNumber(), 0);

            // Calculate partner cumulative shares up to this closed month
            const partnerCumulativeShares = await prisma.monthClosingPartner.findMany({
                where: {
                    monthClosing: {
                        status: 'CLOSED',
                        OR: [
                            { year: { lt: year } },
                            { year: year, month: { lte: month } }
                        ]
                    }
                }
            });

            return NextResponse.json({
                closing: {
                    ...existing,
                    totalRevenue: existing.totalRevenue.toNumber(),
                    totalCOGS: existing.totalCOGS.toNumber(),
                    totalShippingCosts: existing.totalShippingCosts.toNumber(),
                    totalPackagingCosts: existing.totalPackagingCosts.toNumber(),
                    totalExtraExpenses: existing.totalExtraExpenses.toNumber(),
                    totalDiscounts: existing.totalDiscounts.toNumber(),
                    grossProfit: existing.grossProfit.toNumber(),
                    totalOperatingExpenses: existing.totalOperatingExpenses.toNumber(),
                    totalAmortizedExpenses: existing.totalAmortizedExpenses.toNumber(),
                    netProfit: existing.netProfit.toNumber(),
                    reinvestmentAmount: existing.reinvestmentAmount.toNumber(),
                    distributionAmount: existing.distributionAmount.toNumber(),
                    profitShareAmount: existing.profitShareAmount.toNumber(),
                    salaryShareAmount: existing.salaryShareAmount.toNumber(),
                    manualAdjustment: existing.manualAdjustment.toNumber(),
                    cumulativeReinvestment,
                    partnerDistributions: existing.partnerDistributions.map(pd => {
                        const partnerPast = partnerCumulativeShares.filter(pcs => pcs.investorId === pd.investorId);
                        const cumulativeProfitShare = partnerPast.reduce((sum, p) => sum + p.profitShare.toNumber(), 0);
                        const cumulativeSalaryShare = partnerPast.reduce((sum, p) => sum + p.salaryShare.toNumber(), 0);
                        const cumulativeTotalShare = partnerPast.reduce((sum, p) => sum + p.totalShare.toNumber(), 0);

                        const netContributed = (pd.investor as any)?.netContributed ? Number((pd.investor as any).netContributed) : 0;
                        const currentCapitalWorth = netContributed + (cumulativeReinvestment * pd.sharePercentage.toNumber());

                        return {
                            ...pd,
                            sharePercentage: pd.sharePercentage.toNumber(),
                            profitShare: pd.profitShare.toNumber(),
                            salaryShare: pd.salaryShare.toNumber(),
                            totalShare: pd.totalShare.toNumber(),
                            cumulativeProfitShare,
                            cumulativeSalaryShare,
                            cumulativeTotalShare,
                            currentCapitalWorth,
                        };
                    }),
                },
                safes,
                isPreview: false,
            });
        }

        // Generate preview from live data
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        // Get all audited delivered orders for this month
        const auditedOrders = await prisma.order.findMany({
            where: {
                status: 'delivered',
                deliveredAt: { gte: startOfMonth, lte: endOfMonth },
                isFinanciallyAudited: true,
            },
        });

        const pendingAuditCount = await prisma.order.count({
            where: {
                status: 'delivered',
                deliveredAt: { gte: startOfMonth, lte: endOfMonth },
                isFinanciallyAudited: false,
            },
        });

        const cancelledCount = await prisma.order.count({
            where: {
                status: { in: ['cancelled', 'CANCELLED'] },
                createdAt: { gte: startOfMonth, lte: endOfMonth },
            },
        });

        // Calculate revenue & costs from audited orders
        const totalRevenue = auditedOrders.reduce((s, o) => s + o.totalPrice.toNumber(), 0);
        const totalCOGS = auditedOrders.reduce((s, o) => s + (o.wholesaleCost?.toNumber() || 0), 0);
        const totalShippingCosts = auditedOrders.reduce((s, o) => s + (o.actualShippingCost?.toNumber() || 0), 0);
        const totalPackagingCosts = auditedOrders.reduce((s, o) => s + (o.packagingCost?.toNumber() || 0), 0);
        const totalExtraExpenses = auditedOrders.reduce((s, o) => s + (o.extraExpenses?.toNumber() || 0), 0);
        const totalDiscounts = auditedOrders.reduce((s, o) => s + (o.discountAmount?.toNumber() || 0), 0);
        const grossProfit = totalRevenue - totalCOGS - totalShippingCosts - totalPackagingCosts - totalExtraExpenses;

        // Get direct operating expenses for this month (non-amortized)
        const directExpenses = await prisma.expense.aggregate({
            where: {
                date: { gte: startOfMonth, lte: endOfMonth },
                isAmortized: false,
                expenseType: 'OPERATING',
                status: 'PAID',
            },
            _sum: { amount: true },
        });

        // Get amortized expenses affecting this month
        const allAmortized = await prisma.expense.findMany({
            where: { isAmortized: true, amortStartDate: { lte: endOfMonth } },
        });
        const amortizedThisMonth = allAmortized
            .filter(e => {
                if (!e.amortStartDate) return false;
                const start = new Date(e.amortStartDate);
                const startM = start.getFullYear() * 12 + start.getMonth();
                const currentM = year * 12 + (month - 1);
                const endM = startM + e.spreadMonths - 1;
                return currentM >= startM && currentM <= endM;
            })
            .reduce((s, e) => s + (e.monthlyAmount?.toNumber() || 0), 0);

        const totalOperatingExpenses = directExpenses._sum.amount?.toNumber() || 0;
        const netProfit = grossProfit - totalOperatingExpenses - amortizedThisMonth;

        // Distribution calculation (40% reinvestment, 60% distribution)
        const reinvestmentAmount = Math.round(netProfit * 0.40 * 100) / 100;
        const distributionAmount = Math.round(netProfit * 0.60 * 100) / 100;
        const profitShareAmount = Math.round(distributionAmount * 0.70 * 100) / 100; // 70% by shares
        const salaryShareAmount = Math.round(distributionAmount * 0.30 * 100) / 100; // 30% equal salary

        // Get active partners
        const partners = await prisma.investor.findMany({
            where: { isActive: true, type: 'PARTNER' },
            orderBy: { name: 'asc' },
        });

        // Calculate cumulative brand reinvestment up to this month (prior closed months + current draft reinvestmentAmount)
        const pastClosings = await prisma.monthClosing.findMany({
            where: {
                status: 'CLOSED',
                OR: [
                    { year: { lt: year } },
                    { year: year, month: { lt: month } }
                ]
            }
        });
        const pastReinvestment = pastClosings.reduce((sum, mc) => sum + mc.reinvestmentAmount.toNumber(), 0);
        const cumulativeReinvestment = pastReinvestment + reinvestmentAmount;

        // Calculate partner cumulative shares up to this month (prior closed months + current draft shares)
        const partnerCumulativeShares = await prisma.monthClosingPartner.findMany({
            where: {
                monthClosing: {
                    status: 'CLOSED',
                    OR: [
                        { year: { lt: year } },
                        { year: year, month: { lt: month } }
                    ]
                }
            }
        });

        const partnerDistributions = partners.map(p => {
            const pSalaryShare = Math.round(salaryShareAmount * p.salaryShare.toNumber() * 100) / 100;
            const pProfitShare = Math.round(profitShareAmount * p.currentShare.toNumber() * 100) / 100;
            const currentTotal = Math.round((pProfitShare + pSalaryShare) * 100) / 100;

            const partnerPast = partnerCumulativeShares.filter(pcs => pcs.investorId === p.id);
            const pastProfitShare = partnerPast.reduce((sum, pcs) => sum + pcs.profitShare.toNumber(), 0);
            const pastSalaryShare = partnerPast.reduce((sum, pcs) => sum + pcs.salaryShare.toNumber(), 0);
            const pastTotalShare = partnerPast.reduce((sum, pcs) => sum + pcs.totalShare.toNumber(), 0);

            const netContributed = p.netContributed.toNumber();
            const currentCapitalWorth = netContributed + (cumulativeReinvestment * p.currentShare.toNumber());

            return {
                investorId: p.id,
                partnerName: p.name,
                sharePercentage: p.currentShare.toNumber(),
                profitShare: pProfitShare,
                salaryShare: pSalaryShare,
                totalShare: currentTotal,
                cumulativeProfitShare: pastProfitShare + pProfitShare,
                cumulativeSalaryShare: pastSalaryShare + pSalaryShare,
                cumulativeTotalShare: pastTotalShare + currentTotal,
                currentCapitalWorth,
            };
        });

        return NextResponse.json({
            closing: {
                month, year,
                status: 'DRAFT',
                totalRevenue, totalCOGS, totalShippingCosts, totalPackagingCosts,
                totalExtraExpenses, totalDiscounts, grossProfit,
                totalOperatingExpenses, totalAmortizedExpenses: amortizedThisMonth,
                netProfit,
                reinvestmentAmount, distributionAmount,
                profitShareAmount, salaryShareAmount,
                manualAdjustment: 0,
                cumulativeReinvestment,
                totalOrders: auditedOrders.length + pendingAuditCount,
                auditedOrders: auditedOrders.length,
                cancelledOrders: cancelledCount,
                partnerDistributions,
            },
            safes,
            pendingAuditCount,
            isPreview: true,
        });
    } catch (error) {
        console.error('Month Closing GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch month closing data' }, { status: 500 });
    }
}

/**
 * POST /api/admin/finance/month-closing
 * Close the month - saves snapshot and distributes profits to partners
 */
export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const {
            month, year, manualAdjustment = 0, adjustmentNote, notes,
            // All the calculated values from preview
            totalRevenue, totalCOGS, totalShippingCosts, totalPackagingCosts,
            totalExtraExpenses, totalDiscounts, grossProfit,
            totalOperatingExpenses, totalAmortizedExpenses,
            netProfit: rawNetProfit,
            totalOrders, auditedOrders, cancelledOrders,
            brandSafeId,
        } = body;

        // Apply manual adjustment
        const netProfit = rawNetProfit + manualAdjustment;
        const reinvestmentAmount = Math.round(netProfit * 0.40 * 100) / 100;
        const distributionAmount = Math.round(netProfit * 0.60 * 100) / 100;
        const profitShareAmount = Math.round(distributionAmount * 0.70 * 100) / 100;
        const salaryShareAmount = Math.round(distributionAmount * 0.30 * 100) / 100;

        const partners = await prisma.investor.findMany({
            where: { isActive: true, type: 'PARTNER' },
        });

        const result = await prisma.$transaction(async (tx) => {
            // Create/update the month closing record
            const closing = await tx.monthClosing.upsert({
                where: { month_year: { month, year } },
                create: {
                    month, year,
                    status: 'CLOSED',
                    totalRevenue, totalCOGS, totalShippingCosts, totalPackagingCosts,
                    totalExtraExpenses, totalDiscounts, grossProfit,
                    totalOperatingExpenses, totalAmortizedExpenses,
                    netProfit,
                    reinvestmentAmount, distributionAmount,
                    profitShareAmount, salaryShareAmount,
                    manualAdjustment,
                    adjustmentNote: adjustmentNote || undefined,
                    totalOrders: totalOrders || 0,
                    auditedOrders: auditedOrders || 0,
                    cancelledOrders: cancelledOrders || 0,
                    closedBy: admin.id,
                    closedAt: new Date(),
                    notes: notes || undefined,
                },
                update: {
                    status: 'CLOSED',
                    totalRevenue, totalCOGS, totalShippingCosts, totalPackagingCosts,
                    totalExtraExpenses, totalDiscounts, grossProfit,
                    totalOperatingExpenses, totalAmortizedExpenses,
                    netProfit,
                    reinvestmentAmount, distributionAmount,
                    profitShareAmount, salaryShareAmount,
                    manualAdjustment,
                    adjustmentNote: adjustmentNote || undefined,
                    totalOrders: totalOrders || 0,
                    auditedOrders: auditedOrders || 0,
                    cancelledOrders: cancelledOrders || 0,
                    closedBy: admin.id,
                    closedAt: new Date(),
                    notes: notes || undefined,
                },
            });

            // Delete old distributions if re-closing
            await tx.monthClosingPartner.deleteMany({
                where: { monthClosingId: closing.id },
            });

            // Distribute profits to each partner
            for (const partner of partners) {
                const profitShare = Math.round(profitShareAmount * partner.currentShare.toNumber() * 100) / 100;
                const salaryShare = Math.round(salaryShareAmount * partner.salaryShare.toNumber() * 100) / 100;
                const totalShare = profitShare + salaryShare;

                // Create distribution record
                await tx.monthClosingPartner.create({
                    data: {
                        monthClosingId: closing.id,
                        investorId: partner.id,
                        partnerName: partner.name,
                        sharePercentage: partner.currentShare.toNumber(),
                        profitShare,
                        salaryShare,
                        totalShare,
                    },
                });

                // Add to partner's wallet
                await tx.investor.update({
                    where: { id: partner.id },
                    data: {
                        walletBalance: { increment: totalShare },
                        totalEarnings: { increment: totalShare },
                    },
                });
            }

            // Reverse old safe transaction if re-closing
            const oldTx = await tx.safeTransaction.findFirst({
                where: {
                    referenceType: 'MONTH_CLOSING',
                    referenceId: closing.id,
                }
            });
            if (oldTx) {
                await tx.safe.update({
                    where: { id: oldTx.safeId },
                    data: { balance: { decrement: oldTx.amount } }
                });
                await tx.safeTransaction.delete({ where: { id: oldTx.id } });
            }

            // Deposit reinvestment amount (brand money) to selected safe
            if (brandSafeId && reinvestmentAmount > 0) {
                const safe = await tx.safe.update({
                    where: { id: brandSafeId },
                    data: { balance: { increment: reinvestmentAmount } }
                });

                await tx.safeTransaction.create({
                    data: {
                        safeId: brandSafeId,
                        type: 'CREDIT',
                        amount: reinvestmentAmount,
                        balanceAfter: safe.balance.toNumber(),
                        description: `إعادة استثمار (أرباح البراند) لشهر ${month}/${year}`,
                        referenceType: 'MONTH_CLOSING',
                        referenceId: closing.id,
                        createdBy: admin.id
                    }
                });
            }

            return closing;
        });

        return NextResponse.json({
            success: true,
            closing: {
                id: result.id,
                month: result.month,
                year: result.year,
                status: result.status,
                netProfit: result.netProfit.toNumber(),
            },
        });
    } catch (error) {
        console.error('Month Closing POST Error:', error);
        return NextResponse.json({ error: 'Failed to close month' }, { status: 500 });
    }
}

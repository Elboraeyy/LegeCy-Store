import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';
import {
    getFullMobileInsights,
    parseInsightsRange,
} from '@/lib/services/mobileInsightsService';

/**
 * GET /api/admin/auth/finance
 * Comprehensive finance overview for mobile
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const now = new Date();
        const range = parseInsightsRange(
            searchParams.get('startDate'),
            searchParams.get('endDate'),
            searchParams.get('month'),
            searchParams.get('year')
        );
        const insights = await getFullMobileInsights({
            month: String(range.end.getMonth() + 1),
            year: String(range.end.getFullYear()),
        });

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            totalRevenue,
            totalExpenses,
            deliveredCount,
            thisMonthRevenue,
            lastMonthRevenue,
            thisMonthExpenses,
            lastMonthExpenses,
            expensesByCategory,
            recentExpenses,
            monthlyRevenue,
            paymentRevenue,
            pendingExpenses,
            avgOrderValue,
            cogsData,
            salariesData,
            payablesData,
            discountData,
            shippingData,
        ] = await Promise.all([
            // All-time revenue (delivered only)
            prisma.order.aggregate({
                where: { status: 'delivered' },
                _sum: { totalPrice: true },
            }),
            // All-time expenses (PAID — matches Expenses screen)
            prisma.expense.aggregate({
                where: { status: 'PAID' },
                _sum: { amount: true },
            }),
            prisma.order.count({ where: { status: 'delivered' } }),

            // This month revenue
            prisma.order.aggregate({
                where: { status: 'delivered', createdAt: { gte: startOfMonth } },
                _sum: { totalPrice: true },
            }),
            // Last month revenue
            prisma.order.aggregate({
                where: { status: 'delivered', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
                _sum: { totalPrice: true },
            }),
            // This month expenses
            prisma.expense.aggregate({
                where: { status: 'PAID', date: { gte: startOfMonth } },
                _sum: { amount: true },
            }),
            // Last month expenses
            prisma.expense.aggregate({
                where: { status: 'PAID', date: { gte: startOfLastMonth, lte: endOfLastMonth } },
                _sum: { amount: true },
            }),

            // Expenses by category
            prisma.expense.groupBy({
                by: ['categoryId'],
                where: { status: 'PAID' },
                _sum: { amount: true },
                _count: true,
                orderBy: { _sum: { amount: 'desc' } },
            }),

            // Recent expenses
            prisma.expense.findMany({
                take: 15,
                orderBy: { date: 'desc' },
                include: { category: true },
            }),

            // Monthly revenue trend (last 12 months via raw orders)
            prisma.order.findMany({
                where: { status: 'delivered', createdAt: { gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } },
                select: { createdAt: true, totalPrice: true },
                orderBy: { createdAt: 'asc' },
            }),

            // Revenue by payment method
            prisma.order.groupBy({
                by: ['paymentMethod'],
                where: { status: 'delivered' },
                _sum: { totalPrice: true },
                _count: true,
            }),

            // Pending expenses count & total
            prisma.expense.aggregate({
                where: { status: 'PENDING' },
                _sum: { amount: true },
                _count: true,
            }),

            // Average order value
            prisma.order.aggregate({
                where: { status: 'delivered' },
                _avg: { totalPrice: true },
            }),

            // NEW: RevenueRecognition for COGS & Gross Profit
            prisma.revenueRecognition.aggregate({
                _sum: { netRevenue: true, cogsAmount: true, grossProfit: true }
            }),

            // NEW: Salaries paid
            prisma.salaryPayment.aggregate({
                _sum: { netAmount: true }
            }),

            // NEW: Outstanding Accounts Payable (to suppliers)
            prisma.accountsPayable.aggregate({
                where: { status: 'OPEN' },
                _sum: { amount: true }
            }),

            // NEW: Discount costs (from delivered orders)
            prisma.order.aggregate({
                where: { status: 'delivered', discountAmount: { gt: 0 } },
                _sum: { discountAmount: true }
            }),

            // NEW: Shipping costs (from delivered orders)
            prisma.order.aggregate({
                where: { status: 'delivered' },
                _sum: { shippingCost: true }
            }),
        ]);

        // Get category names for expense breakdown
        const categoryIds = expensesByCategory.map(e => e.categoryId);
        const categories = await prisma.expenseCategory.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, budgetLimit: true },
        });
        const catMap = new Map(categories.map(c => [c.id, c]));

        // Build monthly trend
        const monthlyMap = new Map<string, number>();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyMap.set(key, 0);
        }
        for (const order of monthlyRevenue) {
            const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
            const cur = monthlyMap.get(key) || 0;
            monthlyMap.set(key, cur + order.totalPrice.toNumber());
        }
        const monthlyTrend = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
            month,
            revenue: Math.round(revenue),
        }));

        const totRev = totalRevenue._sum.totalPrice?.toNumber() || 0;
        const totExp = totalExpenses._sum.amount?.toNumber() || 0;
        const thisMonthRev = thisMonthRevenue._sum.totalPrice?.toNumber() || 0;
        const lastMonthRev = lastMonthRevenue._sum.totalPrice?.toNumber() || 0;
        const thisMonthExp = thisMonthExpenses._sum.amount?.toNumber() || 0;
        const lastMonthExp = lastMonthExpenses._sum.amount?.toNumber() || 0;
        const revGrowth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

        // NEW computations
        const totalCogs = cogsData._sum.cogsAmount?.toNumber() || 0;
        const totalGrossProfit = cogsData._sum.grossProfit?.toNumber() || 0;
        const totalSalaries = salariesData._sum.netAmount?.toNumber() || 0;
        const outstandingPayables = payablesData._sum.amount?.toNumber() || 0;
        const totalDiscounts = discountData._sum.discountAmount?.toNumber() || 0;
        const totalShipping = shippingData._sum.shippingCost?.toNumber() || 0;
        
        // Accurate net profit: Revenue - COGS - Expenses - Salaries
        // The old calculation just did Revenue - Expenses. We'll provide a true net profit based on COGS if available.
        // If COGS data is missing or incomplete, we fallback to the old way to avoid confusing numbers.
        const useAdvancedProfit = totalCogs > 0;
        const trueNetProfit = useAdvancedProfit 
            ? totalGrossProfit - totExp - totalSalaries 
            : totRev - totExp;

        return NextResponse.json({
            insights,
            overview: {
                totalRevenue: totRev,
                totalExpenses: totExp,
                netProfit: trueNetProfit,
                profitMargin: totRev > 0 ? Math.round((trueNetProfit / totRev) * 100) : 0,
                deliveredOrdersCount: deliveredCount,
                averageOrderValue: avgOrderValue._avg.totalPrice?.toNumber() || 0,
                cashOnHand: insights.treasury.totalBalance,
                cashSafeBalance: insights.cashFlow.currentBalance,
                auditedRevenue: insights.auditedOrders.revenue,
                auditedNetProfit: insights.auditedOrders.netProfit,
                expenseCashOut: insights.expenses.totalCashOut,
                inventoryBookValue: insights.inventory.bookValue,
                cogs: totalCogs,
                grossProfit: totalGrossProfit,
                grossMargin: totRev > 0 ? Math.round((totalGrossProfit / totRev) * 100) : 0,
                totalSalaries,
                outstandingPayables,
                totalDiscounts,
                totalShipping,
                isUsingAdvancedProfit: useAdvancedProfit,
            },
            thisMonth: {
                revenue: thisMonthRev,
                expenses: thisMonthExp,
                profit: thisMonthRev - thisMonthExp,
            },
            lastMonth: {
                revenue: lastMonthRev,
                expenses: lastMonthExp,
                profit: lastMonthRev - lastMonthExp,
            },
            growth: {
                revenueGrowth: Math.round(revGrowth * 10) / 10,
            },
            pendingExpenses: {
                count: pendingExpenses._count ?? 0,
                total: pendingExpenses._sum.amount?.toNumber() || 0,
            },
            expensesByCategory: expensesByCategory.map(e => {
                const cat = catMap.get(e.categoryId);
                return {
                    category: cat?.name || 'Unknown',
                    amount: e._sum.amount?.toNumber() || 0,
                    count: (e._count as number) || 0,
                    budgetLimit: cat?.budgetLimit?.toNumber() || null,
                };
            }),
            paymentBreakdown: paymentRevenue.map(p => ({
                method: p.paymentMethod,
                revenue: (p._sum as { totalPrice: { toNumber: () => number } | null })?.totalPrice?.toNumber() || 0,
                orders: (p._count as number) || 0,
            })),
            monthlyTrend,
            recentExpenses: recentExpenses.map(e => ({
                id: e.id,
                title: e.description,
                amount: e.amount.toNumber(),
                category: e.category?.name || 'Uncategorized',
                status: e.status,
                date: e.date.toISOString(),
                paidBy: e.paidBy,
            })),
        });
    } catch (error) {
        console.error('Mobile Finance Overview Error:', error);
        return NextResponse.json({ error: 'Failed to fetch finance overview' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/finance
 * Finance overview for mobile
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const [revenueResult, expensesResult, ordersCount] = await Promise.all([
            prisma.order.aggregate({
                where: { status: 'delivered' },
                _sum: { totalPrice: true },
            }),
            prisma.expense.aggregate({
                where: { status: 'APPROVED' },
                _sum: { amount: true },
            }),
            prisma.order.count({ where: { status: 'delivered' } }),
        ]);

        const totalRevenue = revenueResult._sum.totalPrice?.toNumber() || 0;
        const totalExpenses = expensesResult._sum.amount?.toNumber() || 0;
        const netProfit = totalRevenue - totalExpenses;

        // Get recent expenses for the list
        const recentExpenses = await prisma.expense.findMany({
            take: 10,
            orderBy: { date: 'desc' },
            include: { category: true },
        });

        return NextResponse.json({
            overview: {
                totalRevenue,
                totalExpenses,
                netProfit,
                deliveredOrdersCount: ordersCount,
            },
            recentExpenses: recentExpenses.map(e => ({
                id: e.id,
                title: e.description,
                amount: e.amount.toNumber(),
                category: e.category?.name || 'Uncategorized',
                status: e.status,
                date: e.date,
            })),
        });
    } catch (error) {
        console.error('Mobile Finance Overview Error:', error);
        return NextResponse.json({ error: 'Failed to fetch finance overview' }, { status: 500 });
    }
}

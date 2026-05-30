import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/finance/expenses
 * List expenses with filters, stats, and category breakdown
 * Query: ?month=5&year=2026&categoryId=xxx
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
        const categoryId = searchParams.get('categoryId');

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        // Build where clause
        const where: Record<string, unknown> = {
            date: { gte: startOfMonth, lte: endOfMonth },
        };
        if (categoryId) where.categoryId = categoryId;

        // Fetch direct expenses for this month
        const directExpenses = await prisma.expense.findMany({
            where,
            include: {
                category: { select: { id: true, name: true } },
                subcategory: { select: { id: true, name: true } },
                safe: { select: { id: true, name: true, type: true } },
            },
            orderBy: { date: 'desc' },
        });

        // Fetch amortized expenses that affect this month
        // (started before or during this month, and still running)
        const amortizedExpenses = await prisma.expense.findMany({
            where: {
                isAmortized: true,
                amortStartDate: { lte: endOfMonth },
            },
            include: {
                category: { select: { id: true, name: true } },
                subcategory: { select: { id: true, name: true } },
                safe: { select: { id: true, name: true, type: true } },
            },
        });

        // Filter amortized that actually affect this month
        const activeAmortized = amortizedExpenses.filter(e => {
            if (!e.amortStartDate) return false;
            const start = new Date(e.amortStartDate);
            const startMonth = start.getFullYear() * 12 + start.getMonth();
            const currentMonth = year * 12 + (month - 1);
            const endMonth = startMonth + e.spreadMonths - 1;
            return currentMonth >= startMonth && currentMonth <= endMonth;
        });

        // Calculate totals
        const totalDirectExpenses = directExpenses
            .filter(e => !e.isAmortized)
            .reduce((sum, e) => sum + e.amount.toNumber(), 0);
        
        const totalAmortizedThisMonth = activeAmortized
            .reduce((sum, e) => sum + (e.monthlyAmount?.toNumber() || 0), 0);

        // Category breakdown for stats
        const categoryBreakdown = await prisma.expense.groupBy({
            by: ['categoryId'],
            where: {
                ...where,
                isAmortized: false,
            },
            _sum: { amount: true },
            _count: true,
        });

        // Enrich category names
        const categories = await prisma.expenseCategory.findMany({
            where: { parentId: null },
            include: { children: true },
        });

        const categoryMap = new Map(categories.map(c => [c.id, c.name]));

        // Get safes for the form
        const safes = await prisma.safe.findMany({
            where: { isActive: true },
            select: { id: true, name: true, type: true },
        });

        return NextResponse.json({
            expenses: directExpenses.map(e => ({
                id: e.id,
                description: e.description,
                amount: e.amount.toNumber(),
                date: e.date.toISOString(),
                category: e.category,
                subcategory: e.subcategory,
                status: e.status,
                safe: e.safe,
                isAmortized: e.isAmortized,
                spreadMonths: e.spreadMonths,
                monthlyAmount: e.monthlyAmount?.toNumber() || null,
                amortStartDate: e.amortStartDate?.toISOString(),
                receiptUrl: e.receiptUrl,
            })),
            amortizedExpenses: activeAmortized.map(e => ({
                id: e.id,
                description: e.description,
                totalAmount: e.amount.toNumber(),
                monthlyAmount: e.monthlyAmount?.toNumber() || 0,
                spreadMonths: e.spreadMonths,
                amortStartDate: e.amortStartDate?.toISOString(),
                category: e.category,
            })),
            stats: {
                totalDirectExpenses,
                totalAmortizedThisMonth,
                totalExpensesThisMonth: totalDirectExpenses + totalAmortizedThisMonth,
                categoryBreakdown: categoryBreakdown.map(c => ({
                    categoryId: c.categoryId,
                    categoryName: categoryMap.get(c.categoryId) || 'Unknown',
                    total: c._sum.amount?.toNumber() || 0,
                    count: c._count,
                })),
            },
            categories: categories.map(c => ({
                id: c.id,
                name: c.name,
                children: c.children.map(ch => ({ id: ch.id, name: ch.name })),
            })),
            safes,
            month,
            year,
        });
    } catch (error) {
        console.error('Expenses GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

/**
 * POST /api/admin/finance/expenses
 * Create a new expense
 */
export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const {
            description, amount, date, categoryId, subcategoryId,
            safeId, isAmortized, spreadMonths, receiptUrl,
        } = body;

        if (!description || !amount || !categoryId) {
            return NextResponse.json({ error: 'Description, amount, and category are required' }, { status: 400 });
        }

        const monthlyAmount = isAmortized && spreadMonths > 1
            ? Math.round((amount / spreadMonths) * 100) / 100
            : amount;

        const result = await prisma.$transaction(async (tx) => {
            // Create the expense
            const expense = await tx.expense.create({
                data: {
                    description,
                    amount,
                    date: date ? new Date(date) : new Date(),
                    categoryId,
                    subcategoryId: subcategoryId || undefined,
                    safeId: safeId || undefined,
                    isAmortized: isAmortized || false,
                    spreadMonths: isAmortized ? (spreadMonths || 1) : 1,
                    monthlyAmount: isAmortized ? monthlyAmount : amount,
                    amortStartDate: isAmortized ? (date ? new Date(date) : new Date()) : undefined,
                    status: 'PAID',
                    paidBy: admin.id,
                    receiptUrl,
                },
            });

            // If a safe is specified, deduct the full amount immediately
            if (safeId) {
                const safe = await tx.safe.update({
                    where: { id: safeId },
                    data: { balance: { decrement: amount } },
                });

                await tx.safeTransaction.create({
                    data: {
                        safeId,
                        type: 'DEBIT',
                        amount,
                        balanceAfter: safe.balance.toNumber(),
                        description: `Expense: ${description}`,
                        referenceType: 'EXPENSE',
                        referenceId: expense.id,
                        createdBy: admin.id,
                    },
                });
            }

            return expense;
        });

        return NextResponse.json({ success: true, expense: result });
    } catch (error) {
        console.error('Expenses POST Error:', error);
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}

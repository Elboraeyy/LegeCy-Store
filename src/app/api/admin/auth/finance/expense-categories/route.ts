import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/finance/expense-categories
 * List all expense categories with subcategories
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const categories = await prisma.expenseCategory.findMany({
            where: { parentId: null },
            include: {
                children: { orderBy: { name: 'asc' } },
                _count: { select: { expenses: true } },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({
            categories: categories.map(c => ({
                id: c.id,
                name: c.name,
                code: c.code,
                budgetLimit: c.budgetLimit?.toNumber() || null,
                expenseCount: c._count.expenses,
                children: c.children.map(ch => ({
                    id: ch.id,
                    name: ch.name,
                    code: ch.code,
                })),
            })),
        });
    } catch (error) {
        console.error('ExpenseCategories GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

/**
 * POST /api/admin/finance/expense-categories
 * Create a new category or subcategory
 */
export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { name, code, parentId, budgetLimit } = await request.json();
        if (!name) {
            return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
        }

        const category = await prisma.expenseCategory.create({
            data: {
                name,
                code: code || undefined,
                parentId: parentId || undefined,
                budgetLimit: budgetLimit || undefined,
            },
        });

        return NextResponse.json({ success: true, category });
    } catch (error) {
        console.error('ExpenseCategories POST Error:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/auth/finance/expense-categories
 * Update an existing category
 */
export async function PUT(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id, name, code, parentId, budgetLimit } = await request.json();
        if (!id) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
        }
        if (!name) {
            return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
        }

        const category = await prisma.expenseCategory.update({
            where: { id },
            data: {
                name,
                code: code !== undefined ? code : undefined,
                parentId: parentId !== undefined ? parentId : undefined,
                budgetLimit: budgetLimit !== undefined ? budgetLimit : undefined,
            },
        });

        return NextResponse.json({ success: true, category });
    } catch (error) {
        console.error('ExpenseCategories PUT Error:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/auth/finance/expense-categories
 * Delete a category
 */
export async function DELETE(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
        }

        // Check if there are any child subcategories
        const childrenCount = await prisma.expenseCategory.count({
            where: { parentId: id },
        });
        if (childrenCount > 0) {
            return NextResponse.json({ error: 'Cannot delete category because it has subcategories' }, { status: 400 });
        }

        // Check if there are any expenses associated with this category or subcategory
        const expensesCount = await prisma.expense.count({
            where: {
                OR: [
                    { categoryId: id },
                    { subcategoryId: id },
                ],
            },
        });
        if (expensesCount > 0) {
            return NextResponse.json({ error: 'Cannot delete category because it is associated with expenses' }, { status: 400 });
        }

        await prisma.expenseCategory.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('ExpenseCategories DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}

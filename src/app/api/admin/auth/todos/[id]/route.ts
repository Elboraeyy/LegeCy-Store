import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/todos/[id]
 * Get a single todo by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;

        const todo = await prisma.todo.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        if (!todo) {
            return NextResponse.json(
                { error: 'Todo not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ todo });
    } catch (error) {
        console.error('Error fetching todo:', error);
        return NextResponse.json(
            { error: 'Failed to fetch todo' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/auth/todos/[id]
 * Update a todo (complete/uncomplete)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;
        const body = await request.json();
        const { isCompleted, title, deadline } = body;

        const updateData: Record<string, unknown> = {};
        
        if (typeof isCompleted === 'boolean') {
            updateData.isCompleted = isCompleted;
        }
        if (title) {
            updateData.title = title;
        }
        if (deadline) {
            updateData.deadline = new Date(deadline);
        }

        const todo = await prisma.todo.update({
            where: { id },
            data: updateData,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        return NextResponse.json({ todo });
    } catch (error) {
        console.error('Error updating todo:', error);
        return NextResponse.json(
            { error: 'Failed to update todo' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/auth/todos/[id]
 * Delete a todo
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;

        await prisma.todo.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting todo:', error);
        return NextResponse.json(
            { error: 'Failed to delete todo' },
            { status: 500 }
        );
    }
}
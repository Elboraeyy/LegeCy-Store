import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/todos
 * List all todos (both active and completed)
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const includeCompleted = searchParams.get('includeCompleted') === 'true';

        const where = includeCompleted 
            ? {} 
            : { isCompleted: false };

        const todos = await prisma.todo.findMany({
            where,
            orderBy: { deadline: 'asc' },
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

        return NextResponse.json({ todos });
    } catch (error) {
        console.error('Error fetching todos:', error);
        return NextResponse.json(
            { error: 'Failed to fetch todos' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/auth/todos
 * Create a new todo
 */
export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { title, description, deadline } = body;

        if (!title || !deadline) {
            return NextResponse.json(
                { error: 'Title and deadline are required' },
                { status: 400 }
            );
        }

        const todo = await prisma.todo.create({
            data: {
                title,
                description: description || '',
                deadline: new Date(deadline),
                createdById: admin.id,
            },
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

        return NextResponse.json({ todo }, { status: 201 });
    } catch (error) {
        console.error('Error creating todo:', error);
        return NextResponse.json(
            { error: 'Failed to create todo' },
            { status: 500 }
        );
    }
}
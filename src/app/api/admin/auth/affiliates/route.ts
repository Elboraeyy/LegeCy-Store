import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

/**
 * GET /api/admin/auth/affiliates
 * List all affiliates (Partners)
 */
export async function GET() {
    try {
        const affiliates = await prisma.partner.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { transactions: true }
                }
            }
        });

        return NextResponse.json({ affiliates });
    } catch (error) {
        console.error('Affiliates List Error:', error);
        return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 });
    }
}

/**
 * POST /api/admin/auth/affiliates
 * Create a new affiliate (Partner)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, code, email, phone, commissionRate } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
        }

        const existing = await prisma.partner.findUnique({
            where: { code }
        });

        if (existing) {
            return NextResponse.json({ error: 'Affiliate code already exists' }, { status: 400 });
        }

        const affiliate = await prisma.partner.create({
            data: {
                name,
                code: code.trim().toUpperCase(),
                email,
                phone,
                commissionRate: commissionRate ? Number(commissionRate) : 0.10,
            }
        });

        return NextResponse.json({ affiliate, message: 'Affiliate created successfully' });
    } catch (error) {
        console.error('Affiliate Create Error:', error);
        return NextResponse.json({ error: 'Failed to create affiliate' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const [categories, brands, materials, suppliers] = await Promise.all([
            prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
            prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
            prisma.material.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
            prisma.supplier.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        ]);

        return NextResponse.json({
            categories,
            brands,
            materials,
            suppliers,
        });
    } catch (error) {
        console.error('Mobile Product Options Error:', error);
        return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 });
    }
}

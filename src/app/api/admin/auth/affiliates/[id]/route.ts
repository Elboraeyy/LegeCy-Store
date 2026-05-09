import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        const existing = await prisma.partner.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
        }

        if (body.code && body.code !== existing.code) {
            const conflict = await prisma.partner.findUnique({ where: { code: body.code } });
            if (conflict) {
                return NextResponse.json({ error: 'Affiliate code is already in use' }, { status: 400 });
            }
        }

        const dataToUpdate: Record<string, unknown> = {};
        if (body.name !== undefined) dataToUpdate.name = body.name;
        if (body.code !== undefined) dataToUpdate.code = body.code.trim().toUpperCase();
        if (body.email !== undefined) dataToUpdate.email = body.email;
        if (body.phone !== undefined) dataToUpdate.phone = body.phone;
        if (body.commissionRate !== undefined) dataToUpdate.commissionRate = Number(body.commissionRate);
        if (body.isActive !== undefined) dataToUpdate.isActive = body.isActive;

        const affiliate = await prisma.partner.update({
            where: { id },
            data: dataToUpdate,
        });

        return NextResponse.json({ affiliate, message: 'Affiliate updated successfully' });
    } catch (error) {
        console.error('Affiliate Update Error:', error);
        return NextResponse.json({ error: 'Failed to update affiliate' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        
        const existing = await prisma.partner.findUnique({ 
            where: { id },
            include: {
                _count: { select: { transactions: true } }
            }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
        }

        // If affiliate has transactions, deactivate instead of delete
        if (existing._count.transactions > 0) {
            await prisma.partner.update({
                where: { id },
                data: { isActive: false }
            });
            return NextResponse.json({ message: 'Affiliate has transactions and was deactivated instead of deleted' });
        }

        await prisma.partner.delete({ where: { id } });
        return NextResponse.json({ message: 'Affiliate deleted successfully' });
    } catch (error) {
        console.error('Affiliate Delete Error:', error);
        return NextResponse.json({ error: 'Failed to delete affiliate' }, { status: 500 });
    }
}

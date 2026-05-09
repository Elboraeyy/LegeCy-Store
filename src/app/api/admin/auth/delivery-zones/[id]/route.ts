import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();

        const existing = await prisma.shippingZone.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Zone not found' }, { status: 404 });

        const data: any = {};
        if (body.name !== undefined) data.name = body.name;
        if (body.cities !== undefined) data.cities = body.cities;
        if (body.baseRate !== undefined) data.baseRate = Number(body.baseRate);
        if (body.returnRate !== undefined) data.returnRate = Number(body.returnRate);
        if (body.avgDeliveryDays !== undefined) data.avgDeliveryDays = Number(body.avgDeliveryDays);
        if (body.riskLevel !== undefined) data.riskLevel = body.riskLevel;
        if (body.isActive !== undefined) data.isActive = body.isActive;
        if (body.notes !== undefined) data.notes = body.notes;

        const zone = await prisma.shippingZone.update({ where: { id }, data });
        return NextResponse.json({ zone, message: 'Zone updated' });
    } catch (error) {
        console.error('Zone Update Error:', error);
        return NextResponse.json({ error: 'Failed to update zone' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await prisma.shippingZone.delete({ where: { id } });
        return NextResponse.json({ message: 'Zone deleted' });
    } catch (error) {
        console.error('Zone Delete Error:', error);
        return NextResponse.json({ error: 'Failed to delete zone' }, { status: 500 });
    }
}

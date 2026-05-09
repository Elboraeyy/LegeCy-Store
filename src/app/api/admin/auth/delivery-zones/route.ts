import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function GET(_request: NextRequest) {
    try {
        const zones = await prisma.shippingZone.findMany({
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({
            zones: zones.map(z => ({
                id: z.id,
                name: z.name,
                cities: z.cities,
                baseRate: z.baseRate.toNumber(),
                returnRate: z.returnRate.toNumber(),
                avgDeliveryDays: z.avgDeliveryDays,
                riskLevel: z.riskLevel,
                isActive: z.isActive,
                notes: z.notes,
            }))
        });
    } catch (error) {
        console.error('Delivery Zones GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, cities, baseRate, returnRate, avgDeliveryDays, riskLevel, notes } = body;

        if (!name) return NextResponse.json({ error: 'Zone name is required' }, { status: 400 });

        const zone = await prisma.shippingZone.create({
            data: {
                name,
                cities: cities || [],
                baseRate: baseRate ? Number(baseRate) : 50,
                returnRate: returnRate ? Number(returnRate) : 0,
                avgDeliveryDays: avgDeliveryDays ? Number(avgDeliveryDays) : 3,
                riskLevel: riskLevel || 'normal',
                notes,
            }
        });

        return NextResponse.json({ zone, message: 'Zone created successfully' });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === 'P2002') return NextResponse.json({ error: 'Zone name already exists' }, { status: 400 });
        console.error('Delivery Zone Create Error:', error);
        return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 });
    }
}

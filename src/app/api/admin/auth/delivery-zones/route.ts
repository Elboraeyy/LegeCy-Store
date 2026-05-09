import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function GET() {
    try {
        const zones = await prisma.shippingZone.findMany({
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({
            zones: zones.map((z) => {
                const zone = z as unknown as {
                    id: string;
                    name: string;
                    cities: string[];
                    governorates?: string[];
                    baseRate: { toNumber: () => number };
                    returnRate: { toNumber: () => number };
                    avgDeliveryDays: number;
                    riskLevel: string;
                    isActive: boolean;
                    notes: string | null;
                };
                return {
                    id: zone.id,
                    name: zone.name,
                    cities: zone.cities,
                    governorates: zone.governorates,
                    baseRate: zone.baseRate.toNumber(),
                    returnRate: zone.returnRate.toNumber(),
                    avgDeliveryDays: zone.avgDeliveryDays,
                    riskLevel: zone.riskLevel,
                    isActive: zone.isActive,
                    notes: zone.notes,
                };
            })
        });
    } catch (error) {
        console.error('Delivery Zones GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, cities, governorates, baseRate, returnRate, avgDeliveryDays, riskLevel, notes } = body;

        if (!name) return NextResponse.json({ error: 'Zone name is required' }, { status: 400 });

        const createFn = prisma.shippingZone.create as unknown as (args: Record<string, unknown>) => Promise<unknown>;
        const zone = await createFn({
            data: {
                name,
                cities: cities || [],
                governorates: governorates || [],
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

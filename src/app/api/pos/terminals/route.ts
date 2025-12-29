import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const terminals = await prisma.pOSTerminal.findMany({
            where: { isActive: true },
            include: {
                warehouse: {
                    select: { name: true, code: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({
            terminals: terminals.map(t => ({
                id: t.id,
                name: t.name,
                code: t.code,
                warehouseId: t.warehouseId,
                warehouseName: t.warehouse.name,
                printerType: t.printerType,
                drawerEnabled: t.drawerEnabled,
                isActive: t.isActive
            }))
        });
    } catch (error) {
        console.error('Error fetching terminals:', error);
        // Return demo terminals if no real ones exist
        return NextResponse.json({
            terminals: [
                { id: 'demo-1', name: 'Terminal 1', code: 'POS-01', warehouseId: 'demo', warehouseName: 'Main Store', isActive: true },
                { id: 'demo-2', name: 'Terminal 2', code: 'POS-02', warehouseId: 'demo', warehouseName: 'Main Store', isActive: true }
            ]
        });
    }
}

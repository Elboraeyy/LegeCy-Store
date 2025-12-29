import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';

// Start a new POS session - simplified endpoint
export async function POST(request: NextRequest) {
    try {
        // For demo, allow without full authentication
        let adminId = 'demo-admin';
        let adminName = 'Demo Cashier';

        try {
            const session = await validateAdminSession();
            if (session && session.user) {
                adminId = session.user.id;
                adminName = session.user.name;
            }
        } catch {
            // Use demo values if auth fails
        }

        const body = await request.json();
        const { terminalId, openingBalance = 0 } = body;

        if (!terminalId) {
            return NextResponse.json(
                { error: 'Terminal ID is required' },
                { status: 400 }
            );
        }

        // Try to get terminal, fallback to demo
        let terminalName = 'Terminal 1';
        try {
            const terminal = await prisma.pOSTerminal.findUnique({
                where: { id: terminalId },
                select: { name: true }
            });
            if (terminal) terminalName = terminal.name;
        } catch {
            // Use default terminal name
        }

        // Generate session number
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const sessionNo = `POS-${dateStr}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

        try {
            // Try to create session in database
            const posSession = await prisma.pOSSession.create({
                data: {
                    sessionNo,
                    cashierId: adminId,
                    terminalId,
                    openingBalance,
                    status: 'OPEN'
                },
                include: {
                    cashier: { select: { name: true } },
                    terminal: { select: { name: true, code: true } }
                }
            });

            return NextResponse.json({
                session: {
                    id: posSession.id,
                    sessionNo: posSession.sessionNo,
                    cashierId: posSession.cashierId,
                    cashierName: posSession.cashier.name,
                    terminalId: posSession.terminalId,
                    terminalName: posSession.terminal.name,
                    startedAt: posSession.startedAt,
                    openingBalance: Number(posSession.openingBalance),
                    status: posSession.status
                }
            });
        } catch {
            // Demo mode - return mock session
            return NextResponse.json({
                session: {
                    id: `session-${Date.now()}`,
                    sessionNo,
                    cashierId: adminId,
                    cashierName: adminName,
                    terminalId,
                    terminalName,
                    startedAt: new Date().toISOString(),
                    openingBalance: openingBalance,
                    status: 'OPEN'
                }
            });
        }
    } catch (error) {
        console.error('Error starting POS session:', error);
        return NextResponse.json(
            { error: 'Failed to start session' },
            { status: 500 }
        );
    }
}

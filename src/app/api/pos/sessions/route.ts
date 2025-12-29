import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';

// Start a new POS session
export async function POST(request: NextRequest) {
    try {
        // Verify admin is logged in
        const session = await validateAdminSession();
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { terminalId, openingBalance = 0 } = body;

        if (!terminalId) {
            return NextResponse.json(
                { error: 'Terminal ID is required' },
                { status: 400 }
            );
        }

        // Check terminal exists and is active
        const terminal = await prisma.pOSTerminal.findUnique({
            where: { id: terminalId },
            include: { warehouse: { select: { name: true } } }
        });

        if (!terminal || !terminal.isActive) {
            return NextResponse.json(
                { error: 'Terminal not found or inactive' },
                { status: 404 }
            );
        }

        // Check for existing open session on this terminal
        const existingSession = await prisma.pOSSession.findFirst({
            where: {
                terminalId,
                status: 'OPEN'
            }
        });

        if (existingSession) {
            return NextResponse.json(
                { error: 'This terminal already has an open session' },
                { status: 409 }
            );
        }

        // Generate session number
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const count = await prisma.pOSSession.count({
            where: {
                startedAt: {
                    gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
                }
            }
        });
        const sessionNo = `POS-${dateStr}-${String(count + 1).padStart(4, '0')}`;

        // Create session
        const posSession = await prisma.pOSSession.create({
            data: {
                sessionNo,
                cashierId: session.user.id,
                terminalId,
                openingBalance,
                status: 'OPEN'
            },
            include: {
                cashier: { select: { name: true } },
                terminal: { select: { name: true, code: true } }
            }
        });

        // Log cash movement for opening balance
        if (openingBalance > 0) {
            await prisma.cashMovement.create({
                data: {
                    sessionId: posSession.id,
                    type: 'FLOAT',
                    amount: openingBalance,
                    reason: 'Opening balance',
                    balanceAfter: openingBalance,
                    performedById: session.user.id
                }
            });
        }

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
    } catch (error) {
        console.error('Error starting POS session:', error);
        return NextResponse.json(
            { error: 'Failed to start session' },
            { status: 500 }
        );
    }
}

// Get sessions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('id');
        const status = searchParams.get('status');

        if (sessionId) {
            const posSession = await prisma.pOSSession.findUnique({
                where: { id: sessionId },
                include: {
                    cashier: { select: { name: true } },
                    terminal: { select: { name: true, code: true } },
                    transactions: {
                        select: {
                            id: true,
                            transactionNo: true,
                            type: true,
                            total: true,
                            status: true,
                            createdAt: true
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 50
                    }
                }
            });

            if (!posSession) {
                return NextResponse.json(
                    { error: 'Session not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ session: posSession });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {};
        if (status) where.status = status;

        const sessions = await prisma.pOSSession.findMany({
            where,
            include: {
                cashier: { select: { name: true } },
                terminal: { select: { name: true } }
            },
            orderBy: { startedAt: 'desc' },
            take: 50
        });

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error('Error fetching POS sessions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sessions' },
            { status: 500 }
        );
    }
}

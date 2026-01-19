import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
    try {
        const sessionResult = await validateAdminSession();
        if (!sessionResult || !sessionResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { sessionId, countedCash, note, adminOverride } = body;

        if (!sessionId || countedCash === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch Session
        const session = await prisma.pOSSession.findUnique({
            where: { id: sessionId },
            include: { cashier: true }
        });

        if (!session || session.status !== 'OPEN') {
            return NextResponse.json({ error: 'Session not found or already closed' }, { status: 400 });
        }

        // 2. Calculate Expected Cash
        // Get last cash movement to know current balance
        const lastMovement = await prisma.cashMovement.findFirst({
            where: { sessionId: sessionId },
            orderBy: { createdAt: 'desc' }
        });

        const expectedCash = lastMovement ? Number(lastMovement.balanceAfter) : Number(session.openingBalance);
        const discrepancy = Number(countedCash) - expectedCash;
        const absDiscrepancy = Math.abs(discrepancy);
        const threshold = 50; // 50 EGP tolerance

        // 3. Validation Logic
        if (absDiscrepancy > threshold && !adminOverride) {
            return NextResponse.json({
                error: 'Cash discrepancy exceeds threshold',
                requiresOverride: true,
                expected: expectedCash,
                counted: countedCash,
                difference: discrepancy
            }, { status: 400 });
        }

        // 4. Close Session
        const closedSession = await prisma.pOSSession.update({
            where: { id: sessionId },
            data: {
                status: 'CLOSED',
                endedAt: new Date(),
                closingBalance: countedCash,
                expectedBalance: expectedCash,
                difference: discrepancy,
                closingNote: note ? `${session.closingNote || ''}\nClosing Note: ${note}` : session.closingNote,
            }
        });

        // 5. Record Closing Cash Movement (Optional, strictly speaking the float is just "verified")
        // But we might want to "Empty" the drawer?
        // Usually we leave it for next shift or Deposit it.
        // For now, we just close the session.

        return NextResponse.json({
            success: true,
            session: closedSession,
            discrepancy
        });

    } catch (error) {
        console.error('Error closing POS session:', error);
        return NextResponse.json({ error: 'Failed to close session' }, { status: 500 });
    }
}

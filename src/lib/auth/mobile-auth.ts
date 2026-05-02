import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

/**
 * Validates a Bearer token from the mobile app.
 * Returns the admin user if valid, or null.
 */
export async function validateMobileToken(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7); // Remove 'Bearer '

    try {
        const { verifySignedToken } = await import('@/lib/auth/authToken');
        const sessionId = await verifySignedToken(token);
        if (!sessionId) return null;

        const session = await prisma.adminSession.findUnique({
            where: { id: sessionId },
            include: {
                admin: {
                    include: { role: true },
                },
            },
        });

        if (!session) return null;

        // Check expiration
        if (Date.now() > session.expiresAt.getTime()) {
            await prisma.adminSession.delete({ where: { id: sessionId } });
            return null;
        }

        // Extend session if halfway through
        const thirtyDaysMs = 1000 * 60 * 60 * 24 * 30;
        if (Date.now() > session.expiresAt.getTime() - thirtyDaysMs / 2) {
            await prisma.adminSession.update({
                where: { id: sessionId },
                data: { expiresAt: new Date(Date.now() + thirtyDaysMs) },
            });
        }

        return session.admin;
    } catch {
        return null;
    }
}

/**
 * Helper: returns a 401 JSON response for mobile.
 */
export function unauthorizedResponse() {
    return NextResponse.json(
        { error: 'Unauthorized. Please login again.' },
        { status: 401 }
    );
}

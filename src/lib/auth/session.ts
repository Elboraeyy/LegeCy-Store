import { cookies } from 'next/headers';
import prismaClient from '@/lib/prisma';
import { Session, User, AdminSession, AdminUser, AdminRole } from '@prisma/client';

const prisma = prismaClient!;
import { cache } from 'react';
import crypto from 'crypto';

// Configuration
const SESSION_COOKIE_NAME = 'auth_session';
const ADMIN_SESSION_COOKIE_NAME = 'admin_auth_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const ADMIN_SESSION_DURATION_MS = 1000 * 60 * 60 * 12; // 12 hours (Stricter)

// TODO: storage for CSRF tokens (Blind Spot #4)
// Currently relying on SameSite=Lax, but need hidden input tokens for mutations.

export type SessionValidationResult = 
    | { session: Session; user: User; type: 'user' }
    | { session: AdminSession; user: AdminUser & { role: AdminRole | null }; type: 'admin' }
    | { session: null; user: null; type: null };

/**
 * Generates a cryptic, cryptographically strong session ID.
 */
function generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
}

// ==========================================
// Customer Session Management
// ==========================================

export async function createCustomerSession(userId: string) {
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await prisma.session.create({
        data: {
            id: sessionId,
            userId,
            expiresAt
        }
    });

    // Set Cookie
    (await cookies()).set(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: expiresAt
    });

    return sessionId;
}

export const validateCustomerSession = cache(async (): Promise<{ session: Session; user: User } | { session: null; user: null }> => {
    const sessionId = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!sessionId) return { session: null, user: null };

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true }
    });

    if (!session) return { session: null, user: null };

    // Check expiration
    if (Date.now() > session.expiresAt.getTime()) {
        await prisma.session.delete({ where: { id: sessionId } });
        return { session: null, user: null };
    }

    // Rolling Session: Extend if close to expiry (e.g., halfway)
    if (Date.now() > session.expiresAt.getTime() - (SESSION_DURATION_MS / 2)) {
        session.expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
        await prisma.session.update({
            where: { id: sessionId },
            data: { expiresAt: session.expiresAt }
        });
        (await cookies()).set(SESSION_COOKIE_NAME, sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires: session.expiresAt
        });
    }

    return { session, user: session.user };
});

export async function destroyCustomerSession() {
    const sessionId = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (sessionId) {
        await prisma.session.deleteMany({ where: { id: sessionId } }); // deleteMany handles missing safely
    }
    (await cookies()).delete(SESSION_COOKIE_NAME);
}

// ==========================================
// Admin Session Management (Strict Isolation)
// ==========================================

export async function createAdminSession(adminId: string) {
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_DURATION_MS);

    await prisma.adminSession.create({
        data: {
            id: sessionId,
            adminId,
            expiresAt
        }
    });

    // Set Cookie with different name
    (await cookies()).set(ADMIN_SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: expiresAt
    });

    return sessionId;
}

export const validateAdminSession = cache(async (): Promise<{ session: AdminSession; user: AdminUser & { role: AdminRole | null } } | { session: null; user: null }> => {
    const sessionId = (await cookies()).get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!sessionId) return { session: null, user: null };

    const session = await prisma.adminSession.findUnique({
        where: { id: sessionId },
        include: { 
            admin: {
                include: { role: true }
            } 
        }
    });

    if (!session) return { session: null, user: null };

    if (Date.now() > session.expiresAt.getTime()) {
        await prisma.adminSession.delete({ where: { id: sessionId } });
        return { session: null, user: null };
    }

    // Admin Rolling Session
    if (Date.now() > session.expiresAt.getTime() - (ADMIN_SESSION_DURATION_MS / 2)) {
        session.expiresAt = new Date(Date.now() + ADMIN_SESSION_DURATION_MS);
        await prisma.adminSession.update({
            where: { id: sessionId },
            data: { expiresAt: session.expiresAt }
        });
        (await cookies()).set(ADMIN_SESSION_COOKIE_NAME, sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires: session.expiresAt
        });
    }

    return { session, user: session.admin };
});

export async function destroyAdminSession() {
    const sessionId = (await cookies()).get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (sessionId) {
        await prisma.adminSession.deleteMany({ where: { id: sessionId } });
    }
    (await cookies()).delete(ADMIN_SESSION_COOKIE_NAME);
}

import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { verifyPassword } from '@/lib/auth/password';
import { checkRateLimit, RateLimits } from '@/lib/auth/rate-limit';
import crypto from 'crypto';

/**
 * POST /api/admin/auth/login
 *
 * Mobile-friendly login endpoint that returns a Bearer token
 * instead of setting a cookie (which doesn't work for native apps).
 *
 * The token is a signed admin session ID stored in the AdminSession table,
 * identical in security to the web dashboard sessions.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        // Rate limiting
        if (!await checkRateLimit(`admin_login_${ip}`, RateLimits.ADMIN_LOGIN)) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                { status: 429 }
            );
        }

        // Find admin
        const admin = await prisma.adminUser.findUnique({
            where: { email },
            include: { role: true },
        });

        if (!admin || !admin.isActive) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check lockout
        if (admin.lockedUntil && admin.lockedUntil > new Date()) {
            return NextResponse.json(
                { error: 'Account is temporarily locked. Try again later.' },
                { status: 423 }
            );
        }

        const passwordsMatch = await verifyPassword(password, admin.passwordHash);

        if (!passwordsMatch) {
            const newAttempts = admin.failedLoginAttempts + 1;
            const shouldLock = newAttempts >= 5;

            await prisma.adminUser.update({
                where: { id: admin.id },
                data: {
                    failedLoginAttempts: newAttempts,
                    lockedUntil: shouldLock
                        ? new Date(Date.now() + 15 * 60 * 1000)
                        : null,
                },
            });

            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Success — create a mobile session
        const sessionId = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days for mobile

        await prisma.adminSession.create({
            data: {
                id: sessionId,
                adminId: admin.id,
                expiresAt,
            },
        });

        // Reset failed attempts
        await prisma.adminUser.update({
            where: { id: admin.id },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
            },
        });

        // Sign the token
        const { createSignedToken } = await import('@/lib/auth/authToken');
        const token = await createSignedToken(sessionId);

        return NextResponse.json({
            token,
            user: {
                id: admin.id,
                name: admin.name,
                username: admin.username,
                email: admin.email,
                role: admin.role?.name || 'admin',
                avatar: admin.avatar,
            },
        });
    } catch (error) {
        console.error('Mobile Admin Login Error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

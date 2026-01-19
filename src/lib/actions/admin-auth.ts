'use server';

import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { verifyPassword } from '@/lib/auth/password';
import { createAdminSession, destroyAdminSession } from '@/lib/auth/session';
import { checkRateLimit, RateLimits } from '@/lib/auth/rate-limit';
import { auditService } from '@/lib/services/auditService'; // Use the service we know exists
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Types
export type ActionState = {
    error?: string;
    requiresTwoFactor?: boolean;
    adminId?: string;
    message?: string;
} | null;

// Validation Schema
const adminLoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

// Helper for completing login
async function completeLogin(adminId: string, ip: string) {
    // Reset counters
    await prisma.adminUser.update({
        where: { id: adminId },
        data: { 
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date() 
        }
    });

    // Create Session (Strict Middleware Compatible)
    await createAdminSession(adminId);

    // Audit Log
    try {
        await auditService.logAction(
            adminId,
            'LOGIN_SUCCESS',
            'ADMIN',
            adminId,
            { ip }
        );
    } catch (e) {
        console.error('Audit Log Failed:', e);
    }

    redirect('/admin');
}

// Helper type for ActionState to avoid repetitive null checks
type LoginActionState = ActionState;

export async function adminLogin(prevState: LoginActionState | unknown, formData: FormData): Promise<LoginActionState> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        // 1. Validation
        const validatedFields = adminLoginSchema.safeParse({ email, password });
        if (!validatedFields.success) {
            return { error: 'Invalid email or password format' };
        }

        const ip = (await headers()).get('x-forwarded-for') || 'unknown';

        // Stricter Rate Limit for Admin
        if (!await checkRateLimit(`admin_login_${ip}`, RateLimits.ADMIN_LOGIN)) {
            return { error: 'Too many login attempts. Please try again later.' };
        }

        // 2. Find Admin
        const admin = await prisma.adminUser.findUnique({
            where: { email },
            include: { role: true }
        });

        // 3. Check Credentials
        if (!admin || !admin.isActive) {
            // Fake delay for security
            await new Promise(resolve => setTimeout(resolve, 500));
            return { error: 'Invalid credentials' };
        }

        // Check Lockout
        if (admin.lockedUntil && admin.lockedUntil > new Date()) {
            return { error: 'Account is temporarily locked. Try again later.' };
        }

        const passwordsMatch = await verifyPassword(password, admin.passwordHash);

        if (!passwordsMatch) {
            // Increment failed attempts
            const newAttempts = admin.failedLoginAttempts + 1;
            const shouldLock = newAttempts >= 5;

            // Log failed attempt
            await prisma.adminUser.update({
                where: { id: admin.id },
                data: { 
                    failedLoginAttempts: newAttempts,
                    lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null 
                }
            });

            await auditService.logAction(
                admin.id,
                'LOGIN_FAILED',
                'ADMIN',
                admin.id,
                { ip, reason: 'Bad Password', attempts: newAttempts }
            );

            return { error: 'Invalid credentials' };
        }

        // 4. Check 2FA
        // Check property safely
        const adminWith2FA = admin as unknown as { twoFactorEnabled: boolean; id: string; email: string };
        if (adminWith2FA.twoFactorEnabled) {
            const { generateAndSendTwoFactorToken } = await import('@/lib/services/twoFactorService');
            const sent = await generateAndSendTwoFactorToken(admin.id, admin.email);

            if (!sent) {
                return { error: 'Failed to send verification code. Please contact support.' };
            }

            // Return state to trigger OTP form
            return {
                requiresTwoFactor: true,
                adminId: admin.id,
                message: 'Verification code sent to your email'
            };
        }

        // 5. Success (No 2FA) -> Create Session
        await completeLogin(admin.id, ip);
        return null; // Satisfy TS (redirect checks)

    } catch (error) {
        // If it's a redirect error, rethrow it
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        console.error('Admin Login Error:', error);
        return { error: 'An unexpected error occurred' };
    }
}

export async function verifyAdminTwoFactor(prevState: ActionState | unknown, formData: FormData): Promise<ActionState> {
    const adminId = formData.get('adminId') as string;
    const token = formData.get('otp') as string;

    if (!adminId || !token) {
        return { error: 'Missing verification data', requiresTwoFactor: true, adminId };
    }

    try {
        const { verifyTwoFactorToken } = await import('@/lib/services/twoFactorService');
        const isValid = await verifyTwoFactorToken(adminId, token);

        if (!isValid) {
            return { error: 'Invalid verification code', requiresTwoFactor: true, adminId };
        }

        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        await completeLogin(adminId, ip);
        return null;

    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        console.error('2FA Verification Error:', error);
        return { error: 'Verification failed', requiresTwoFactor: true, adminId };
    }
}

export async function adminLogout() {
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';

    try {
        const { validateAdminSession } = await import('@/lib/auth/session');
        const { user } = await validateAdminSession();
        
        if (user) {
            await auditService.logAction(user.id, 'LOGOUT', 'ADMIN', user.id, { ip });
        }
    } catch {
        // Session might be invalid, proceed with destruction anyway
    }

    await destroyAdminSession();
    redirect('/admin/login');
}

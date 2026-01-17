'use server';

import prismaClient from '@/lib/prisma';

const prisma = prismaClient!;
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password';
import { createCustomerSession, destroyCustomerSession } from '@/lib/auth/session';
import { checkRateLimit, RateLimits } from '@/lib/auth/rate-limit';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export type ActionState = { error?: string } | null;

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(7, 'Password must be at least 7 characters'),
    name: z.string().optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export async function signup(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`signup_${ip}`, RateLimits.SIGNUP)) {
        return { error: 'Too many signup attempts. Please try again later.' };
    }

    try {
        const data = signupSchema.parse(Object.fromEntries(formData));

        // Enforce strong password policy
        const passwordCheck = validatePasswordStrength(data.password);
        if (!passwordCheck.isValid) {
            return { error: passwordCheck.issues[0] || 'Password does not meet security requirements' };
        }

        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            // Timing attack protection: simulate work
            await hashPassword('dummy');
            return { error: 'Email already in use' };
        }

        const hashedPassword = await hashPassword(data.password);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash: hashedPassword,
                name: data.name
            }
        });

        await createCustomerSession(user.id);
    } catch (e) {
        if (e instanceof z.ZodError) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { error: (e as any).errors[0]?.message || 'Invalid input' };
        }
        return { error: 'Something went wrong.' };
    }

    redirect('/');
}

export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    
    // Strict login rate limiting
    if (!checkRateLimit(`login_${ip}`, RateLimits.CUSTOMER_LOGIN)) {
        return { error: 'Too many login attempts. Please try again in 15 minutes.' };
    }

    try {
        const data = loginSchema.parse(Object.fromEntries(formData));
        
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        
        if (!user) {
             // Fake verification to prevent enumeration
             await verifyPassword('dummy', '$argon2id$v=19$m=65536,t=3,p=4$dummyhash$dummyhash');
             return { error: 'Invalid email or password' };
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
            return { error: 'Account locked due to too many failed attempts. Try again later.' };
        }

        const isValid = await verifyPassword(data.password, user.passwordHash);

        if (!isValid) {
            // Increment failed attempts
            const attempts = user.failedLoginAttempts + 1;
            let lockedUntil = null;
            
            if (attempts >= 5) {
                lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { 
                    failedLoginAttempts: attempts,
                    lockedUntil
                }
            });

            return { error: 'Invalid email or password' };
        }

        // Success: Reset counter & Create Session
        await prisma.user.update({
            where: { id: user.id },
            data: { 
                failedLoginAttempts: 0,
                lockedUntil: null
            }
        });

        await createCustomerSession(user.id);
    } catch (e) {
        if (e instanceof z.ZodError) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             return { error: (e as any).errors[0]?.message || 'Invalid input format' };
        }
        return { error: 'Login failed' };
    }

    redirect('/');
}

export async function logout() {
    await destroyCustomerSession();
    redirect('/login');
}

// Alias for client components (doesn't redirect)
export async function logoutAction() {
    await destroyCustomerSession();
}

// Get current user for client components
export async function getCurrentUser(): Promise<{ id: string; name: string | null; email: string; image: string | null } | null> {
    const { validateCustomerSession } = await import('@/lib/auth/session');
    const { user } = await validateCustomerSession();
    
    if (!user) return null;
    
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image || null
    };
}

// Change password for logged-in users
export async function changePassword(
    currentPassword: string, 
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { validateCustomerSession } = await import('@/lib/auth/session');
        const { user } = await validateCustomerSession();
        
        if (!user) {
            return { success: false, error: 'You must be logged in' };
        }

        // Get full user with password hash
        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { passwordHash: true }
        });

        if (!fullUser || !fullUser.passwordHash) {
            return { success: false, error: 'User not found' };
        }

        // Verify current password
        const isValidCurrentPassword = await verifyPassword(currentPassword, fullUser.passwordHash);
        if (!isValidCurrentPassword) {
            return { success: false, error: 'Current password is incorrect' };
        }

        // Validate new password strength
        const passwordCheck = validatePasswordStrength(newPassword);
        if (!passwordCheck.isValid) {
            return { success: false, error: passwordCheck.issues[0] || 'New password does not meet security requirements' };
        }

        // Hash and update password
        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        });

        return { success: true };

    } catch (error) {
        console.error('Change password error:', error);
        return { success: false, error: 'An error occurred' };
    }
}


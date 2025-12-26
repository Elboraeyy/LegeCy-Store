'use server';

import prismaClient from '@/lib/prisma';

const prisma = prismaClient!;
import { verifyPassword } from '@/lib/auth/password';
import { createAdminSession, destroyAdminSession } from '@/lib/auth/session';
import { checkRateLimit, RateLimits } from '@/lib/auth/rate-limit';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export type ActionState = { error?: string } | null;

const adminLoginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

async function logAudit(adminId: string, action: string, metadata: Record<string, unknown> = {}, ip: string) {
    await prisma.auditLog.create({
        data: {
            adminId,
            action,
            entityType: 'SYSTEM',
            metadata: JSON.stringify(metadata),
            ipAddress: ip
        }
    });
}

export async function adminLogin(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';

    // Stricter Rate Limit for Admin
    if (!checkRateLimit(`admin_login_${ip}`, RateLimits.ADMIN_LOGIN)) {
        return { error: 'Too many admin login attempts. Access temporarily blocked.' };
    }

    try {
        const data = adminLoginSchema.parse(Object.fromEntries(formData));

        const admin = await prisma.adminUser.findUnique({ where: { email: data.email } });

        if (!admin || !admin.isActive) {
            // Fake verification
            await verifyPassword('dummy', '$argon2id$v=19$m=65536,t=3,p=4$dummyhash$dummyhash');
            // We do NOT log audit here because we don't have an admin ID to attach to, 
            // but we could log to a system-wide security log if requested. 
            // For now, return generic error.
            return { error: 'Invalid credentials' };
        }

        const isValid = await verifyPassword(data.password, admin.passwordHash);

        if (!isValid) {
            await logAudit(admin.id, 'LOGIN_FAILED', { reason: 'Invalid Password' }, ip);
            return { error: 'Invalid credentials' };
        }

        // Success
        await prisma.adminUser.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() }
        });

        await logAudit(admin.id, 'LOGIN_SUCCESS', {}, ip);
        await createAdminSession(admin.id);

    } catch (e) {
        if (e instanceof z.ZodError) {
            return { error: 'Invalid input' };
        }
        console.error(e);
        return { error: 'Admin login failed' };
    }

    redirect('/admin/orders');
}

export async function adminLogout() {
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    
    // Get admin ID before destroying session for audit
    try {
        const { validateAdminSession } = await import('@/lib/auth/session');
        const { user } = await validateAdminSession();
        
        if (user) {
            await logAudit(user.id, 'LOGOUT', {}, ip);
        }
    } catch {
        // Session might be invalid, proceed with destruction anyway
    }

    await destroyAdminSession();
    redirect('/admin/login');
}

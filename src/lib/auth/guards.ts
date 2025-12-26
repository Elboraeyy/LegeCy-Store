import { validateCustomerSession, validateAdminSession } from './session';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { PermissionError } from '@/lib/errors';
import { hasPermission } from './permissions';
import { auditService } from '@/lib/services/auditService';

/**
 * Guard for Customer Routes.
 * Redirects to login if session is invalid.
 */
export async function requireAuth() {
    const { session, user } = await validateCustomerSession();
    if (!session || !user) {
        redirect('/login');
    }
    return user;
}

/**
 * Guard for Admin Routes.
 * Redirects to admin login if session is invalid.
 */
export async function requireAdmin() {
    const { session, user } = await validateAdminSession();
    if (!session || !user) {
        redirect('/admin/login');
    }
    return user;
}

/**
 * Check for specific admin permissions/roles.
 * Throws error if validation fails (best for Server Actions).
 * Fails CLOSED if anything is ambiguous.
 */
export async function requireAdminPermission(requiredPermission: string | string[]) {
    const user = await requireAdmin(); // Ensures logged in
    
    // 1. Strict Role Check
    if (!user.role) throw new PermissionError('No role assigned to admin user');

    // 2. Check Permissions using Central Utility
    if (!hasPermission(user.role, requiredPermission)) {
        const required = Array.isArray(requiredPermission) ? requiredPermission.join(' or ') : requiredPermission;
        
        // AUDIT: Log the denied attempt
        try {
            const h = await headers();
            const ip = h.get('x-forwarded-for') || h.get('x-real-ip');
            const ua = h.get('user-agent');
            
            await auditService.logAction(
                user.id,
                'PERMISSION_DENIED',
                'SYSTEM',
                null,
                { requiredPermissions: Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission], role: user.role },
                ip,
                ua
            );
        } catch {
            // Ignore header parsing errors, ensuring we still throw the permission error
        }

        throw new PermissionError(`Access Denied. Required permissions: ${required}`);
    }

    return user;
}

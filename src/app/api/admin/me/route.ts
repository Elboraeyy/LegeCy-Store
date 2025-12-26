import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth/session';

/**
 * Returns current admin user info for client-side permission checks.
 * UI-ONLY: Backend still enforces permissions on all actions.
 */
export async function GET() {
    const { user } = await validateAdminSession();
    
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ? {
            name: user.role.name,
            permissions: user.role.permissions,
        } : null,
    });
}

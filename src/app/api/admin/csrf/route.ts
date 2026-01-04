import { NextResponse } from 'next/server';
import { ensureCsrfToken } from '@/lib/actions/csrf';

/**
 * GET /api/admin/csrf
 * Returns a CSRF token for admin mutations
 * Token is also set as httpOnly cookie
 */
export async function GET() {
    try {
        const token = await ensureCsrfToken();
        return NextResponse.json({ token });
    } catch (error) {
        console.error('Failed to generate CSRF token:', error);
        return NextResponse.json(
            { error: 'Failed to generate CSRF token' },
            { status: 500 }
        );
    }
}

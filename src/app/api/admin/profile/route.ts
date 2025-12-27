import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth/session';

export async function GET() {
    try {
        const { user } = await validateAdminSession();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({
            id: user.id,
            name: user.name,
            username: user.username || null,
            email: user.email,
            avatar: user.avatar || null,
            role: user.role?.name || null
        });
    } catch (error) {
        console.error('Error fetching admin profile:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

import { destroyAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export async function POST() {
    await destroyAdminSession();
    return redirect('/admin/login');
}

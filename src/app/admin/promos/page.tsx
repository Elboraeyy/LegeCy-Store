import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import PromosClient from './PromosClient';

export default async function PromosPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    return <PromosClient />;
}

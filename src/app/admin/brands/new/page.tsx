import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import BrandForm from '@/components/admin/BrandForm';
import '@/app/admin/admin.css';

export default async function NewBrandPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    return <BrandForm />;
}

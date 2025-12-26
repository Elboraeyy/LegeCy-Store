import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import CategoryForm from '@/components/admin/CategoryForm';

export default async function NewCategoryPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    return <CategoryForm />;
}

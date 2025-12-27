import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import MaterialForm from '@/components/admin/MaterialForm';
import '@/app/admin/admin.css';

export default async function NewMaterialPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    return <MaterialForm />;
}

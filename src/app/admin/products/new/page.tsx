import ProductForm from '@/components/admin/ProductForm';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function CreateProductPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    return (
        <div>
            <ProductForm />
        </div>
    );
}

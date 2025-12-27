import { validateAdminSession } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import BrandForm from '@/components/admin/BrandForm';
import prisma from '@/lib/prisma';
import '@/app/admin/admin.css';

export default async function EditBrandPage({ params }: { params: { id: string } }) {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const brand = await prisma.brand.findUnique({
        where: { id: params.id }
    });

    if (!brand) notFound();

    return <BrandForm initialData={brand} />;
}

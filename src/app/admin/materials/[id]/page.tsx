import { validateAdminSession } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import MaterialForm from '@/components/admin/MaterialForm';
import prisma from '@/lib/prisma';
import '@/app/admin/admin.css';

export default async function EditMaterialPage({ params }: { params: { id: string } }) {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const material = await prisma.material.findUnique({
        where: { id: params.id }
    });

    if (!material) notFound();

    return <MaterialForm initialData={material} />;
}

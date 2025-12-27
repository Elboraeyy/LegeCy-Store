import { fetchAllMaterials } from '@/lib/actions/material';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import MaterialListClient from '@/components/admin/MaterialListClient';
import '@/app/admin/admin.css';

export default async function MaterialsPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const materials = await fetchAllMaterials();

    // Serialize dates for Client Component
    const serializedMaterials = materials.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        _count: { products: m._count.products }
    }));

    return <MaterialListClient initialMaterials={serializedMaterials} />;
}

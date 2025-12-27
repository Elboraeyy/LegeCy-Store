import { fetchAllBrands } from '@/lib/actions/brand';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import BrandListClient from '@/components/admin/BrandListClient';
import '@/app/admin/admin.css';

export default async function BrandsPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const brands = await fetchAllBrands();

    // Map Prisma objects to Component Interface manually if needed, 
    // or let TS infer if types match. 
    // Prisma returns Date object for createdAt, Client expects string? 
    // Let's check BrandListClient type vs Prisma return.

    // Serializing dates for Client Component
    const serializedBrands = brands.map(b => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        _count: { products: b._count.products }
    }));

    return <BrandListClient initialBrands={serializedBrands} />;
}

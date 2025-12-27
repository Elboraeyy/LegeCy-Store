import { fetchAllCategories } from '@/lib/actions/category';
import { fetchAllBrands } from '@/lib/actions/brand';
import { fetchAllMaterials } from '@/lib/actions/material';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import CategoryListClient from '@/components/admin/CategoryListClient';
import '@/app/admin/admin.css';

export default async function CategoriesPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const [categories, brands, materials] = await Promise.all([
        fetchAllCategories(),
        fetchAllBrands(),
        fetchAllMaterials()
    ]);

    return (
        <CategoryListClient 
            initialCategories={categories} 
            initialBrands={brands} 
            initialMaterials={materials} 
        />
    );
}

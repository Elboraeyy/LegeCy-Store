import { validateAdminSession } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CategoryForm from '@/components/admin/CategoryForm';

interface EditCategoryPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const { id } = await params;
    
    const category = await prisma.category.findUnique({
        where: { id }
    });

    if (!category) notFound();

    return (
        <CategoryForm 
            initialData={{
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                parentId: category.parentId,
                sortOrder: category.sortOrder
            }} 
        />
    );
}

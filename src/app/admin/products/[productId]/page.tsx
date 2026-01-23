import ProductForm from '@/components/admin/ProductForm';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';

interface PageProps {
    params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
    // 1. Strict Permission Guard
    await requireAdminPermission(AdminPermissions.PRODUCTS.MANAGE);

    const { productId } = await params;

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            variants: {
                include: {
                    inventory: true
                }
            },
            images: true
        }
    });

    if (!product) {
        redirect('/admin/products');
    }

    // Calculate total stock (Simple MVP: First variant's first inventory record)
    // In a multi-warehouse setup, this would be a sum.
    const defaultVariant = product.variants[0];
    const currentStock = defaultVariant?.inventory?.reduce((acc, inv) => acc + inv.available, 0) || 0;

    const serializedProduct = {
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        status: product.status,
        categoryId: product.categoryId,
        images: product.images || [],
        stock: currentStock, // Pass stock
        variants: product.variants.map((v) => ({
            ...v,
            price: Number(v.price),
            costPrice: v.costPrice ? Number(v.costPrice) : null
        }))
    };

    return (
        <div>
            <ProductForm initialData={serializedProduct} />
        </div>
    );
}

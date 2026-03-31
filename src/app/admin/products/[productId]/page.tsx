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
            supplier: {
                select: { id: true, name: true }
            },
            images: true,
            similarProducts: {
                select: { id: true, name: true, imageUrl: true, images: { take: 1, select: { url: true } } }
            }
        }
    });

    if (!product) {
        redirect('/admin/products');
    }

    // Calculate total stock (Sum of all inventory across warehouses for this variant)
    const defaultVariant = product.variants[0];
    const currentStock = defaultVariant?.inventory?.reduce((acc, inv) => acc + inv.available, 0) || 0;

    const serializedProduct = {
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        description: product.description,
        descriptionAr: product.descriptionAr,
        detailedDescription: product.detailedDescription,
        detailedDescriptionAr: product.detailedDescriptionAr,
        imageUrl: product.imageUrl,
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        costPrice: product.costPrice ? Number(product.costPrice) : null,
        status: product.status,
        categoryId: product.categoryId,
        brandId: product.brandId,
        materialId: product.materialId,
        supplierId: product.supplierId,
        supplier: product.supplier || null,
        images: product.images || [],
        stock: currentStock,
        showInNewArrivals: product.showInNewArrivals,
        showInForYou: product.showInForYou,
        detailTags: product.detailTags,
        similarProducts: product.similarProducts || [],
        slug: product.slug,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        metaTitleAr: product.metaTitleAr,
        metaDescriptionAr: product.metaDescriptionAr,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        specs: product.specs as any,
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

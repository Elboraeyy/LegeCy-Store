// Shared Product type that works with both database and legacy static data
export interface Product {
    id: string | number;
    name: string;
    nameAr?: string | null;
    price: number;
    compareAtPrice?: number | null;
    category?: string | null;
    categoryAr?: string | null;
    imageUrl?: string | null;
    img?: string; // Legacy field for static data compatibility
    images?: string[];
    brand?: string | null;
    brandAr?: string | null;
    strap?: string | null;
    materialAr?: string | null;
    status?: string;
    description?: string | null;
    descriptionAr?: string | null;
    detailedDescription?: string | null;
    detailedDescriptionAr?: string | null;
    inStock?: boolean;
    isNew?: boolean;
    totalStock?: number;
    createdAt?: string; // For sorting by newest
    cat?: string; // Legacy field
    specs?: {
        movement?: string;
        case?: string;
        waterResistance?: string;
        glass?: string;
    };
    gallery?: string[];
    // Filter fields
    categoryId?: string | null;
    brandId?: string | null;
    materialId?: string | null;
    categorySlug?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLocalized<T extends Record<string, any>>(entity: T | undefined | null, lang: 'en' | 'ar', field: string): string {
    if (!entity) return '';
    if (lang === 'ar') {
        const arField = `${field}Ar`;
        if (entity[arField]) return entity[arField];
    }
    return entity[field] || '';
}

// Helper to normalize product data from different sources
export function normalizeProduct(product: Partial<Product>): Product {
    return {
        id: product.id || '',
        name: product.name || 'Unknown Product',
        nameAr: product.nameAr,
        price: product.price || 0,
        compareAtPrice: product.compareAtPrice,
        category: product.category || product.cat,
        imageUrl: product.imageUrl || product.img,
        img: product.img || product.imageUrl || '/placeholder.jpg',
        images: product.images || product.gallery || [],
        brand: product.brand,
        brandAr: product.brandAr,
        strap: product.strap,
        materialAr: product.materialAr,
        status: product.status || 'active',
        description: product.description,
        descriptionAr: product.descriptionAr,
        detailedDescription: product.detailedDescription,
        detailedDescriptionAr: product.detailedDescriptionAr,
        inStock: product.inStock ?? true,
        isNew: product.isNew,
        totalStock: product.totalStock ?? 0,
        cat: product.cat || product.category || undefined,
        specs: product.specs,
        gallery: product.gallery || product.images || []
    };
}

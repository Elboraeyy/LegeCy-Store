// Shared Product type that works with both database and legacy static data
export interface Product {
    id: string | number;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    category?: string | null;
    imageUrl?: string | null;
    img?: string; // Legacy field for static data compatibility
    images?: string[];
    brand?: string | null;
    strap?: string | null;
    status?: string;
    description?: string | null;
    inStock?: boolean;
    totalStock?: number;
    cat?: string; // Legacy field
    specs?: {
        movement?: string;
        case?: string;
        waterResistance?: string;
        glass?: string;
    };
    gallery?: string[];
}

// Helper to normalize product data from different sources
export function normalizeProduct(product: Partial<Product>): Product {
    return {
        id: product.id || '',
        name: product.name || 'Unknown Product',
        price: product.price || 0,
        compareAtPrice: product.compareAtPrice,
        category: product.category || product.cat,
        imageUrl: product.imageUrl || product.img,
        img: product.img || product.imageUrl || '/placeholder.jpg',
        images: product.images || product.gallery || [],
        brand: product.brand,
        strap: product.strap,
        status: product.status || 'active',
        description: product.description,
        inStock: product.inStock ?? true,
        totalStock: product.totalStock ?? 0,
        cat: product.cat || product.category || undefined,
        specs: product.specs,
        gallery: product.gallery || product.images || []
    };
}

"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ProductSpecs } from "@/types/product";

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  category: string | null;
  categoryAr?: string | null;
  categorySlug?: string | null;
  imageUrl: string | null;
  images: string[];
  brand: string | null;
  brandId?: string | null;
  material: string | null; // Added material slug
  materialId?: string | null;
  categorySortOrder?: number;
  categoryUseCustomOrder?: boolean;
  sortInCategory?: number;
  brandSortOrder?: number;
  brandUseCustomOrder?: boolean;
  sortInBrand?: number;
  materialSortOrder?: number;
  materialUseCustomOrder?: boolean;
  sortInMaterial?: number;
  strap: string | null;
  status: string;
  variantCount: number;
  inStock: boolean;
  defaultVariantId: string | null; // For cart operations
  isNew?: boolean;
  createdAt?: string;
  variants?: { id: string; sku: string; price: number; stock: number }[];
  specs?: ProductSpecs;
  detailTags?: string[];
}

type MerchandisingSection = {
  randomize: boolean;
  selectedProductIds: string[];
  categoryIds: string[];
  includeSoldOut: boolean;
  limit: number;
  sortMode: "manual" | "newest" | "oldest" | "priceAsc" | "priceDesc" | "nameAsc";
  requireNewArrivalFlag?: boolean;
  selectedOnly?: boolean;
};

type MerchandisingSettings = {
  featured: MerchandisingSection;
  newArrivals: MerchandisingSection;
  shop: MerchandisingSection & { showOnlySelectedFirst: boolean };
};

const sortModes = new Set<MerchandisingSection["sortMode"]>([
  "manual",
  "newest",
  "oldest",
  "priceAsc",
  "priceDesc",
  "nameAsc",
]);

const defaultMerchandisingSettings: MerchandisingSettings = {
  featured: {
    randomize: true,
    selectedProductIds: [],
    categoryIds: [],
    includeSoldOut: false,
    limit: 10,
    sortMode: "manual",
    selectedOnly: false,
  },
  newArrivals: {
    randomize: false,
    selectedProductIds: [],
    categoryIds: [],
    includeSoldOut: false,
    limit: 10,
    sortMode: "newest",
    requireNewArrivalFlag: true,
    selectedOnly: false,
  },
  shop: {
    randomize: false,
    selectedProductIds: [],
    categoryIds: [],
    includeSoldOut: true,
    limit: 0,
    sortMode: "manual",
    showOnlySelectedFirst: true,
    selectedOnly: false,
  },
};

async function getMerchandisingSettings(): Promise<MerchandisingSettings> {
  const config = await prisma.storeConfig.findUnique({
    where: { key: "merchandising_settings" },
  });
  const saved = (config?.value || {}) as Partial<MerchandisingSettings>;
  return {
    featured: normalizeSection(defaultMerchandisingSettings.featured, saved.featured),
    newArrivals: normalizeSection(defaultMerchandisingSettings.newArrivals, saved.newArrivals),
    shop: {
      ...normalizeSection(defaultMerchandisingSettings.shop, saved.shop),
      showOnlySelectedFirst:
        typeof saved.shop?.showOnlySelectedFirst === "boolean"
          ? saved.shop.showOnlySelectedFirst
          : defaultMerchandisingSettings.shop.showOnlySelectedFirst,
    },
  };
}

function normalizeSection(
  defaults: MerchandisingSection,
  incoming?: Partial<MerchandisingSection>,
): MerchandisingSection {
  const section = { ...defaults, ...(incoming || {}) };
  return {
    ...section,
    selectedProductIds: Array.isArray(section.selectedProductIds)
      ? section.selectedProductIds.filter((id): id is string => typeof id === "string")
      : [],
    categoryIds: Array.isArray(section.categoryIds)
      ? section.categoryIds.filter((id): id is string => typeof id === "string")
      : [],
    includeSoldOut: section.includeSoldOut === true,
    randomize: section.randomize === true,
    limit: Number.isFinite(section.limit) ? Math.max(0, Math.min(120, Number(section.limit))) : defaults.limit,
    sortMode: sortModes.has(section.sortMode) ? section.sortMode : defaults.sortMode,
    requireNewArrivalFlag: section.requireNewArrivalFlag === true,
    selectedOnly: section.selectedOnly === true,
  };
}

const productInclude = {
  variants: {
    include: {
      inventory: true,
    },
  },
  images: true,
  categoryRel: true,
  brand: true,
  material: true,
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function mapShopProduct(product: ProductWithRelations): ShopProduct {
  const mainVariant = product.variants[0];
  const totalStock = product.variants.reduce(
    (acc, v) => acc + v.inventory.reduce((sum, i) => sum + i.available, 0),
    0,
  );

  return {
    id: product.id,
    name: product.name,
    price: mainVariant ? Number(mainVariant.price) : 0,
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    category: product.categoryRel?.name || product.category,
    categoryAr: product.categoryRel?.nameAr || null,
    categorySlug: product.categoryRel?.slug || null,
    categorySortOrder: product.categoryRel?.sortOrder ?? 0,
    categoryUseCustomOrder: product.categoryRel?.useCustomOrder ?? false,
    sortInCategory: product.sortInCategory,
    brand: product.brand?.slug || null,
    brandId: product.brandId,
    brandSortOrder: product.brand?.sortOrder ?? 0,
    brandUseCustomOrder: product.brand?.useCustomOrder ?? false,
    sortInBrand: product.sortInBrand,
    material: product.material?.slug || null,
    materialId: product.materialId,
    materialSortOrder: product.material?.sortOrder ?? 0,
    materialUseCustomOrder: product.material?.useCustomOrder ?? false,
    sortInMaterial: product.sortInMaterial,
    imageUrl: product.imageUrl,
    images: product.images.map((img) => img.url),
    strap: product.material?.name || null,
    status: "active",
    variantCount: product.variants.length,
    inStock: totalStock > 0,
    defaultVariantId: mainVariant?.id || null,
    isNew: new Date().getTime() - product.createdAt.getTime() < 5 * 24 * 60 * 60 * 1000,
    createdAt: product.createdAt.toISOString(),
    specs: (product.specs ?? undefined) as ProductSpecs | undefined,
    detailTags: product.detailTags,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: Number(v.price),
      stock: v.inventory.reduce((sum, i) => sum + i.available, 0),
    })),
  };
}

function sortProducts(products: ProductWithRelations[], section: MerchandisingSection) {
  if (section.randomize) return [...products].sort(() => Math.random() - 0.5);

  const manualOrder = new Map(section.selectedProductIds.map((id, index) => [id, index]));
  return [...products].sort((a, b) => {
    const aManual = manualOrder.get(a.id);
    const bManual = manualOrder.get(b.id);
    if (aManual !== undefined || bManual !== undefined) {
      return (aManual ?? 999999) - (bManual ?? 999999);
    }

    switch (section.sortMode) {
      case "oldest":
        return a.createdAt.getTime() - b.createdAt.getTime();
      case "priceAsc":
        return Number(a.variants[0]?.price || 0) - Number(b.variants[0]?.price || 0);
      case "priceDesc":
        return Number(b.variants[0]?.price || 0) - Number(a.variants[0]?.price || 0);
      case "nameAsc":
        return a.name.localeCompare(b.name);
      case "manual":
        return 0;
      case "newest":
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });
}

function applyCatalogOrder(products: ProductWithRelations[]) {
  return [...products].sort((a, b) => {
    const categoryOrder =
      (a.categoryRel?.sortOrder ?? 0) - (b.categoryRel?.sortOrder ?? 0);
    if (categoryOrder !== 0) return categoryOrder;

    const brandOrder = (a.brand?.sortOrder ?? 0) - (b.brand?.sortOrder ?? 0);
    if (brandOrder !== 0) return brandOrder;

    const materialOrder =
      (a.material?.sortOrder ?? 0) - (b.material?.sortOrder ?? 0);
    if (materialOrder !== 0) return materialOrder;

    if (
      a.categoryId &&
      a.categoryId === b.categoryId &&
      a.categoryRel?.useCustomOrder
    ) {
      const productOrder = a.sortInCategory - b.sortInCategory;
      if (productOrder !== 0) return productOrder;
    }

    if (a.brandId && a.brandId === b.brandId && a.brand?.useCustomOrder) {
      const productOrder = a.sortInBrand - b.sortInBrand;
      if (productOrder !== 0) return productOrder;
    }

    if (
      a.materialId &&
      a.materialId === b.materialId &&
      a.material?.useCustomOrder
    ) {
      const productOrder = a.sortInMaterial - b.sortInMaterial;
      if (productOrder !== 0) return productOrder;
    }

    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

function stockFiltered(products: ProductWithRelations[], includeSoldOut: boolean) {
  if (includeSoldOut) return products;
  return products.filter((product) =>
    product.variants.some((variant) =>
      variant.inventory.some((inventory) => inventory.available > 0),
    ),
  );
}

async function fetchMerchandisedProducts(section: MerchandisingSection): Promise<ShopProduct[]> {
  const where: Prisma.ProductWhereInput = {
    status: "active",
    ...(section.categoryIds.length ? { categoryId: { in: section.categoryIds } } : {}),
    ...(section.requireNewArrivalFlag ? { showInNewArrivals: true } : {}),
  };

  const pool = await prisma.product.findMany({
    where,
    take: 120,
    orderBy: { createdAt: "desc" },
    include: productInclude,
  });

  const selected = section.selectedProductIds.length
    ? await prisma.product.findMany({
        where: {
          id: { in: section.selectedProductIds },
          status: "active",
          ...(section.requireNewArrivalFlag ? { showInNewArrivals: true } : {}),
        },
        include: productInclude,
      })
    : [];

  if (section.selectedOnly && selected.length === 0) return [];

  const deduped = new Map<string, ProductWithRelations>();
  [...selected, ...(section.selectedOnly ? [] : pool)].forEach((product) =>
    deduped.set(product.id, product),
  );
  const filtered = stockFiltered(Array.from(deduped.values()), section.includeSoldOut);
  const sorted = sortProducts(filtered, section);
  return sorted.slice(0, section.limit || sorted.length).map(mapShopProduct);
}

export async function fetchShopProducts(): Promise<ShopProduct[]> {
  const settings = (await getMerchandisingSettings()).shop;
  const products = await prisma.product.findMany({
    where: {
      // Only show active products on the frontend
      status: "active",
      ...(settings.categoryIds.length ? { categoryId: { in: settings.categoryIds } } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    include: productInclude,
  });

  const selected = settings.selectedProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: settings.selectedProductIds }, status: "active" },
        include: productInclude,
      })
    : [];
  const deduped = new Map<string, ProductWithRelations>();
  [
    ...(settings.showOnlySelectedFirst ? selected : []),
    ...(settings.showOnlySelectedFirst || selected.length === 0 ? products : selected),
  ].forEach((product) => deduped.set(product.id, product));
  const sortedProducts = settings.sortMode === "manual" && !settings.selectedProductIds.length
    ? applyCatalogOrder(stockFiltered(Array.from(deduped.values()), settings.includeSoldOut))
    : sortProducts(stockFiltered(Array.from(deduped.values()), settings.includeSoldOut), settings);

  return sortedProducts
    .map(mapShopProduct);
}

export async function fetchProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          inventory: true,
        },
      },
      images: true,
      categoryRel: true,
    },
  });

  if (!product) return null;

  const mainVariant = product.variants[0];
  const totalStock = product.variants.reduce(
    (acc, v) => acc + v.inventory.reduce((sum, i) => sum + i.available, 0),
    0,
  );

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: mainVariant ? Number(mainVariant.price) : 0,
    compareAtPrice: product.compareAtPrice
      ? Number(product.compareAtPrice)
      : null,
    category: product.categoryRel?.name || product.category,
    categoryAr: product.categoryRel?.nameAr || null,
    categorySlug: product.categoryRel?.slug || null,
    imageUrl: product.imageUrl,
    images: product.images.map((img) => img.url),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: Number(v.price),
      stock: v.inventory.reduce((sum, i) => sum + i.available, 0),
    })),
    inStock: totalStock > 0,
    totalStock,
    specs: (product.specs ?? undefined) as ProductSpecs | undefined,
    isNew:
      new Date().getTime() - product.createdAt.getTime() <
      5 * 24 * 60 * 60 * 1000,
  };
}

export async function deleteAllProducts(): Promise<{
  success: boolean;
  deletedCount: number;
}> {
  try {
    // Delete in order due to foreign key constraints
    await prisma.inventory.deleteMany({});
    await prisma.variant.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.product.deleteMany({});

    return { success: true, deletedCount: 0 };
  } catch (error) {
    console.error("Failed to delete products:", error);
    return { success: false, deletedCount: 0 };
  }
}

export async function fetchRelatedProducts(
  productId: string,
  category: string | null,
): Promise<ShopProduct[]> {
  const whereClause: Prisma.ProductWhereInput = {
    id: { not: productId },
    // status: 'active'
  };

  if (category) {
    whereClause.category = category;
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      variants: {
        include: {
          inventory: true,
        },
      },
      images: true,
      categoryRel: true,
    },
  });

  // If we don't have enough related products by category, fetch latest products
  if (products.length < 4 && category) {
    const additionalProducts = await prisma.product.findMany({
      where: {
        id: { not: productId, notIn: products.map((p) => p.id) },
        // status: 'active'
      },
      take: 4 - products.length,
      orderBy: { createdAt: "desc" },
      include: {
        variants: {
          include: {
            inventory: true,
          },
        },
        images: true,
        categoryRel: true,
      },
    });
    products.push(...additionalProducts);
  }

  return products.map((product) => {
    const mainVariant = product.variants[0];
    const totalStock = product.variants.reduce(
      (acc, v) => acc + v.inventory.reduce((sum, i) => sum + i.available, 0),
      0,
    );

    return {
      id: product.id,
      name: product.name,
      price: mainVariant ? Number(mainVariant.price) : 0,
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null,
      category: product.categoryRel?.name || product.category,
      categoryAr: product.categoryRel?.nameAr || null,
      categorySlug: product.categoryRel?.slug || null,
      imageUrl: product.imageUrl,
      images: product.images.map((img) => img.url),
      brand: null,
      material: null,
      strap: null,
      status: "active",
      variantCount: product.variants.length,
      inStock: totalStock > 0,
      defaultVariantId: mainVariant?.id || null,
      isNew:
        new Date().getTime() - product.createdAt.getTime() <
        5 * 24 * 60 * 60 * 1000,
      specs: (product.specs ?? undefined) as ProductSpecs | undefined,
      detailTags: product.detailTags,
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: Number(v.price),
        stock: v.inventory.reduce((sum, i) => sum + i.available, 0),
      })),
    };
  });
}

// Fetch featured products (for homepage carousel)
export async function fetchFeaturedProducts(
  limit: number = 8,
): Promise<ShopProduct[]> {
  const products = await prisma.product.findMany({
    take: 50, // Fetch a larger pool for better randomization
    orderBy: { createdAt: "desc" },
    include: {
      variants: {
        include: {
          inventory: true,
        },
      },
      images: true,
      brand: true,
      categoryRel: true,
      material: true,
    },
  });

  return products
    .map((product) => {
      const mainVariant = product.variants[0];
      const totalStock = product.variants.reduce(
        (acc, v) => acc + v.inventory.reduce((sum, i) => sum + i.available, 0),
        0,
      );

      return {
        id: product.id,
        name: product.name,
        price: mainVariant ? Number(mainVariant.price) : 0,
        compareAtPrice: product.compareAtPrice
          ? Number(product.compareAtPrice)
          : null,
        category: product.categoryRel?.name || product.category,
        categoryAr: product.categoryRel?.nameAr || null,
        categorySlug: product.categoryRel?.slug || null,
        imageUrl: product.imageUrl,
        images: product.images.map((img) => img.url),
        brand: product.brand?.slug || null,
        brandId: product.brandId,
        material: product.material?.slug || null,
        materialId: product.materialId,
        strap: product.material?.name || null,
        status: "active",
        variantCount: product.variants.length,
        inStock: totalStock > 0,
        defaultVariantId: mainVariant?.id || null,
        isNew:
          new Date().getTime() - product.createdAt.getTime() <
          5 * 24 * 60 * 60 * 1000,
        specs: (product.specs ?? undefined) as ProductSpecs | undefined,
        detailTags: product.detailTags,
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          price: Number(v.price),
          stock: v.inventory.reduce((sum, i) => sum + i.available, 0),
        })),
      };
    })
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

// Fetch new arrivals (products created in last 30 days)
export async function fetchNewArrivals(
  limit: number = 8,
): Promise<ShopProduct[]> {
  const settings = (await getMerchandisingSettings()).newArrivals;
  return fetchMerchandisedProducts({ ...settings, limit });
}

export async function fetchLegacyNewArrivals(
  limit: number = 8,
): Promise<ShopProduct[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const products = await prisma.product.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: "active",
      showInNewArrivals: true,
    },
    take: limit, // Fetch exactly what's needed since it's sorted by date descending
    orderBy: { createdAt: "desc" },
    include: {
      variants: {
        include: {
          inventory: true,
        },
      },
      images: true,
      brand: true,
      categoryRel: true,
      material: true,
    },
  });
  return products.map((product) => {
    const mainVariant = product.variants[0];
    const totalStock = product.variants.reduce(
      (acc, v) => acc + v.inventory.reduce((sum, i) => sum + i.available, 0),
      0,
    );

    return {
      id: product.id,
      name: product.name,
      price: mainVariant ? Number(mainVariant.price) : 0,
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null,
      category: product.categoryRel?.name || product.category,
      categoryAr: product.categoryRel?.nameAr || null,
      categorySlug: product.categoryRel?.slug || null,
      imageUrl: product.imageUrl,
      images: product.images.map((img) => img.url),
      brand: product.brand?.slug || null,
      material: product.material?.slug || null,
      strap: product.material?.name || null,
      status: "active",
      variantCount: product.variants.length,
      inStock: totalStock > 0,
      defaultVariantId: mainVariant?.id || null,
      isNew:
        new Date().getTime() - product.createdAt.getTime() <
        5 * 24 * 60 * 60 * 1000,
      specs: (product.specs ?? undefined) as ProductSpecs | undefined,
      detailTags: product.detailTags,
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: Number(v.price),
        stock: v.inventory.reduce((sum, i) => sum + i.available, 0),
      })),
    };
  });
}

// Fetch "For You" products (Curated list)
export async function fetchForYouProducts(
  limit: number = 8,
): Promise<ShopProduct[]> {
  const settings = (await getMerchandisingSettings()).featured;
  const hasExplicitCuration =
    !settings.randomize ||
    settings.selectedProductIds.length > 0 ||
    settings.categoryIds.length > 0;
  if (!hasExplicitCuration) {
    const legacyProducts = await prisma.product.findMany({
      where: { status: "active", showInForYou: true },
      take: 50,
      orderBy: { updatedAt: "desc" },
      include: productInclude,
    });
    return stockFiltered(legacyProducts, settings.includeSoldOut)
      .map(mapShopProduct)
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }

  const products = await fetchMerchandisedProducts({ ...settings, limit });
  return products;
}

// Fetch random products (for cart recommendations)
export async function fetchRandomProducts(
  limit: number = 8,
): Promise<ShopProduct[]> {
  // 1. Get total number of active products
  const totalCount = await prisma.product.count({
    where: { status: "active" },
  });

  if (totalCount === 0) return [];

  // 2. Select random skip values
  // We fetch a bit more than needed to ensure variety and then shuffle
  const skip = Math.max(
    0,
    Math.floor(Math.random() * Math.max(0, totalCount - limit)),
  );

  const products = await prisma.product.findMany({
    where: { status: "active" },
    take: limit * 2, // Fetch double to shuffle more effectively
    skip: skip,
    include: {
      variants: {
        include: {
          inventory: true,
        },
      },
      images: true,
      brand: true,
      categoryRel: true,
      material: true,
    },
  });

  // 3. Shuffle the result
  const shuffled = [...products]
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);

  return shuffled.map((product) => {
    const mainVariant = product.variants[0];
    const totalStock = product.variants.reduce(
      (acc, v) => acc + v.inventory.reduce((sum, i) => sum + i.available, 0),
      0,
    );

    return {
      id: product.id,
      name: product.name,
      price: mainVariant ? Number(mainVariant.price) : 0,
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null,
      category: product.categoryRel?.name || product.category,
      categoryAr: product.categoryRel?.nameAr || null,
      categorySlug: product.categoryRel?.slug || null,
      imageUrl: product.imageUrl,
      images: product.images.map((img) => img.url),
      brand: product.brand?.slug || null,
      material: product.material?.slug || null,
      strap: product.material?.name || null,
      status: "active",
      variantCount: product.variants.length,
      inStock: totalStock > 0,
      defaultVariantId: mainVariant?.id || null,
      isNew:
        new Date().getTime() - product.createdAt.getTime() <
        5 * 24 * 60 * 60 * 1000,
      specs: (product.specs ?? undefined) as ProductSpecs | undefined,
      detailTags: product.detailTags,
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: Number(v.price),
        stock: v.inventory.reduce((sum, i) => sum + i.available, 0),
      })),
    };
  });
}

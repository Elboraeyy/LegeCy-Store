import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prismaClient from "@/lib/prisma";
import { validateMobileToken, unauthorizedResponse } from "@/lib/auth/mobile-auth";

const prisma = prismaClient!;

type SortMode = "manual" | "newest" | "oldest" | "priceAsc" | "priceDesc" | "nameAsc";

type MerchandisingSection = {
  randomize: boolean;
  selectedProductIds: string[];
  categoryIds: string[];
  includeSoldOut: boolean;
  limit: number;
  sortMode: SortMode;
  requireNewArrivalFlag?: boolean;
  selectedOnly?: boolean;
};

type MerchandisingSettings = {
  featured: MerchandisingSection;
  newArrivals: MerchandisingSection;
  shop: MerchandisingSection & { showOnlySelectedFirst: boolean };
};

const defaultSettings: MerchandisingSettings = {
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

const sortModes = new Set<SortMode>(["manual", "newest", "oldest", "priceAsc", "priceDesc", "nameAsc"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((id): id is string => typeof id === "string")
    : [];
}

function normalizeSection(defaults: MerchandisingSection, incoming: unknown = {}) {
  const section = isRecord(incoming) ? incoming : {};
  const sortMode = section.sortMode;
  const limit = section.limit;

  return {
    ...defaults,
    randomize:
      typeof section.randomize === "boolean" ? section.randomize : defaults.randomize,
    selectedProductIds: stringList(section.selectedProductIds),
    categoryIds: stringList(section.categoryIds),
    includeSoldOut:
      typeof section.includeSoldOut === "boolean"
        ? section.includeSoldOut
        : defaults.includeSoldOut,
    limit: typeof limit === "number" && Number.isFinite(limit)
      ? Math.max(0, Math.min(120, limit))
      : defaults.limit,
    sortMode: typeof sortMode === "string" && sortModes.has(sortMode as SortMode)
      ? (sortMode as SortMode)
      : defaults.sortMode,
    requireNewArrivalFlag:
      typeof section.requireNewArrivalFlag === "boolean"
        ? section.requireNewArrivalFlag
        : defaults.requireNewArrivalFlag,
    selectedOnly:
      typeof section.selectedOnly === "boolean"
        ? section.selectedOnly
        : defaults.selectedOnly,
  };
}

function normalizeSettings(value: unknown = {}): MerchandisingSettings {
  const source = isRecord(value) ? value : {};
  const shop = isRecord(source.shop) ? source.shop : {};

  return {
    featured: normalizeSection(defaultSettings.featured, source.featured),
    newArrivals: normalizeSection(defaultSettings.newArrivals, source.newArrivals),
    shop: {
      ...normalizeSection(defaultSettings.shop, source.shop),
      showOnlySelectedFirst:
        typeof shop.showOnlySelectedFirst === "boolean"
          ? shop.showOnlySelectedFirst
          : defaultSettings.shop.showOnlySelectedFirst,
    },
  };
}

export async function GET(request: NextRequest) {
  const admin = await validateMobileToken(request);
  if (!admin) return unauthorizedResponse();

  try {
    const [config, products, categories] = await Promise.all([
      prisma.storeConfig.findUnique({ where: { key: "merchandising_settings" } }),
      prisma.product.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          categoryId: true,
          showInForYou: true,
          showInNewArrivals: true,
          categoryRel: { select: { name: true } },
          variants: {
            select: {
              price: true,
              inventory: { select: { available: true } },
            },
          },
        },
      }),
      prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true },
      }),
    ]);

    return NextResponse.json({
      settings: normalizeSettings(config?.value),
      products: products.map((product) => {
        const stock = product.variants.reduce(
          (sum, variant) =>
            sum + variant.inventory.reduce((inner, item) => inner + item.available, 0),
          0,
        );
        return {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          categoryId: product.categoryId,
          categoryName: product.categoryRel?.name,
          price: Number(product.variants[0]?.price || 0),
          totalStock: stock,
          inStock: stock > 0,
          showInForYou: product.showInForYou,
          showInNewArrivals: product.showInNewArrivals,
        };
      }),
      categories,
    });
  } catch (error) {
    console.error("Merchandising GET error:", error);
    return NextResponse.json({ error: "Failed to load merchandising settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await validateMobileToken(request);
  if (!admin) return unauthorizedResponse();

  try {
    const body: unknown = await request.json();
    const value = normalizeSettings(body);

    const config = await prisma.storeConfig.upsert({
      where: { key: "merchandising_settings" },
      update: {
        value,
        description: "Mobile admin merchandising controls for homepage and shop product display",
      },
      create: {
        key: "merchandising_settings",
        value,
        description: "Mobile admin merchandising controls for homepage and shop product display",
      },
    });

    revalidatePath("/");
    revalidatePath("/shop");

    return NextResponse.json({
      settings: config.value,
      message: "Merchandising settings saved and synced",
    });
  } catch (error) {
    console.error("Merchandising PUT error:", error);
    return NextResponse.json({ error: "Failed to save merchandising settings" }, { status: 500 });
  }
}

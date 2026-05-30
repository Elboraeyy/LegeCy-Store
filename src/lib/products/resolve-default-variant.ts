import type { Prisma, PrismaClient, Variant } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function resolveDefaultVariant(
  db: DbClient,
  productId: string,
): Promise<Variant | null> {
  return db.variant.findFirst({
    where: { productId },
    orderBy: { createdAt: "asc" },
  });
}

export async function resolveVariantForProduct(
  db: DbClient,
  productId: string,
  variantId?: string | null,
): Promise<Variant | null> {
  if (variantId) {
    return db.variant.findFirst({
      where: { id: variantId, productId },
    });
  }

  return resolveDefaultVariant(db, productId);
}

export async function resolveDefaultVariantsMap(
  db: DbClient,
  productIds: string[],
): Promise<Map<string, Variant>> {
  const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));
  if (uniqueProductIds.length === 0) return new Map();

  const variants = await db.variant.findMany({
    where: { productId: { in: uniqueProductIds } },
    orderBy: [{ productId: "asc" }, { createdAt: "asc" }],
  });

  const map = new Map<string, Variant>();
  for (const variant of variants) {
    if (!map.has(variant.productId)) {
      map.set(variant.productId, variant);
    }
  }

  return map;
}

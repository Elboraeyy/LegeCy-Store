type VariantInventoryLike = {
  available?: number | null;
};

type VariantLike = {
  id: string;
  sku?: string | null;
  price?: unknown;
  costPrice?: unknown;
  inventory?: VariantInventoryLike[] | null;
};

export function getPrimaryVariant<T extends VariantLike>(
  variants: T[] | null | undefined,
): T | null {
  return variants?.[0] ?? null;
}

export function getPrimaryVariantId(
  variants: VariantLike[] | null | undefined,
): string | null {
  return getPrimaryVariant(variants)?.id ?? null;
}

export function getPrimaryVariantStock(
  variants: VariantLike[] | null | undefined,
): number {
  const variant = getPrimaryVariant(variants);
  return (
    variant?.inventory?.reduce((sum, item) => sum + (item.available ?? 0), 0) ??
    0
  );
}

export function getPrimaryVariantNumber(
  variants: VariantLike[] | null | undefined,
  field: "price" | "costPrice",
): number {
  const value = getPrimaryVariant(variants)?.[field];
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (value && typeof value === "object" && "toNumber" in value) {
    const toNumber = (value as { toNumber?: () => number }).toNumber;
    return typeof toNumber === "function" ? toNumber() : 0;
  }
  return 0;
}

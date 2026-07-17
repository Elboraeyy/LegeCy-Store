import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper function to clean text for TSV (removes HTML, tabs, newlines, and collapses spaces)
function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[\r\n\t]+/g, " ") // Replace newlines and tabs with spaces
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const download = searchParams.get("download") === "true";
    const lang = searchParams.get("lang") || "ar"; // default to Arabic feed

    // 1. Determine site base URL (domain)
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || "http://localhost:3000";

    // 2. Fetch active products with variants, brand, and additional images
    const products = await prisma.product.findMany({
      where: {
        status: "active",
      },
      include: {
        variants: {
          include: {
            inventory: {
              select: { available: true },
            },
          },
        },
        brand: { select: { name: true } },
        categoryRel: { select: { name: true, nameAr: true } },
        images: { select: { url: true } },
      },
    });

    // TSV Headers
    const headers = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "sale_price",
      "link",
      "image_link",
      "additional_image_link",
      "brand",
      "item_group_id",
      "google_product_category"
    ];

    const rows: string[][] = [headers];

    for (const product of products) {
      // Determine product-level image
      let mainImageUrl = product.imageUrl || "";
      if (mainImageUrl && !mainImageUrl.startsWith("http")) {
        mainImageUrl = `${siteUrl}${mainImageUrl.startsWith("/") ? "" : "/"}${mainImageUrl}`;
      }

      // Collect additional images
      const additionalImageUrls = product.images
        .map((img) => {
          let url = img.url;
          if (url && !url.startsWith("http")) {
            url = `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
          }
          return url;
        })
        .filter((url) => url && url !== mainImageUrl);

      // If we don't have a main image but have additional images, use the first one as main
      if (!mainImageUrl && additionalImageUrls.length > 0) {
        mainImageUrl = additionalImageUrls.shift() || "";
      }

      // Skip products with no image (Facebook requires an image)
      if (!mainImageUrl) continue;

      // Skip products with no variants
      if (!product.variants || product.variants.length === 0) continue;

      for (const variant of product.variants) {
        // Unique ID (Variant SKU or fallback to product-variant combo)
        const id = variant.sku || `${product.id}-${variant.id}`;

        // Product Title: Prefer selected language name, fallback to other
        const titleText = lang === "ar" 
          ? (product.nameAr || product.name) 
          : (product.name || product.nameAr || "");
        
        // Product Description: Prefer selected language description, fallback to title
        const descText = lang === "ar"
          ? (product.descriptionAr || product.description || titleText)
          : (product.description || product.descriptionAr || titleText);

        const title = cleanText(titleText);
        const description = cleanText(descText);

        // Calculate Stock
        const totalStock = variant.inventory?.reduce((sum, item) => sum + (item.available ?? 0), 0) ?? 0;
        const availability = totalStock > 0 ? "in stock" : "out of stock";

        const condition = "new";

        // Price formatting
        const variantPrice = Number(variant.price);
        const comparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;

        let priceStr = "";
        let salePriceStr = "";

        if (comparePrice && comparePrice > variantPrice) {
          // It's on sale
          priceStr = `${comparePrice.toFixed(2)} EGP`;
          salePriceStr = `${variantPrice.toFixed(2)} EGP`;
        } else {
          // Regular price
          priceStr = `${variantPrice.toFixed(2)} EGP`;
        }

        // Links
        const link = `${siteUrl}/product/${product.id}`;

        // Brand
        const brandName = product.brand?.name || "LegeCy Store";

        // Google Product Category (optional - can map from category name)
        const categoryName = product.categoryRel?.name || product.category || "";

        // Construct Row
        const row = [
          id,
          title,
          description,
          availability,
          condition,
          priceStr,
          salePriceStr,
          link,
          mainImageUrl,
          additionalImageUrls.slice(0, 10).join(","), // Facebook accepts up to 10 additional images comma-separated
          brandName,
          product.id, // item_group_id
          categoryName
        ];

        rows.push(row);
      }
    }

    // Convert rows to TSV string
    const tsvContent = rows
      .map((row) => row.map((val) => val.replace(/\t/g, " ")).join("\t")) // Ensure no internal tabs break formatting
      .join("\n");

    // Return TSV response
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "text/tab-separated-values; charset=utf-8");
    
    if (download) {
      responseHeaders.set("Content-Disposition", `attachment; filename="facebook-catalog-${lang}.tsv"`);
    }

    return new Response(tsvContent, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Facebook Feed API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate Facebook feed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';
import { getPrimaryVariantId } from '@/lib/products/primary-variant';

/**
 * GET /api/admin/auth/products
 * List products with search, filter by status/category, pagination
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const categoryId = searchParams.get('categoryId');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;
        const hasStock = searchParams.get('hasStock') === 'true';

        const where: Record<string, unknown> = {};
        if (status && status !== 'all') where.status = status;
        if (categoryId) where.categoryId = categoryId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { nameAr: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (hasStock) {
            where.variants = {
                some: {
                    inventory: {
                        some: {
                            available: {
                                gt: 0
                            }
                        }
                    }
                }
            };
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    nameAr: true,
                    description: true,
                    descriptionAr: true,
                    detailedDescription: true,
                    detailedDescriptionAr: true,
                    imageUrl: true,
                    status: true,
                    category: true,
                    categoryId: true,
                    createdAt: true,
                    compareAtPrice: true,
                    costPrice: true,
                    brandId: true,
                    materialId: true,
                    supplierId: true,
                    showInNewArrivals: true,
                    showInForYou: true,
                    detailTags: true,
                    metaTitle: true,
                    metaTitleAr: true,
                    metaDescription: true,
                    metaDescriptionAr: true,
                    slug: true,
                    specs: true,
                    images: true,
                    brand: { select: { id: true, name: true } },
                    material: { select: { id: true, name: true } },
                    categoryRel: { select: { id: true, name: true } },
                    variants: {
                        select: { 
                            id: true, 
                            sku: true, 
                            price: true,
                            costPrice: true,
                            inventory: { select: { available: true, minStock: true } }
                        },
                    },
                    _count: { select: { variants: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({
            products: products.map(p => {
                const variantsWithStock = p.variants.map(v => ({
                    ...v,
                    stockQuantity: v.inventory?.reduce((sum: number, inv: { available: number }) => sum + inv.available, 0) || 0
                }));
                return {
                    ...p,
                    variants: variantsWithStock,
                    defaultVariantId: getPrimaryVariantId(variantsWithStock),
                    sku: variantsWithStock[0]?.sku || null,
                    price: variantsWithStock[0]?.price?.toNumber() || 0,
                    variantCount: p._count.variants,
                    totalStock: variantsWithStock.reduce((sum, v) => sum + v.stockQuantity, 0),
                };
            }),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Mobile Products List Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

/**
 * POST /api/admin/auth/products
 * Create a new product (basic info)
 */
export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { 
            name, nameAr, description, descriptionAr, categoryId, status, price, sku,
            detailedDescription, detailedDescriptionAr, compareAtPrice, costPrice,
            brandId, materialId, supplierId, showInNewArrivals, showInForYou,
            detailTags, metaTitle, metaTitleAr, metaDescription, metaDescriptionAr,
            slug, specs, imageUrl, gallery, stock, purchaseDate, minStock
        } = body;

        if (!name || !sku || price === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const date = new Date(purchaseDate || Date.now());

        const product = await prisma.$transaction(async (tx) => {
            const created = await tx.product.create({
                data: {
                    name,
                    nameAr,
                    description,
                    descriptionAr,
                    detailedDescription,
                    detailedDescriptionAr,
                    categoryId: categoryId || null,
                    brandId: brandId || null,
                    materialId: materialId || null,
                    supplierId: supplierId || null,
                    status: status || 'draft',
                    compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
                    costPrice: costPrice ? parseFloat(costPrice) : null,
                    imageUrl,
                    showInNewArrivals: showInNewArrivals ?? true,
                    showInForYou: showInForYou ?? true,
                    detailTags: detailTags || [],
                    metaTitle,
                    metaTitleAr,
                    metaDescription,
                    metaDescriptionAr,
                    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6),
                    specs: specs || {},
                    variants: {
                        create: {
                            sku,
                            price: parseFloat(price),
                            costPrice: costPrice ? parseFloat(costPrice) : null,
                        }
                    },
                    images: gallery && gallery.length > 0 ? {
                        create: gallery.map((url: string) => ({ url }))
                    } : undefined
                },
                include: { variants: true }
            });

            // Handle Smart Inventory if stock is provided
            const initialStock = parseInt(stock) || 0;
            const parsedMinStock = minStock !== undefined ? parseInt(minStock) : 5;
            const variantId = created.variants[0].id;

            let warehouse = await tx.warehouse.findFirst({ where: { type: 'MAIN' } });
            if (!warehouse) {
                warehouse = await tx.warehouse.create({
                    data: { name: 'Main Warehouse', code: 'WH-MAIN', type: 'MAIN', country: 'Egypt' }
                });
            }

            if (initialStock > 0) {
                let actualSupplierId = supplierId;
                if (!actualSupplierId) {
                    const defSup = await tx.supplier.findFirst({ where: { name: 'Default Supplier' } });
                    actualSupplierId = defSup ? defSup.id : (await tx.supplier.create({ data: { name: 'Default Supplier' } })).id;
                }

                // Create Invoice
                const invoice = await tx.purchaseInvoice.create({
                    data: {
                        invoiceNumber: `INV-INIT-${Date.now()}`,
                        supplierId: actualSupplierId,
                        issueDate: date,
                        subtotal: (Number(created.costPrice) || 0) * initialStock,
                        taxTotal: 0,
                        shippingTotal: 0,
                        discountTotal: 0,
                        grandTotal: (Number(created.costPrice) || 0) * initialStock,
                        status: 'POSTED',
                    }
                });

                // Create Invoice Item
                const invoiceItem = await tx.purchaseInvoiceItem.create({
                    data: {
                        invoiceId: invoice.id,
                        productId: created.id,
                        variantId: variantId,
                        description: `Initial stock for ${created.name}`,
                        quantity: initialStock,
                        unitCost: Number(created.costPrice) || 0,
                        finalUnitCost: Number(created.costPrice) || 0,
                        totalCost: (Number(created.costPrice) || 0) * initialStock,
                    }
                });

                // Create Stock In Event
                const stockIn = await tx.stockInEvent.create({
                    data: {
                        invoiceId: invoice.id,
                        warehouseId: warehouse.id,
                        postedBy: admin.id,
                        postedAt: date,
                    }
                });

                // Create Inventory Batch
                await tx.inventoryBatch.create({
                    data: {
                        stockInId: stockIn.id,
                        variantId: variantId,
                        purchaseItemId: invoiceItem.id,
                        initialQuantity: initialStock,
                        remainingQuantity: initialStock,
                        unitCost: Number(created.costPrice) || 0,
                        sellPrice: created.variants[0].price,
                        compareAtPrice: created.compareAtPrice,
                        expenses: Number((specs as Record<string, unknown> & { additionalCosts?: number })?.additionalCosts || 0),
                        isPriceApplied: true,
                        createdAt: date,
                    }
                });

                // Update Main Inventory counts
                await tx.inventory.create({
                    data: {
                        warehouseId: warehouse.id,
                        variantId: variantId,
                        available: initialStock,
                        minStock: parsedMinStock,
                    }
                });

                // Create Inventory Log
                await tx.inventoryLog.create({
                    data: {
                        warehouseId: warehouse.id,
                        variantId: variantId,
                        action: 'STOCK_IN_MANUAL',
                        quantity: initialStock,
                        reason: 'Initial stock on product creation',
                        adminId: admin.id,
                    }
                });
            } else {
                // If initial stock is 0, just create the Inventory record with the minStock threshold
                await tx.inventory.create({
                    data: {
                        warehouseId: warehouse.id,
                        variantId: variantId,
                        available: 0,
                        minStock: parsedMinStock,
                    }
                });
            }

            return created;
        });

        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error('Mobile Product Create Error:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}

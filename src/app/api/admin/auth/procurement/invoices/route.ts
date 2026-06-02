import { NextRequest, NextResponse } from "next/server";
import prismaClient from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
const prisma = prismaClient!;

export async function GET() {
    try {
        const invoices = await prisma.purchaseInvoice.findMany({
            orderBy: { createdAt: 'desc' },
            include: { supplier: true }
        });

        return NextResponse.json({
            invoices: invoices.map(inv => ({
                ...inv,
                subtotal: Number(inv.subtotal),
                taxTotal: Number(inv.taxTotal),
                shippingTotal: Number(inv.shippingTotal),
                discountTotal: Number(inv.discountTotal),
                grandTotal: Number(inv.grandTotal),
                paidAmount: Number(inv.paidAmount),
                remainingAmount: Number(inv.remainingAmount),
                exchangeRate: Number(inv.exchangeRate),
            }))
        });
    } catch (error) {
        console.error('Purchase Invoices GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}

interface DraftProductInput {
    name: string;
    nameAr?: string | null;
    description?: string | null;
    descriptionAr?: string | null;
    detailedDescription?: string | null;
    detailedDescriptionAr?: string | null;
    categoryId?: string | null;
    brandId?: string | null;
    materialId?: string | null;
    supplierId?: string | null;
    status?: string | null;
    compareAtPrice?: string | number | null;
    costPrice?: string | number | null;
    imageUrl?: string | null;
    showInNewArrivals?: boolean | null;
    showInForYou?: boolean | null;
    detailTags?: string[] | null;
    metaTitle?: string | null;
    metaTitleAr?: string | null;
    metaDescription?: string | null;
    metaDescriptionAr?: string | null;
    slug?: string | null;
    specs?: Prisma.InputJsonValue;
    sku: string;
    price: string | number;
    gallery?: string[];
    minStock?: string | number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            invoiceNumber, 
            supplierId, 
            issueDate, 
            status, 
            subtotal,
            taxTotal,
            shippingTotal,
            discountTotal,
            grandTotal, 
            notes,
            safeId,
            adminId,
            items 
        } = body;

        if (!invoiceNumber || !supplierId || !issueDate) {
            return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
        }

        const isPosted = status === 'POSTED';
        const paymentStatus = isPosted ? 'PAID' : 'UNPAID';
        const paidAmount = isPosted ? Number(grandTotal) : 0;
        const remainingAmount = isPosted ? 0 : Number(grandTotal);

        if (isPosted && !safeId) {
            return NextResponse.json({ error: 'Deduction Safe is required when posting invoice' }, { status: 400 });
        }

        const invoice = await prisma.$transaction(async (tx) => {
            const createdProductsCache: Record<string, { productId: string; variantId: string }> = {};

            const createDraftProduct = async (tx: Prisma.TransactionClient, pd: DraftProductInput) => {
                const baseSlug = pd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

                const createdProduct = await tx.product.create({
                    data: {
                        name: pd.name,
                        nameAr: pd.nameAr || null,
                        description: pd.description || null,
                        descriptionAr: pd.descriptionAr || null,
                        detailedDescription: pd.detailedDescription || null,
                        detailedDescriptionAr: pd.detailedDescriptionAr || null,
                        categoryId: pd.categoryId || null,
                        brandId: pd.brandId || null,
                        materialId: pd.materialId || null,
                        supplierId: pd.supplierId || null,
                        status: pd.status || 'draft',
                        compareAtPrice: pd.compareAtPrice ? Number(pd.compareAtPrice) : null,
                        costPrice: pd.costPrice ? Number(pd.costPrice) : null,
                        imageUrl: pd.imageUrl || null,
                        showInNewArrivals: pd.showInNewArrivals ?? true,
                        showInForYou: pd.showInForYou ?? true,
                        detailTags: pd.detailTags || [],
                        metaTitle: pd.metaTitle || null,
                        metaTitleAr: pd.metaTitleAr || null,
                        metaDescription: pd.metaDescription || null,
                        metaDescriptionAr: pd.metaDescriptionAr || null,
                        slug: pd.slug || uniqueSlug,
                        specs: (pd.specs as Prisma.InputJsonObject) || {},
                        variants: {
                            create: {
                                sku: pd.sku,
                                price: Number(pd.price),
                                costPrice: pd.costPrice ? Number(pd.costPrice) : null,
                            }
                        },
                        images: pd.gallery && pd.gallery.length > 0 ? {
                            create: pd.gallery.map((url: string) => ({ url }))
                        } : undefined
                    },
                    include: { variants: true }
                });

                let warehouse = await tx.warehouse.findFirst({ where: { type: 'MAIN' } });
                if (!warehouse) {
                    warehouse = await tx.warehouse.create({
                        data: { name: 'Main Warehouse', code: 'WH-MAIN', type: 'MAIN', country: 'Egypt' }
                    });
                }

                const parsedMinStock = pd.minStock ? parseInt(String(pd.minStock)) : 5;
                await tx.inventory.create({
                    data: {
                        warehouseId: warehouse.id,
                        variantId: createdProduct.variants[0].id,
                        available: 0,
                        minStock: Number.isFinite(parsedMinStock) ? parsedMinStock : 5,
                    }
                });

                return createdProduct;
            };

            // 1. Create Purchase Invoice
            const inv = await tx.purchaseInvoice.create({
                data: {
                    invoiceNumber,
                    supplierId,
                    issueDate: new Date(issueDate),
                    status: status || 'DRAFT',
                    paymentStatus,
                    subtotal: Number(subtotal || grandTotal),
                    taxTotal: Number(taxTotal || 0),
                    shippingTotal: Number(shippingTotal || 0),
                    discountTotal: Number(discountTotal || 0),
                    grandTotal: Number(grandTotal),
                    paidAmount,
                    remainingAmount,
                    notes,
                },
                include: { supplier: true }
            });

            // If DRAFT, only record invoice and draft items, do not update inventory or safes
            if (!isPosted) {
                if (items && Array.isArray(items)) {
                    for (const item of items) {
                        const { productId, variantId, quantity, unitCost } = item;

                        let finalProductId = productId;
                        let finalVariantId = variantId;

                        if (item.isDraftProduct && item.productData) {
                            const cacheKey = item.productId || item.productData.sku;
                            if (createdProductsCache[cacheKey]) {
                                finalProductId = createdProductsCache[cacheKey].productId;
                                finalVariantId = createdProductsCache[cacheKey].variantId;
                            } else {
                                const createdProduct = await createDraftProduct(tx, item.productData);
                                finalProductId = createdProduct.id;
                                finalVariantId = createdProduct.variants[0].id;
                                createdProductsCache[cacheKey] = {
                                    productId: finalProductId,
                                    variantId: finalVariantId,
                                };
                            }
                        }

                        const variant = finalVariantId
                            ? await tx.variant.findFirst({ where: { id: finalVariantId, productId: finalProductId } })
                            : await tx.variant.findFirst({ where: { productId: finalProductId }, orderBy: { createdAt: 'asc' } });
                        if (!variant) throw new Error(`Product variant not found for item: ${finalProductId}`);

                        await tx.purchaseInvoiceItem.create({
                            data: {
                                invoiceId: inv.id,
                                productId: finalProductId,
                                variantId: variant.id,
                                description: `Draft purchase item`,
                                quantity: Math.trunc(Number(quantity)),
                                unitCost: Number(unitCost),
                                finalUnitCost: Number(unitCost),
                                totalCost: Number(unitCost) * Math.trunc(Number(quantity)),
                            }
                        });
                    }
                }
                return inv;
            }

            // 2. For POSTED: Deduct payment from selected Safe
            const safe = await tx.safe.findUnique({ where: { id: safeId } });
            if (!safe) throw new Error('Selected Safe not found');

            await tx.safe.update({
                where: { id: safeId },
                data: { balance: { decrement: Number(grandTotal) } }
            });

            // Find or create 'Inventory Purchase' category
            let category = await tx.expenseCategory.findFirst({
                where: { name: { in: ['Inventory Purchase', 'Procurement', 'المشتريات', 'مشتريات بضائع'] } }
            });
            if (!category) {
                category = await tx.expenseCategory.create({
                    data: {
                        name: 'Inventory Purchase',
                        code: 'INV-PURCHASE'
                    }
                });
            }

            // Create Expense record
            const expense = await tx.expense.create({
                data: {
                    description: `Purchase Invoice #${invoiceNumber} - ${inv.supplier?.name || 'Supplier'}`,
                    amount: Number(grandTotal),
                    date: new Date(issueDate),
                    categoryId: category.id,
                    status: 'PAID',
                    safeId,
                    expenseType: 'CAPITAL',
                    paidBy: adminId || 'SYSTEM',
                }
            });

            // 3. Log Safe Transaction
            await tx.safeTransaction.create({
                data: {
                    safeId,
                    type: 'DEBIT',
                    amount: Number(grandTotal),
                    balanceAfter: Number(safe.balance) - Number(grandTotal),
                    description: `Paid for Purchase Invoice #${invoiceNumber}`,
                    referenceType: 'EXPENSE',
                    referenceId: expense.id,
                }
            });

            // 4. Create Invoice Payment record
            await tx.invoicePayment.create({
                data: {
                    invoiceId: inv.id,
                    amount: Number(grandTotal),
                    method: 'SAFE',
                    reference: safe.name,
                    recordedBy: adminId || 'SYSTEM',
                }
            });

            // 5. Get main warehouse for inventory stocking
            let warehouse = await tx.warehouse.findFirst({ where: { type: 'MAIN' } });
            if (!warehouse) {
                warehouse = await tx.warehouse.create({
                    data: { name: 'Main Warehouse', code: 'WH-MAIN', type: 'MAIN', country: 'Egypt' }
                });
            }

            // 6. Create Stock In Event
            const stockIn = await tx.stockInEvent.create({
                data: {
                    invoiceId: inv.id,
                    warehouseId: warehouse.id,
                    postedBy: adminId || 'SYSTEM',
                    postedAt: new Date(issueDate),
                }
            });

            // 7. Loop through items to create batches, update inventory and apply pricing rules
            if (items && Array.isArray(items)) {
                for (const item of items) {
                    const { 
                        productId, variantId, quantity, unitCost, sellPrice, expenses,
                        keepOldCost = true, keepOldSellPrice = true, keepOldExpenses = true 
                    } = item;

                    let finalProductId = productId;
                    let finalVariantId = variantId;

                    if (item.isDraftProduct && item.productData) {
                        const cacheKey = item.productId || item.productData.sku;
                        if (createdProductsCache[cacheKey]) {
                            finalProductId = createdProductsCache[cacheKey].productId;
                            finalVariantId = createdProductsCache[cacheKey].variantId;
                        } else {
                            const createdProduct = await createDraftProduct(tx, item.productData);
                            finalProductId = createdProduct.id;
                            finalVariantId = createdProduct.variants[0].id;
                            createdProductsCache[cacheKey] = {
                                productId: finalProductId,
                                variantId: finalVariantId,
                            };
                        }
                    }

                    const variant = finalVariantId
                        ? await tx.variant.findFirst({ where: { id: finalVariantId, productId: finalProductId } })
                        : await tx.variant.findFirst({ where: { productId: finalProductId }, orderBy: { createdAt: 'asc' } });
                    
                    if (!variant) throw new Error(`Product variant not found for item: ${finalProductId}`);

                    const parsedQty = Math.trunc(Number(quantity));

                    // Create Invoice Item
                    const invoiceItem = await tx.purchaseInvoiceItem.create({
                        data: {
                            invoiceId: inv.id,
                            productId: finalProductId,
                            variantId: variant.id,
                            description: `Purchase batch addition`,
                            quantity: parsedQty,
                            unitCost: Number(unitCost),
                            finalUnitCost: Number(unitCost),
                            totalCost: Number(unitCost) * parsedQty,
                        }
                    });

                    // Create Inventory Batch
                    const batch = await tx.inventoryBatch.create({
                        data: {
                            stockInId: stockIn.id,
                            variantId: variant.id,
                            purchaseItemId: invoiceItem.id,
                            initialQuantity: parsedQty,
                            remainingQuantity: parsedQty,
                            unitCost: Number(unitCost),
                            sellPrice: keepOldSellPrice ? null : Number(sellPrice),
                            compareAtPrice: null,
                            expenses: keepOldExpenses ? null : Number(expenses),
                            isPriceApplied: false,
                            createdAt: new Date(issueDate),
                        }
                    });

                    // Upsert Inventory records
                    await tx.inventory.upsert({
                        where: {
                            warehouseId_variantId: {
                                warehouseId: warehouse.id,
                                variantId: variant.id
                            }
                        },
                        update: {
                            available: { increment: parsedQty }
                        },
                        create: {
                            warehouseId: warehouse.id,
                            variantId: variant.id,
                            available: parsedQty,
                            minStock: 5,
                        }
                    });

                    // Log Inventory Change
                    await tx.inventoryLog.create({
                        data: {
                            warehouseId: warehouse.id,
                            variantId: variant.id,
                            action: 'STOCK_IN_MANUAL',
                            quantity: parsedQty,
                            reason: `Added new batch via Purchase Invoice #${invoiceNumber}`,
                            adminId: adminId || 'SYSTEM',
                        }
                    });

                    // FIFO Smart Pricing Rule Evaluation
                    const updatedInventory = await tx.inventory.findUnique({
                        where: { warehouseId_variantId: { warehouseId: warehouse.id, variantId: variant.id } }
                    });

                    if (updatedInventory && (updatedInventory.available - parsedQty) <= 0) {
                        // Apply variant selling price
                        if (!keepOldSellPrice && sellPrice !== undefined) {
                            await tx.variant.update({
                                where: { id: variant.id },
                                data: { price: Number(sellPrice) }
                            });
                            await tx.product.update({
                                where: { id: finalProductId },
                                data: { compareAtPrice: null }
                            });
                        }

                        // Apply variant & product cost prices
                        if (!keepOldCost || !keepOldExpenses) {
                            const updatedCost = Number(unitCost) + Number(keepOldExpenses ? ((variant.costPrice?.toNumber() ?? 0) - Number(unitCost)) : (expenses || 0));
                            await tx.variant.update({
                                where: { id: variant.id },
                                data: { costPrice: updatedCost }
                            });
                            await tx.product.update({
                                where: { id: finalProductId },
                                data: { costPrice: updatedCost }
                            });
                        }

                        // Update product specifications (supplierPrice & additionalCosts)
                        if (!keepOldCost || !keepOldExpenses) {
                            const rawSpecs = (await tx.product.findUnique({ where: { id: finalProductId } }))?.specs;
                            const updatedSpecs: Record<string, unknown> = typeof rawSpecs === 'object' && rawSpecs !== null && !Array.isArray(rawSpecs)
                                ? { ...rawSpecs }
                                : {};
                            
                            if (!keepOldCost) {
                                updatedSpecs.supplierPrice = Number(unitCost);
                            }
                            if (!keepOldExpenses) {
                                updatedSpecs.additionalCosts = Number(expenses);
                            }

                            await tx.product.update({
                                where: { id: finalProductId },
                                data: { specs: updatedSpecs as Prisma.InputJsonObject }
                            });
                        }

                        // Mark batch pricing as applied
                        await tx.inventoryBatch.update({
                            where: { id: batch.id },
                            data: { isPriceApplied: true }
                        });
                    }
                }
            }

            return inv;
        });

        return NextResponse.json({ invoice, message: 'Invoice created successfully' });
    } catch (error) {
        console.error('Purchase Invoice POST Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create invoice' }, { status: 500 });
    }
}

import prisma from '@/lib/prisma';


export class ProductRegistrationService {
    
    /**
     * Creates new product and initial stock from within the Invoice Wizard
     */
    static async createProductFromInvoice(
        data: {
            name: string;
            description?: string;
            categoryId?: string;
            brandId?: string;
            unitPrice: number;
            sku: string;
            imageUrl?: string;
        },
        tx = prisma
    ) {
        // 1. Create Product
        const product = await tx.product.create({
            data: {
                name: data.name,
                description: data.description,
                categoryId: data.categoryId,
                brandId: data.brandId,
                status: 'active',
                imageUrl: data.imageUrl,
            }
        });

        // 2. Create Initial Variant
        const variant = await tx.variant.create({
            data: {
                productId: product.id,
                sku: data.sku,
                price: new Decimal(data.unitPrice),
                costPrice: new Decimal(0), // Will be updated by Stock Intake
            }
        });

        // 3. Initialize Inventory Records (0 stock)
        // This usually happens lazily or we can iterate all warehouses
        // For now we leave it empty until StockInEvent adds to a specific warehouse

        return { product, variant };
    }
}

import { Decimal } from '@prisma/client/runtime/library';

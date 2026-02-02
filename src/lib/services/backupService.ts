import prisma from '@/lib/prisma';


export type BackupData = {
  version: string;
  timestamp: string;
    data: Record<string, unknown[]>;
};

// List of models to backup in dependency order (Parents before Children)
// This ensures that if we were to restore line-by-line, we wouldn't hit foreign key errors immediately.
const MODELS = [
  'user',
  'adminRole',
  'adminUser',
  'brand',
  'material',
  'category',
  'warehouse',
  'product',
  'variant',
  'productImage',
  'review',
  'order',
  'orderItem',
  'orderStatusHistory',
  'orderNote',
  'paymentIntent',
  'cart',
  'cartItem',
  'address',
  'inventory',
  'inventoryLog',
  'supplier',
  'purchaseInvoice',
  'stockTransfer',
  'stockAlert',
  'inventoryCount',
  'coupon',
  'verificationToken'
];

export const backupService = {
  /**
   * Generates a full JSON backup of the database
   */
  async generateBackup(): Promise<BackupData> {
        const data: Record<string, unknown[]> = {};

    // We execute sequentially to avoid overwhelming the DB connection
    for (const model of MODELS) {
      try {
          // @ts-expect-error - Dynamic access to prisma delegate
        if (prisma[model]) {
            // @ts-expect-error - Dynamic access to findMany
          const records = await prisma[model].findMany();
          data[model] = records;
        }
      } catch (error) {
        console.error(`Backup failed for model ${model}:`, error);
        // We continue intentionally to get partial backup rather than nothing
        data[model] = []; 
      }
    }

    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data
    };
  }
};

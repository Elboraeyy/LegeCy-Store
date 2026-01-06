
import { PrismaClient } from '@prisma/client';
import { AccountType } from '@prisma/client'; // Added this import

const prisma = new PrismaClient();

// 2. Define Initial Accounts
const accounts: { code: string; name: string; type: AccountType }[] = [
  // Assets (1xxx)
  { code: '1001', name: 'Cash on Hand', type: 'ASSET' },
  { code: '1002', name: 'Bank Account - CIB', type: 'ASSET' },
  { code: '1200', name: 'Inventory Asset', type: 'ASSET' },

  // Liabilities (2xxx)
  { code: '2001', name: 'Accounts Payable', type: 'LIABILITY' },

  // Equity (3xxx)
  { code: '3001', name: 'Owner\'s Equity', type: 'EQUITY' },
  { code: '3002', name: 'Retained Earnings', type: 'EQUITY' },

  // Revenue (4xxx)
  { code: '4001', name: 'Sales Revenue', type: 'REVENUE' },
  { code: '4002', name: 'Shipping Income', type: 'REVENUE' },

  // Expenses (5xxx)
  { code: '5001', name: 'Cost of Goods Sold', type: 'EXPENSE' },
  { code: '5100', name: 'Marketing Ads', type: 'EXPENSE' },
  { code: '5200', name: 'Packaging Materials', type: 'EXPENSE' },
  { code: '5300', name: 'Salaries & Wages', type: 'EXPENSE' },
  { code: '5400', name: 'Rent', type: 'EXPENSE' },
  { code: '5999', name: 'General Expenses', type: 'EXPENSE' },
];

async function main() {
  console.log('🌱 Seeding Chart of Accounts...');

  for (const acc of accounts) {
    const exists = await prisma.account.findUnique({ where: { code: acc.code } });
    if (!exists) {
      await prisma.account.create({
        data: {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          isSystem: true,
        },
      });
      console.log(`Created: [${acc.code}] ${acc.name}`);
    } else {
        console.log(`Skipped: [${acc.code}] ${acc.name} (Exists)`);
    }
  }

  console.log('✅ Seeding Complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

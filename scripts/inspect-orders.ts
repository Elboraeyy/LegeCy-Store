import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== ORDERS STATUS COUNT ===');
  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  for (const s of statusCounts) {
    console.log(`Status: ${s.status}, Count: ${s._count.id}`);
  }

  console.log('\n=== AUDITED ORDERS ===');
  const auditedOrders = await prisma.order.findMany({
    where: { isFinanciallyAudited: true }
  });
  console.log(`Total audited orders: ${auditedOrders.length}`);
  
  console.log('\n=== JOURNAL ENTRIES COUNT ===');
  const journalCount = await prisma.journalEntry.count();
  console.log(`Total journal entries: ${journalCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

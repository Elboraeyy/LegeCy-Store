import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const isCommit = process.argv.includes('--commit') || process.env.COMMIT === 'true';

  console.log('--------------------------------------------------');
  console.log(isCommit ? ' RUNNING IN COMMIT MODE ' : ' RUNNING IN DRY-RUN MODE ');
  console.log('--------------------------------------------------');

  // 1. Fetch cancelled orders
  const cancelledOrders = await prisma.order.findMany({
    where: { status: 'cancelled' },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      totalPrice: true,
      createdAt: true,
    },
  });

  const count = cancelledOrders.length;
  console.log(`Found ${count} cancelled orders.`);

  if (count === 0) {
    console.log('No cancelled orders to delete. Exiting.');
    return;
  }

  const orderIds = cancelledOrders.map(o => o.id);

  // 2. Count / Fetch related records for dry-run report
  const couponUsages = await prisma.couponUsage.count({ where: { orderId: { in: orderIds } } });
  const statusHistories = await prisma.orderStatusHistory.count({ where: { orderId: { in: orderIds } } });
  const items = await prisma.orderItem.count({ where: { orderId: { in: orderIds } } });
  const adjustments = await prisma.orderAdjustment.count({ where: { orderId: { in: orderIds } } });
  const disputes = await prisma.orderDispute.count({ where: { orderId: { in: orderIds } } });
  const revenues = await prisma.revenueRecognition.count({ where: { orderId: { in: orderIds } } });
  const events = await prisma.orderEvent.count({ where: { orderId: { in: orderIds } } });
  const notes = await prisma.orderNote.count({ where: { orderId: { in: orderIds } } });
  const riskScores = await prisma.orderRiskScore.count({ where: { orderId: { in: orderIds } } });
  const loyaltyTx = await prisma.loyaltyTransaction.count({ where: { orderId: { in: orderIds } } });
  const partnerTx = await prisma.partnerTransaction.count({ where: { orderId: { in: orderIds } } });
  const safeTx = await prisma.safeTransaction.count({ where: { referenceType: 'ORDER', referenceId: { in: orderIds } } });

  console.log('\n--- Summary of related records to be affected ---');
  console.log(`- OrderItems: ${items} (will be DELETED)`);
  console.log(`- OrderStatusHistories: ${statusHistories} (will be DELETED)`);
  console.log(`- OrderNotes: ${notes} (will be DELETED)`);
  console.log(`- OrderEvents: ${events} (will be DELETED)`);
  console.log(`- OrderAdjustments: ${adjustments} (will be DELETED)`);
  console.log(`- OrderDisputes: ${disputes} (will be DELETED)`);
  console.log(`- CouponUsages: ${couponUsages} (will be DELETED)`);
  console.log(`- RevenueRecognitions: ${revenues} (will be DELETED)`);
  console.log(`- OrderRiskScores: ${riskScores} (will be DELETED)`);
  console.log(`- LoyaltyTransactions: ${loyaltyTx} (orderId will be set to NULL to preserve points history)`);
  console.log(`- PartnerTransactions: ${partnerTx} (orderId will be set to NULL)`);
  console.log(`- SafeTransactions: ${safeTx} (referenceId will be set to NULL)`);

  if (!isCommit) {
    console.log('\nDry-run complete. No changes were made to the database.');
    console.log('To execute the deletion, run this script with the --commit flag:');
    console.log('npx tsx scripts/delete-cancelled-orders.ts --commit');
    return;
  }

  console.log('\nCommitting deletions to database...');

  // Use a transaction to ensure all or nothing is deleted
  await prisma.$transaction(async (tx) => {
    // A. Delete dependent tables
    if (couponUsages > 0) {
      await tx.couponUsage.deleteMany({ where: { orderId: { in: orderIds } } });
    }
    if (statusHistories > 0) {
      await tx.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } });
    }
    if (items > 0) {
      await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    }
    if (adjustments > 0) {
      await tx.orderAdjustment.deleteMany({ where: { orderId: { in: orderIds } } });
    }
    if (disputes > 0) {
      await tx.orderDispute.deleteMany({ where: { orderId: { in: orderIds } } });
    }
    if (revenues > 0) {
      await tx.revenueRecognition.deleteMany({ where: { orderId: { in: orderIds } } });
    }
    if (events > 0) {
      await tx.orderEvent.deleteMany({ where: { orderId: { in: orderIds } } });
    }
    if (notes > 0) {
      await tx.orderNote.deleteMany({ where: { orderId: { in: orderIds } } });
    }
    if (riskScores > 0) {
      await tx.orderRiskScore.deleteMany({ where: { orderId: { in: orderIds } } });
    }

    // B. Set references to null
    if (loyaltyTx > 0) {
      await tx.loyaltyTransaction.updateMany({
        where: { orderId: { in: orderIds } },
        data: { orderId: null },
      });
    }
    if (partnerTx > 0) {
      await tx.partnerTransaction.updateMany({
        where: { orderId: { in: orderIds } },
        data: { orderId: null },
      });
    }
    if (safeTx > 0) {
      await tx.safeTransaction.updateMany({
        where: { referenceType: 'ORDER', referenceId: { in: orderIds } },
        data: { referenceId: null },
      });
    }

    // C. Delete the orders
    const result = await tx.order.deleteMany({
      where: { id: { in: orderIds } },
    });

    console.log(`Successfully deleted ${result.count} cancelled orders and their associated records.`);
  });
}

main()
  .catch((e) => {
    console.error('Error executing script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

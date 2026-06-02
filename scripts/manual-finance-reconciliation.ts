import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function n(v: unknown): number {
  if (typeof v === 'number') return v;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = v as any;
  if (d?.toNumber) return d.toNumber();
  return Number(v) || 0;
}

function fmt(x: number) {
  return `EGP ${x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function main() {
  const cash = await prisma.safe.findUnique({ where: { name: 'Cash' } });
  if (!cash) throw new Error('Cash safe missing');

  const txs = await prisma.safeTransaction.findMany({
    where: { safeId: cash.id },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  });

  const byRef = new Map<string, { in: number; out: number; count: number }>();
  for (const tx of txs) {
    const ref = tx.referenceType || 'UNKNOWN';
    const cur = byRef.get(ref) || { in: 0, out: 0, count: 0 };
    cur.count++;
    const amt = n(tx.amount);
    if (tx.type === 'CREDIT' || tx.type === 'TRANSFER_IN') cur.in += amt;
    else cur.out += amt;
    byRef.set(ref, cur);
  }

  const totalIn = [...byRef.values()].reduce((s, v) => s + v.in, 0);
  const totalOut = [...byRef.values()].reduce((s, v) => s + v.out, 0);

  // Audited orders on Cash safe
  const auditedOrders = await prisma.order.findMany({
    where: { isFinanciallyAudited: true, auditSafeId: cash.id },
    select: {
      id: true,
      orderNumber: true,
      totalPrice: true,
      wholesaleCost: true,
      packagingCost: true,
      actualShippingCost: true,
      extraExpenses: true,
      discountAmount: true,
      netProfit: true,
      deliveredAt: true,
      auditedAt: true,
      paymentMethod: true
    }
  });

  const orderRevenue = auditedOrders.reduce((s, o) => s + n(o.totalPrice), 0);
  const orderCosts =
    auditedOrders.reduce((s, o) => s + n(o.wholesaleCost), 0) +
    auditedOrders.reduce((s, o) => s + n(o.packagingCost), 0) +
    auditedOrders.reduce((s, o) => s + n(o.actualShippingCost), 0) +
    auditedOrders.reduce((s, o) => s + n(o.extraExpenses), 0);
  const orderNetProfitField = auditedOrders.reduce((s, o) => s + n(o.netProfit), 0);

  // Expenses linked to Cash safe
  const expensesOnCash = await prisma.expense.findMany({
    where: { safeId: cash.id },
    include: { category: { select: { name: true } } }
  });
  const expenseCashOut = expensesOnCash.reduce((s, e) => s + n(e.amount), 0);
  const amortizedOnCash = expensesOnCash.filter(e => e.isAmortized);
  const amortizedFullCash = amortizedOnCash.reduce((s, e) => s + n(e.amount), 0);

  // Expenses without safe (recorded but no cash movement)
  const expensesNoSafe = await prisma.expense.count({ where: { safeId: null } });

  // Month closings
  const monthClosings = await prisma.monthClosing.findMany({
    where: { status: 'CLOSED' },
    orderBy: [{ year: 'asc' }, { month: 'asc' }]
  });

  const mcSafeTxs = txs.filter(t => t.referenceType === 'MONTH_CLOSING');
  const mcNetSafe = mcSafeTxs.reduce((s, t) => {
    const amt = n(t.amount);
    return s + (t.type === 'CREDIT' ? amt : -amt);
  }, 0);

  // Withdrawals from cash
  const withdrawals = await prisma.partnerWithdrawal.findMany({
    where: { safeId: cash.id, status: 'APPROVED' }
  });
  const withdrawalTotal = withdrawals.reduce((s, w) => s + n(w.amount), 0);

  // Delivered but not audited
  const deliveredNotAudited = await prisma.order.count({
    where: { status: 'delivered', isFinanciallyAudited: false }
  });

  // Audited but different safe
  const auditedOtherSafe = await prisma.order.count({
    where: { isFinanciallyAudited: true, auditSafeId: { not: cash.id } }
  });

  // Duplicate ORDER safe txs?
  const orderTxs = txs.filter(t => t.referenceType === 'ORDER');
  const orderTxTotal = orderTxs.reduce((s, t) => s + n(t.amount), 0);

  // GL cash account
  const glCash = await prisma.account.findFirst({ where: { code: '1000' } });

  console.log('=== MANUAL CASH RECONCILIATION (Cash safe) ===\n');
  console.log(`Current Safe.balance: ${fmt(n(cash.balance))}`);
  console.log(`SafeTransaction net (IN - OUT): ${fmt(totalIn - totalOut)}`);
  console.log(`Transaction count: ${txs.length}\n`);

  console.log('--- By referenceType ---');
  for (const [ref, v] of [...byRef.entries()].sort((a, b) => b[1].out + b[1].in - (a[1].out + a[1].in))) {
    console.log(
      `${ref.padEnd(16)} count=${String(v.count).padStart(3)}  IN=${fmt(v.in).padStart(14)}  OUT=${fmt(v.out).padStart(14)}  net=${fmt(v.in - v.out)}`
    );
  }

  console.log('\n--- Orders (financial audit → Cash) ---');
  console.log(`Audited orders on Cash: ${auditedOrders.length}`);
  console.log(`Sum totalPrice (credited to safe): ${fmt(orderRevenue)}`);
  console.log(`ORDER safe txs sum: ${fmt(orderTxTotal)}`);
  console.log(`Mismatch order revenue vs txs: ${fmt(orderRevenue - orderTxTotal)}`);
  console.log(`Sum audit costs (COGS+ship+pack+extra): ${fmt(orderCosts)}`);
  console.log(`Sum netProfit field on orders: ${fmt(orderNetProfitField)}`);
  console.log(`Implied gross - costs: ${fmt(orderRevenue - orderCosts)}`);
  console.log(`Delivered NOT audited: ${deliveredNotAudited}`);
  console.log(`Audited on other safe: ${auditedOtherSafe}`);

  console.log('\n--- Expenses (Cash safe) ---');
  console.log(`Expenses with safeId=Cash: ${expensesOnCash.length}`);
  console.log(`Total cash debited (full amounts): ${fmt(expenseCashOut)}`);
  console.log(`Amortized count: ${amortizedOnCash.length}, full cash out: ${fmt(amortizedFullCash)}`);
  console.log(`Expenses with NO safe (no cash movement): ${expensesNoSafe}`);

  console.log('\n--- Month closing (safe movements) ---');
  for (const tx of mcSafeTxs) {
    console.log(
      `  ${tx.createdAt.toISOString().slice(0, 10)} ${tx.type} ${fmt(n(tx.amount))} — ${tx.description}`
    );
  }
  console.log(`Net MONTH_CLOSING on Cash safe: ${fmt(mcNetSafe)}`);
  for (const mc of monthClosings) {
    console.log(
      `  Closed ${mc.month}/${mc.year}: revenue=${fmt(n(mc.totalRevenue))} netProfit=${fmt(n(mc.netProfit))} reinvest(40%)=${fmt(n(mc.reinvestmentAmount))}`
    );
  }

  console.log('\n--- Partner withdrawals (from Cash) ---');
  console.log(`Approved withdrawals: ${withdrawals.length}, total: ${fmt(withdrawalTotal)}`);

  console.log('\n--- Expected cash check ---');
  const expectedFromTx = totalIn - totalOut;
  console.log(`Opening (inferred 0) + IN - OUT = ${fmt(expectedFromTx)}`);
  console.log(`Should equal Safe.balance: ${fmt(n(cash.balance))}`);
  console.log(`Difference: ${fmt(n(cash.balance) - expectedFromTx)}`);

  console.log('\n--- P&L vs physical cash (conceptual) ---');
  console.log(`Cash IN from orders (gross): ${fmt(byRef.get('ORDER')?.in || 0)}`);
  console.log(`Cash OUT expenses: ${fmt(byRef.get('EXPENSE')?.out || 0)}`);
  console.log(`Cash OUT withdrawals: ${fmt(byRef.get('WITHDRAWAL')?.out || 0)}`);
  console.log(`Month closing net on safe: ${fmt(mcNetSafe)}`);
  console.log(
    `Rough "business profit" if all sales cash & all costs in expenses: ${fmt((byRef.get('ORDER')?.in || 0) - (byRef.get('EXPENSE')?.out || 0) - (byRef.get('WITHDRAWAL')?.out || 0) + mcNetSafe)}`
  );
  console.log(`Order-level netProfit sum (audit fields): ${fmt(orderNetProfitField)}`);

  if (glCash) {
    console.log('\n--- GL Cash account (1000) vs Safe ---');
    console.log(`GL 1000 balance: ${fmt(n(glCash.balance))}`);
    console.log(`Safe Cash balance: ${fmt(n(cash.balance))}`);
    console.log(`GL - Safe: ${fmt(n(glCash.balance) - n(cash.balance))}`);
  }

  // Suspicious: expenses on same day as many orders
  const expenseOutRef = byRef.get('EXPENSE')?.out || 0;
  const orderInRef = byRef.get('ORDER')?.in || 0;
  if (Math.abs(orderRevenue - orderInRef) > 1) {
    console.log('\n⚠ ORDER revenue in orders table != ORDER safe txs');
  }
  if (expenseCashOut !== expenseOutRef) {
    console.log(`\n⚠ Expense table sum (${fmt(expenseCashOut)}) != EXPENSE safe txs (${fmt(expenseOutRef)})`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

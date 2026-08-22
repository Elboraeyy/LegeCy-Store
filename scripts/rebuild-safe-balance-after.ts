import 'dotenv/config';
import { PrismaClient, SafeTransactionType } from '@prisma/client';

const prisma = new PrismaClient();

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyV = v as any;
  if (anyV && typeof anyV.toNumber === 'function') return anyV.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function signedAmount(type: SafeTransactionType, amount: number): number {
  switch (type) {
    case 'CREDIT':
    case 'TRANSFER_IN':
      return amount;
    case 'DEBIT':
    case 'TRANSFER_OUT':
      return -amount;
    default:
      return 0;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function rebuildSafe(
  safeId: string,
  safeName: string,
  currentBalance: number,
  dryRun: boolean
) {
  const txs = await prisma.safeTransaction.findMany({
    where: { safeId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  });

  if (txs.length === 0) {
    return {
      safeName,
      txCount: 0,
      fixed: 0,
      opening: currentBalance,
      ending: currentBalance,
      currentBalance,
      balanceDrift: 0
    };
  }

  const netFromTxs = txs.reduce(
    (sum, tx) => sum + signedAmount(tx.type, toNumber(tx.amount)),
    0
  );
  const opening = round2(currentBalance - netFromTxs);

  let running = opening;
  let fixed = 0;
  const updates: { id: string; balanceAfter: number }[] = [];

  for (const tx of txs) {
    const amount = toNumber(tx.amount);
    running = round2(running + signedAmount(tx.type, amount));
    const recorded = round2(toNumber(tx.balanceAfter));

    if (Math.abs(recorded - running) > 0.009) {
      fixed += 1;
    }

    updates.push({ id: tx.id, balanceAfter: running });
  }

  const ending = running;
  const balanceDrift = round2(currentBalance - ending);

  if (!dryRun) {
    await prisma.$transaction(
      async (tx) => {
        for (const u of updates) {
          await tx.safeTransaction.update({
            where: { id: u.id },
            data: { balanceAfter: u.balanceAfter }
          });
        }

        if (Math.abs(balanceDrift) > 0.009) {
          await tx.safe.update({
            where: { id: safeId },
            data: { balance: ending }
          });
        }
      },
      { maxWait: 60_000, timeout: 120_000 }
    );
  }

  return {
    safeName,
    txCount: txs.length,
    fixed,
    opening,
    ending,
    currentBalance,
    balanceDrift
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const onlyCash = process.argv.includes('--cash-only');

  const safes = await prisma.safe.findMany({
    where: onlyCash ? { name: 'Cash' } : undefined,
    orderBy: { createdAt: 'asc' }
  });

  console.log(dryRun ? '=== DRY RUN (no writes) ===' : '=== REBUILDING balanceAfter ===');
  if (onlyCash) console.log('Scope: Cash safe only\n');
  else console.log('Scope: all safes\n');

  let totalFixed = 0;

  for (const safe of safes) {
    const currentBalance = toNumber(safe.balance);
    const result = await rebuildSafe(safe.id, safe.name, currentBalance, dryRun);
    totalFixed += result.fixed;

    console.log(
      `[${result.safeName}] txs=${result.txCount}, mismatches fixed=${result.fixed}, opening=${result.opening.toFixed(2)}, ending=${result.ending.toFixed(2)}, safe.balance=${result.currentBalance.toFixed(2)}`
    );
    if (Math.abs(result.balanceDrift) > 0.009) {
      console.log(`  ⚠ balance drift vs Safe.balance: ${result.balanceDrift.toFixed(2)}`);
    }
  }

  console.log(`\nTotal balanceAfter rows corrected: ${totalFixed}`);
  if (dryRun) console.log('Re-run without --dry-run to apply changes.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

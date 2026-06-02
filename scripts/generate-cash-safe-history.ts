import 'dotenv/config';
import { PrismaClient, SafeTransactionType } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();

function toNumberSafe(v: unknown): number {
  if (typeof v === 'number') return v;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyV = v as any;
  if (anyV && typeof anyV.toNumber === 'function') return anyV.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function signedAmount(type: SafeTransactionType, amount: number) {
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

function fmtMoney(n: number) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}EGP ${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[,"\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

async function main() {
  const cashSafe = await prisma.safe.findUnique({ where: { name: 'Cash' } });
  if (!cashSafe) throw new Error('Cash safe not found (Safe.name = "Cash").');

  const txs = await prisma.safeTransaction.findMany({
    where: { safeId: cashSafe.id },
    orderBy: { createdAt: 'asc' }
  });

  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('');

  const __filename = fileURLToPath(import.meta.url);
  const scriptsDir = join(__filename, '..');
  const rootDir = join(scriptsDir, '..');
  const outDir = join(rootDir, 'reports');
  await mkdir(outDir, { recursive: true });

  // infer opening from first tx balanceAfter
  let opening = 0;
  if (txs.length === 0) {
    opening = toNumberSafe(cashSafe.balance);
  } else {
    const first = txs[0]!;
    const amount = toNumberSafe(first.amount);
    opening = toNumberSafe(first.balanceAfter) - signedAmount(first.type, amount);
  }

  // Build running reconstruction + detect balanceAfter inconsistencies
  let running = opening;
  let credits = 0;
  let debits = 0;
  let netTransfers = 0;
  let mismatches = 0;

  const rows = txs.map(tx => {
    const amount = toNumberSafe(tx.amount);
    const signed = signedAmount(tx.type, amount);
    const expectedAfter = running + signed;
    const recordedAfter = toNumberSafe(tx.balanceAfter);
    const delta = recordedAfter - expectedAfter;
    if (Math.abs(delta) > 0.009) mismatches += 1;

    if (tx.type === 'CREDIT') credits += amount;
    if (tx.type === 'DEBIT') debits += amount;
    if (tx.type === 'TRANSFER_IN') netTransfers += amount;
    if (tx.type === 'TRANSFER_OUT') netTransfers -= amount;

    running = expectedAfter;

    return {
      createdAt: tx.createdAt.toISOString(),
      type: tx.type,
      amount: amount,
      signedAmount: signed,
      recordedBalanceAfter: recordedAfter,
      expectedBalanceAfter: expectedAfter,
      delta,
      referenceType: tx.referenceType ?? '',
      referenceId: tx.referenceId ?? '',
      description: tx.description ?? '',
      createdBy: tx.createdBy ?? '',
      txId: tx.id
    };
  });

  const endingDb = toNumberSafe(cashSafe.balance);
  const endingComputed = running;
  const endingDiff = endingDb - endingComputed;

  // CSV (cash only)
  const csvHeader = [
    'createdAt',
    'type',
    'amount',
    'signedAmount',
    'recordedBalanceAfter',
    'expectedBalanceAfter',
    'delta',
    'referenceType',
    'referenceId',
    'description',
    'createdBy',
    'txId'
  ].join(',');

  const csvLines = [csvHeader].concat(
    rows.map(r =>
      [
        r.createdAt,
        r.type,
        r.amount.toFixed(2),
        r.signedAmount.toFixed(2),
        r.recordedBalanceAfter.toFixed(2),
        r.expectedBalanceAfter.toFixed(2),
        r.delta.toFixed(2),
        r.referenceType,
        r.referenceId,
        r.description,
        r.createdBy,
        r.txId
      ]
        .map(csvEscape)
        .join(',')
    )
  );

  const csvPath = join(outDir, `cash-safe-history-${stamp}.csv`);
  await writeFile(csvPath, csvLines.join('\n'), 'utf8');

  // Markdown (full history, newest first, but keep an easy-to-scan format)
  const newestFirst = [...rows].reverse();
  const mdLines: string[] = [];
  mdLines.push(`# Cash Safe Full History`);
  mdLines.push(``);
  mdLines.push(`GeneratedAt: ${now.toISOString()}`);
  mdLines.push(`Safe: Cash (id=${cashSafe.id})`);
  mdLines.push(``);
  mdLines.push(`## Totals`);
  mdLines.push(`- Opening inferred: **${fmtMoney(opening)}**`);
  mdLines.push(`- Total CREDIT (in): **${fmtMoney(credits)}**`);
  mdLines.push(`- Total DEBIT (out): **${fmtMoney(debits)}**`);
  mdLines.push(`- Net TRANSFER: **${fmtMoney(netTransfers)}**`);
  mdLines.push(`- Ending recomputed: **${fmtMoney(endingComputed)}**`);
  mdLines.push(`- Ending DB (Safe.balance): **${fmtMoney(endingDb)}**`);
  mdLines.push(`- Ending diff (DB - recomputed): **${fmtMoney(endingDiff)}**`);
  mdLines.push(`- Transactions: **${rows.length}**`);
  mdLines.push(`- BalanceAfter mismatches: **${mismatches}**`);
  mdLines.push(``);
  mdLines.push(`## Full timeline (newest → oldest)`);
  mdLines.push(
    [
      `| Date | Type | In/Out | Amount | Ref | Description | BalanceAfter |`,
      `|---|---:|---:|---:|---|---|---:|`
    ].join('\n')
  );

  for (const r of newestFirst) {
    const inOut = r.signedAmount >= 0 ? 'IN' : 'OUT';
    const ref = r.referenceType ? `${r.referenceType}:${r.referenceId}` : '';
    const bal = r.recordedBalanceAfter;
    mdLines.push(
      `| ${r.createdAt} | ${r.type} | ${inOut} | ${fmtMoney(r.amount)} | ${ref} | ${String(r.description).replaceAll('\n', ' ')} | ${fmtMoney(bal)} |`
    );
  }

  const mdPath = join(outDir, `cash-safe-history-${stamp}.md`);
  await writeFile(mdPath, mdLines.join('\n'), 'utf8');

  console.log(`Generated:\n- ${mdPath}\n- ${csvPath}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


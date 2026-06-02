import 'dotenv/config';
import { PrismaClient, SafeTransactionType } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'node:util';

const prisma = new PrismaClient();

type TxRow = {
  id: string;
  safeId: string;
  safeName: string;
  safeType: string;
  type: SafeTransactionType;
  amount: number;
  signedAmount: number;
  balanceAfter: number;
  expectedBalanceAfter: number;
  delta: number;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdBy: string | null;
  createdAt: string;
};

function toNumberSafe(v: unknown): number {
  if (typeof v === 'number') return v;
  // Prisma Decimal supports toNumber() but type is unknown here
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

  // Resolve project root from this script file
  const __filename = fileURLToPath(import.meta.url);
  const scriptsDir = join(__filename, '..');
  const rootDir = join(scriptsDir, '..');
  const outDir = join(rootDir, 'reports');
  await mkdir(outDir, { recursive: true });

  const [safes, txs] = await Promise.all([
    prisma.safe.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.safeTransaction.findMany({
      orderBy: { createdAt: 'asc' },
      include: { safe: { select: { id: true, name: true, type: true } } }
    })
  ]);

  const safesById = new Map(
    safes.map(s => [
      s.id,
      {
        id: s.id,
        name: s.name,
        type: s.type,
        isActive: s.isActive,
        balance: toNumberSafe(s.balance),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString()
      }
    ])
  );

  const txsBySafe = new Map<string, typeof txs>();
  for (const tx of txs) {
    const arr = txsBySafe.get(tx.safeId) ?? [];
    arr.push(tx);
    txsBySafe.set(tx.safeId, arr);
  }

  const allRows: TxRow[] = [];
  const safeSummaries: Array<{
    safeId: string;
    safeName: string;
    safeType: string;
    isActive: boolean;
    safeCreatedAt: string;
    openingInferred: number;
    totalCredits: number;
    totalDebits: number;
    netTransfers: number;
    netAll: number;
    endingComputed: number;
    endingDb: number;
    endingDiff: number;
    txCount: number;
    firstTxAt: string | null;
    lastTxAt: string | null;
    discrepancies: number;
  }> = [];

  for (const safe of safes) {
    const safeId = safe.id;
    const safeTxs = txsBySafe.get(safeId) ?? [];

    let opening = 0;
    let running = 0;
    let discrepancies = 0;
    let credits = 0;
    let debits = 0;
    let netTransfers = 0;

    if (safeTxs.length === 0) {
      // No history; assume current is opening.
      opening = toNumberSafe(safe.balance);
      running = opening;
    } else {
      const first = safeTxs[0]!;
      const firstAmount = toNumberSafe(first.amount);
      const firstSigned = signedAmount(first.type, firstAmount);
      opening = toNumberSafe(first.balanceAfter) - firstSigned;
      running = opening;
    }

    for (const tx of safeTxs) {
      const amount = toNumberSafe(tx.amount);
      const signed = signedAmount(tx.type, amount);
      const expectedAfter = running + signed;
      const recordedAfter = toNumberSafe(tx.balanceAfter);
      const delta = recordedAfter - expectedAfter;

      if (Math.abs(delta) > 0.009) discrepancies += 1;

      if (tx.type === 'CREDIT') credits += amount;
      if (tx.type === 'DEBIT') debits += amount;
      if (tx.type === 'TRANSFER_IN') netTransfers += amount;
      if (tx.type === 'TRANSFER_OUT') netTransfers -= amount;

      allRows.push({
        id: tx.id,
        safeId,
        safeName: safe.name,
        safeType: safe.type,
        type: tx.type,
        amount,
        signedAmount: signed,
        balanceAfter: recordedAfter,
        expectedBalanceAfter: expectedAfter,
        delta,
        referenceType: tx.referenceType ?? null,
        referenceId: tx.referenceId ?? null,
        description: tx.description ?? null,
        createdBy: tx.createdBy ?? null,
        createdAt: tx.createdAt.toISOString()
      });

      running = expectedAfter;
    }

    const endingDb = toNumberSafe(safe.balance);
    const endingComputed = running;
    const endingDiff = endingDb - endingComputed;

    safeSummaries.push({
      safeId,
      safeName: safe.name,
      safeType: safe.type,
      isActive: safe.isActive,
      safeCreatedAt: safe.createdAt.toISOString(),
      openingInferred: opening,
      totalCredits: credits,
      totalDebits: debits,
      netTransfers,
      netAll: credits - debits + netTransfers,
      endingComputed,
      endingDb,
      endingDiff,
      txCount: safeTxs.length,
      firstTxAt: safeTxs[0]?.createdAt.toISOString() ?? null,
      lastTxAt: safeTxs.at(-1)?.createdAt.toISOString() ?? null,
      discrepancies
    });
  }

  const totalDb = safeSummaries.reduce((s, x) => s + x.endingDb, 0);
  const totalComputed = safeSummaries.reduce((s, x) => s + x.endingComputed, 0);
  const totalDiff = totalDb - totalComputed;

  // Output CSV timeline (very detailed)
  const csvHeader = [
    'createdAt',
    'safeName',
    'safeType',
    'type',
    'amount',
    'signedAmount',
    'balanceAfter',
    'expectedBalanceAfter',
    'delta',
    'referenceType',
    'referenceId',
    'description',
    'createdBy',
    'txId',
    'safeId'
  ].join(',');

  const csvLines = [csvHeader].concat(
    allRows.map(r =>
      [
        r.createdAt,
        r.safeName,
        r.safeType,
        r.type,
        r.amount.toFixed(2),
        r.signedAmount.toFixed(2),
        r.balanceAfter.toFixed(2),
        r.expectedBalanceAfter.toFixed(2),
        r.delta.toFixed(2),
        r.referenceType ?? '',
        r.referenceId ?? '',
        r.description ?? '',
        r.createdBy ?? '',
        r.id,
        r.safeId
      ]
        .map(csvEscape)
        .join(',')
    )
  );

  const csvPath = join(outDir, `safe-ledger-timeline-${stamp}.csv`);
  const summaryJsonPath = join(outDir, `safe-ledger-summary-${stamp}.json`);
  const mdPath = join(outDir, `safe-ledger-report-${stamp}.md`);

  const discrepancySafes = safeSummaries
    .filter(s => s.discrepancies > 0 || Math.abs(s.endingDiff) > 0.009)
    .sort((a, b) => Math.abs(b.endingDiff) - Math.abs(a.endingDiff));

  const md = [
    `# Safe Ledger Report`,
    ``,
    `GeneratedAt: ${now.toISOString()}`,
    ``,
    `## What this report is`,
    `This report explains how the **mobile admin Treasury "Total Balance"** number is formed: it is the sum of **\`Safe.balance\`** across safes.`,
    `It reconstructs each safe balance from **\`SafeTransaction\`** history and highlights any mismatches that can cause an incorrect total.`,
    ``,
    `## Totals (all safes)`,
    `- DB total (sum of Safe.balance): **${fmtMoney(totalDb)}**`,
    `- Recomputed from SafeTransaction: **${fmtMoney(totalComputed)}**`,
    `- Total difference (DB - recomputed): **${fmtMoney(totalDiff)}**`,
    ``,
    `## Per-safe summaries`,
    ...safeSummaries
      .sort((a, b) => b.endingDb - a.endingDb)
      .map(s =>
        [
          `### ${s.safeName} (${s.safeType})`,
          `- SafeId: \`${s.safeId}\``,
          `- Active: **${s.isActive ? 'YES' : 'NO'}**`,
          `- SafeCreatedAt: ${s.safeCreatedAt}`,
          `- Opening inferred: **${fmtMoney(s.openingInferred)}**`,
          `- Total CREDIT (in): **${fmtMoney(s.totalCredits)}**`,
          `- Total DEBIT (out): **${fmtMoney(s.totalDebits)}**`,
          `- Net TRANSFER: **${fmtMoney(s.netTransfers)}**`,
          `- Ending recomputed: **${fmtMoney(s.endingComputed)}**`,
          `- Ending DB (Safe.balance): **${fmtMoney(s.endingDb)}**`,
          `- Ending diff (DB - recomputed): **${fmtMoney(s.endingDiff)}**`,
          `- Transactions: **${s.txCount}**`,
          `- FirstTxAt: ${s.firstTxAt ?? '—'}`,
          `- LastTxAt: ${s.lastTxAt ?? '—'}`,
          `- BalanceAfter mismatches inside history: **${s.discrepancies}**`,
          ``
        ].join('\n')
      ),
    `## Potential problems found`,
    discrepancySafes.length === 0
      ? `No mismatches detected between Safe.balance and SafeTransaction reconstruction. If there's a real-world shortage, it likely comes from **missing real-world cash** or **transactions that never got recorded**.`
      : [
          `The following safes show internal inconsistencies that can produce wrong totals:`,
          ``,
          ...discrepancySafes.map(s =>
            `- **${s.safeName}** (${s.safeType}): endingDiff=${fmtMoney(s.endingDiff)}, txMismatches=${s.discrepancies}, txCount=${s.txCount}`
          )
        ].join('\n'),
    ``,
    `## Output files`,
    `- Timeline CSV: ${csvPath}`,
    `- Summary JSON: ${summaryJsonPath}`,
    ``,
    `## Notes on where Safe balances change in code`,
    `Safe balances are updated (and SafeTransaction created) by these flows:`,
    `- Orders audit: credit safe by order revenue (referenceType=ORDER)`,
    `- Expenses: debit safe by expense amount (referenceType=EXPENSE)`,
    `- Partner withdrawals approval: debit safe (referenceType=WITHDRAWAL)`,
    `- Month closing: credit/debit brand reinvestment (referenceType=MONTH_CLOSING)`,
    `- Manual transfers / initial balances via safes API (referenceType=TRANSFER / DEPOSIT)`,
    ``
  ].join('\n');

  await Promise.all([
    writeFile(csvPath, csvLines.join('\n'), 'utf8'),
    writeFile(summaryJsonPath, JSON.stringify({ generatedAt: now.toISOString(), totalDb, totalComputed, totalDiff, safes: safeSummaries }, null, 2), 'utf8'),
    writeFile(mdPath, md, 'utf8')
  ]);

  console.log(format('Generated report files:\n- %s\n- %s\n- %s', mdPath, csvPath, summaryJsonPath));
  console.log(format('\nDB total (sum Safe.balance): %s', fmtMoney(totalDb)));
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


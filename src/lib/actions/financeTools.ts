'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/guards';

// ------------------------------------------------------
// JOURNAL ENTRY SEARCH
// ------------------------------------------------------
export async function searchJournalEntries(query: {
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    description?: string;
    accountId?: string;
}) {
    await requireAdmin();

    const where: any = {
        lines: {}
    };

    if (query.startDate || query.endDate) {
        where.date = {};
        if (query.startDate) where.date.gte = query.startDate;
        if (query.endDate) where.date.lte = query.endDate;
    }

    if (query.description) {
        where.description = { contains: query.description, mode: 'insensitive' };
    }

    // Filter by Account requires joining TransactionLine
    if (query.accountId || query.minAmount || query.maxAmount) {
        where.lines = {
            some: {
                ...(query.accountId ? { accountId: query.accountId } : {}),
                ...(query.minAmount ? { OR: [{ debit: { gte: query.minAmount } }, { credit: { gte: query.minAmount } }] } : {})
            }
        };
    }

    const entries = await prisma.journalEntry.findMany({
        where,
        include: { lines: { include: { account: true } } },
        orderBy: { date: 'desc' },
        take: 100
    });

    return entries;
}

// ------------------------------------------------------
// ACCOUNT RECONCILIATION TOOL
// ------------------------------------------------------
export async function reconcileAccount(accountId: string, statementBalance: number, date: Date) {
    await requireAdmin();

    // Get System Balance as of Date
    const result = await prisma.transactionLine.aggregate({
        where: {
            accountId,
            journalEntry: {
                date: { lte: date },
                status: 'POSTED'
            }
        },
        _sum: { debit: true, credit: true }
    });

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');

    const debit = Number(result._sum.debit || 0);
    const credit = Number(result._sum.credit || 0);

    let systemBalance = 0;
    if (['ASSET', 'EXPENSE'].includes(account.type)) {
        systemBalance = debit - credit;
    } else {
        systemBalance = credit - debit;
    }

    const difference = systemBalance - statementBalance;

    return {
        accountId,
        accountName: account.name,
        date,
        systemBalance,
        statementBalance,
        difference,
        isReconciled: Math.abs(difference) < 0.01
    };
}

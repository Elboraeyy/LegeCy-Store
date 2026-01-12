'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/guards';
import { Prisma } from '@prisma/client';

// ==========================================
// Types
// ==========================================

export interface Vault {
    id: string;
    code: string;
    name: string;
    balance: number;
    description: string | null;
    isSystem: boolean;
    icon?: string;
    color?: string;
}

export interface VaultTransaction {
    id: string;
    date: Date;
    description: string;
    type: 'deposit' | 'withdraw' | 'transfer';
    amount: number;
    balance: number;
    source?: string;
}

export interface VaultSummary {
    totalBalance: number;
    vaultCount: number;
    lastTransaction: Date | null;
    defaultVaultId: string | null;
}

// ==========================================
// Vault CRUD Operations
// ==========================================

/**
 * Get all vaults (ASSET accounts with code starting with 10)
 */
export async function getVaults(): Promise<Vault[]> {
    try {
        const accounts = await prisma.account.findMany({
            where: {
                type: 'ASSET',
                code: { startsWith: '10' },
                isActive: true
            },
            orderBy: { code: 'asc' }
        });

        return accounts.map(acc => ({
            id: acc.id,
            code: acc.code,
            name: acc.name,
            balance: Number(acc.balance),
            description: acc.description,
            isSystem: acc.isSystem,
            icon: getVaultIcon(acc.code),
            color: getVaultColor(acc.code)
        }));
    } catch (error) {
        console.error('Get vaults error:', error);
        return [];
    }
}

/**
 * Get vault icon based on code pattern
 */
function getVaultIcon(code: string): string {
    if (code === '1001') return '💵'; // Main Cash
    if (code.startsWith('100')) return '💰'; // Cash boxes
    if (code.startsWith('101')) return '🏦'; // Bank accounts
    if (code.startsWith('102')) return '📱'; // Digital wallets
    return '💳';
}

/**
 * Get vault color based on code pattern
 */
function getVaultColor(code: string): string {
    if (code.startsWith('100')) return '#10b981'; // Green for cash
    if (code.startsWith('101')) return '#3b82f6'; // Blue for bank
    if (code.startsWith('102')) return '#8b5cf6'; // Purple for wallet
    return '#6b7280';
}

/**
 * Create a new vault
 */
export async function createVault(data: {
    name: string;
    code: string;
    description?: string;
    initialBalance?: number;
}): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
        await requireAdmin();

        // Validate code starts with 10
        if (!data.code.startsWith('10')) {
            return { success: false, error: 'Vault code must start with 10 (e.g., 1002, 1011)' };
        }

        // Check for duplicate code
        const existing = await prisma.account.findFirst({
            where: { code: data.code }
        });

        if (existing) {
            return { success: false, error: `Account with code ${data.code} already exists` };
        }

        const account = await prisma.account.create({
            data: {
                name: data.name,
                code: data.code,
                type: 'ASSET',
                description: data.description,
                balance: data.initialBalance || 0,
                isSystem: false,
                isActive: true
            }
        });

        revalidatePath('/admin/finance/treasury');
        revalidatePath('/admin/finance/accounts');
        return { success: true, id: account.id };
    } catch (error) {
        console.error('Create vault error:', error);
        return { success: false, error: 'Failed to create vault' };
    }
}

/**
 * Update vault details
 */
export async function updateVault(
    id: string,
    data: { name?: string; description?: string }
): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();

        await prisma.account.update({
            where: { id },
            data
        });

        revalidatePath('/admin/finance/treasury');
        return { success: true };
    } catch (error) {
        console.error('Update vault error:', error);
        return { success: false, error: 'Failed to update vault' };
    }
}

// ==========================================
// Vault Transactions
// ==========================================

/**
 * Deposit money to a vault
 */
export async function depositToVault(
    vaultId: string,
    amount: number,
    source: string,
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const admin = await requireAdmin();

        if (amount <= 0) {
            return { success: false, error: 'Amount must be positive' };
        }

        const vault = await prisma.account.findUnique({ where: { id: vaultId } });
        if (!vault) {
            return { success: false, error: 'Vault not found' };
        }

        // Find or create a general income account for deposits
        let incomeAccount = await prisma.account.findFirst({
            where: { code: '4999' } // Misc Income
        });

        if (!incomeAccount) {
            incomeAccount = await prisma.account.create({
                data: {
                    code: '4999',
                    name: 'Miscellaneous Income',
                    type: 'REVENUE',
                    balance: 0,
                    isSystem: true
                }
            });
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create journal entry
            const journal = await tx.journalEntry.create({
                data: {
                    description: `Deposit: ${source}${notes ? ` - ${notes}` : ''}`,
                    date: new Date(),
                    status: 'POSTED',
                    createdBy: admin.id
                }
            });

            // Debit Vault (Asset increases)
            await tx.transactionLine.create({
                data: {
                    journalEntryId: journal.id,
                    accountId: vaultId,
                    debit: amount,
                    credit: 0,
                    description: `Deposit from ${source}`
                }
            });
            await tx.account.update({
                where: { id: vaultId },
                data: { balance: { increment: amount } }
            });

            // Credit Income (or source account)
            await tx.transactionLine.create({
                data: {
                    journalEntryId: journal.id,
                    accountId: incomeAccount!.id,
                    debit: 0,
                    credit: amount,
                    description: source
                }
            });
            await tx.account.update({
                where: { id: incomeAccount!.id },
                data: { balance: { increment: amount } }
            });
        });

        revalidatePath('/admin/finance/treasury');
        revalidatePath('/admin/finance');
        return { success: true };
    } catch (error) {
        console.error('Deposit error:', error);
        return { success: false, error: 'Failed to process deposit' };
    }
}

/**
 * Withdraw money from a vault
 */
export async function withdrawFromVault(
    vaultId: string,
    amount: number,
    destination: string,
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const admin = await requireAdmin();

        if (amount <= 0) {
            return { success: false, error: 'Amount must be positive' };
        }

        const vault = await prisma.account.findUnique({ where: { id: vaultId } });
        if (!vault) {
            return { success: false, error: 'Vault not found' };
        }

        if (Number(vault.balance) < amount) {
            return { success: false, error: 'Insufficient balance' };
        }

        // Find or create expense account
        let expenseAccount = await prisma.account.findFirst({
            where: { code: '5999' } // Misc Expense
        });

        if (!expenseAccount) {
            expenseAccount = await prisma.account.create({
                data: {
                    code: '5999',
                    name: 'Miscellaneous Expenses',
                    type: 'EXPENSE',
                    balance: 0,
                    isSystem: true
                }
            });
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create journal entry
            const journal = await tx.journalEntry.create({
                data: {
                    description: `Withdrawal: ${destination}${notes ? ` - ${notes}` : ''}`,
                    date: new Date(),
                    status: 'POSTED',
                    createdBy: admin.id
                }
            });

            // Credit Vault (Asset decreases)
            await tx.transactionLine.create({
                data: {
                    journalEntryId: journal.id,
                    accountId: vaultId,
                    debit: 0,
                    credit: amount,
                    description: `Withdrawal to ${destination}`
                }
            });
            await tx.account.update({
                where: { id: vaultId },
                data: { balance: { decrement: amount } }
            });

            // Debit Expense
            await tx.transactionLine.create({
                data: {
                    journalEntryId: journal.id,
                    accountId: expenseAccount!.id,
                    debit: amount,
                    credit: 0,
                    description: destination
                }
            });
            await tx.account.update({
                where: { id: expenseAccount!.id },
                data: { balance: { increment: amount } }
            });
        });

        revalidatePath('/admin/finance/treasury');
        revalidatePath('/admin/finance');
        return { success: true };
    } catch (error) {
        console.error('Withdraw error:', error);
        return { success: false, error: 'Failed to process withdrawal' };
    }
}

/**
 * Transfer between vaults
 */
export async function transferBetweenVaults(
    fromVaultId: string,
    toVaultId: string,
    amount: number,
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const admin = await requireAdmin();

        if (amount <= 0) {
            return { success: false, error: 'Amount must be positive' };
        }

        if (fromVaultId === toVaultId) {
            return { success: false, error: 'Cannot transfer to the same vault' };
        }

        const [fromVault, toVault] = await Promise.all([
            prisma.account.findUnique({ where: { id: fromVaultId } }),
            prisma.account.findUnique({ where: { id: toVaultId } })
        ]);

        if (!fromVault || !toVault) {
            return { success: false, error: 'Vault not found' };
        }

        if (Number(fromVault.balance) < amount) {
            return { success: false, error: 'Insufficient balance in source vault' };
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create journal entry
            const journal = await tx.journalEntry.create({
                data: {
                    description: `Transfer: ${fromVault.name} → ${toVault.name}${notes ? ` - ${notes}` : ''}`,
                    date: new Date(),
                    status: 'POSTED',
                    createdBy: admin.id
                }
            });

            // Credit From Vault (decrease)
            await tx.transactionLine.create({
                data: {
                    journalEntryId: journal.id,
                    accountId: fromVaultId,
                    debit: 0,
                    credit: amount,
                    description: `Transfer to ${toVault.name}`
                }
            });
            await tx.account.update({
                where: { id: fromVaultId },
                data: { balance: { decrement: amount } }
            });

            // Debit To Vault (increase)
            await tx.transactionLine.create({
                data: {
                    journalEntryId: journal.id,
                    accountId: toVaultId,
                    debit: amount,
                    credit: 0,
                    description: `Transfer from ${fromVault.name}`
                }
            });
            await tx.account.update({
                where: { id: toVaultId },
                data: { balance: { increment: amount } }
            });
        });

        revalidatePath('/admin/finance/treasury');
        return { success: true };
    } catch (error) {
        console.error('Transfer error:', error);
        return { success: false, error: 'Failed to process transfer' };
    }
}

// ==========================================
// Reporting
// ==========================================

/**
 * Get transactions for a specific vault
 */
export async function getVaultTransactions(
    vaultId: string,
    limit: number = 50
): Promise<VaultTransaction[]> {
    try {
        const lines = await prisma.transactionLine.findMany({
            where: { accountId: vaultId },
            include: {
                journalEntry: true
            },
            orderBy: { journalEntry: { date: 'desc' } },
            take: limit
        });

        let runningBalance = 0;
        
        // Get current balance first
        const vault = await prisma.account.findUnique({ where: { id: vaultId } });
        if (vault) {
            runningBalance = Number(vault.balance);
        }

        // Calculate running balance backwards
        return lines.map(line => {
            const debit = Number(line.debit);
            const credit = Number(line.credit);
            const amount = debit - credit;
            const balance = runningBalance;
            runningBalance -= amount; // Go backwards

            return {
                id: line.id,
                date: line.journalEntry.date,
                description: line.journalEntry.description,
                type: debit > 0 ? 'deposit' : (credit > 0 ? 'withdraw' : 'transfer'),
                amount: Math.abs(amount),
                balance,
                source: line.description || undefined
            };
        });
    } catch (error) {
        console.error('Get vault transactions error:', error);
        return [];
    }
}

/**
 * Get vault summary
 */
export async function getVaultSummary(): Promise<VaultSummary> {
    try {
        const vaults = await getVaults();
        
        const totalBalance = vaults.reduce((sum, v) => sum + v.balance, 0);
        
        // Get last transaction
        const lastEntry = await prisma.journalEntry.findFirst({
            where: {
                lines: {
                    some: {
                        account: {
                            type: 'ASSET',
                            code: { startsWith: '10' }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Default vault is 1001 (Cash)
        const defaultVault = vaults.find(v => v.code === '1001');

        return {
            totalBalance,
            vaultCount: vaults.length,
            lastTransaction: lastEntry?.date || null,
            defaultVaultId: defaultVault?.id || null
        };
    } catch (error) {
        console.error('Get vault summary error:', error);
        return {
            totalBalance: 0,
            vaultCount: 0,
            lastTransaction: null,
            defaultVaultId: null
        };
    }
}

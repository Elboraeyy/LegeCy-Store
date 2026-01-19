import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/lib/prisma';
import { ACCOUNTS } from '@/lib/constants/accounts';
import { revenueService, createJournalEntry } from '@/lib/services/revenueService';
import { partnerService } from '@/lib/services/partnerService';
import { getStoreConfig } from '@/lib/actions/config';
import { validateTransactionDate } from '@/lib/services/accountingPeriodService';
import { logger } from '@/lib/logger';

export const orderFinancialService = {
    /**
     * Handle Payment Received (Online)
     * DR Cash, CR Deferred Revenue
     */
    async recordPaymentReceipt(orderId: string) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || order.paymentMethod === 'cod') return;

        const orderRef = `ORD-${orderId.substring(0, 8)}-PAID`;
        const totalAmount = new Prisma.Decimal(order.totalPrice);

        await createJournalEntry({
            description: `Payment received - Order ${orderRef}`,
            lines: [
                {
                    accountCode: ACCOUNTS.CASH,
                    debit: totalAmount,
                    description: 'Cash received from online payment'
                },
                {
                    accountCode: ACCOUNTS.DEFERRED_REVENUE,
                    credit: totalAmount,
                    description: 'Deferred revenue (pending delivery)'
                }
            ],
            reference: orderRef,
            orderId: orderId,
            createdBy: 'system'
        });

        logger.info(`[Financial] Payment recorded for ${orderId}`);
    },

    /**
     * Recognize Revenue on Delivery
     * Handled in a strict transaction
     */
    async recognizeRevenue(orderId: string, triggeredBy: string = 'system') {
        try {
            const result = await prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                    include: {
                        items: { include: { variant: true } },
                        revenueRecognition: true
                    }
                });

                if (!order) throw new Error(`Order ${orderId} not found`);

                const orderRef = `ORD-${orderId.substring(0, 8)}`;

                // Check Period
                if (!(await validateTransactionDate(new Date()))) {
                    throw new Error(`Period Closed. Cannot recognize revenue for ${orderId}`);
                }

                if (order.revenueRecognition) {
                    logger.warn(`[Financial] Revenue already recognized for ${orderId}`);
                    return order.revenueRecognition;
                }

                // Calculate Tax & Net
                const taxSettingsProp = await getStoreConfig('tax_settings');
                let taxRate = 0;
                if (taxSettingsProp && (taxSettingsProp as any).enableTaxes) {
                    taxRate = ((taxSettingsProp as any).defaultTaxRate || 0) / 100;
                }

                // 4. Calculate Financials (using Decimal for precision)
                // =========================================================================================
                // Formula:
                // Total Price = Net Revenue + Tax
                // Net Revenue = Total Price / (1 + Tax Rate)
                // Tax = Total Price - Net Revenue
                // -----------------------------------------------------------------------------------------

                // Convert tax rate to Decimal (e.g., 0.14)
                const taxRateDecimal = new Prisma.Decimal(taxRate);
                const onePlusTaxRate = new Prisma.Decimal(1).plus(taxRateDecimal);

                // Calculate Nets & Taxes per item or aggregate? 
                // Aggregate is safer for matching the total order amount.

                // We use the FINAL billed amount (totalPrice) which includes shipping + tax - discounts
                const totalBilledAmount = new Prisma.Decimal(order.totalPrice);
                const discountAmount = new Prisma.Decimal(order.discountAmount || 0);

                // Calculate Net Revenue (excluding tax)
                // realNetRevenue = totalBilledAmount / 1.14
                const realNetRevenue = totalBilledAmount.div(onePlusTaxRate);

                // Calculate Tax Amount
                // taxAmount = totalBilledAmount - realNetRevenue
                const taxAmount = totalBilledAmount.minus(realNetRevenue);

                // Calculate COGS (Cost of Goods Sold)
                // Sum of (costPrice * qty) for all items
                let totalCogs = new Prisma.Decimal(0);

                for (const item of order.items) {
                    if (item.costAtPurchase) {
                        const itemCost = new Prisma.Decimal(item.costAtPurchase).mul(item.quantity);
                        totalCogs = totalCogs.plus(itemCost);
                    } else if (item.variantId) {
                        // Fallback: fetch current cost if not snapshotted (Audit Risk: deviation over time)
                        const variant = await tx.variant.findUnique({ where: { id: item.variantId } });
                        if (variant?.costPrice) {
                            const currentCost = new Prisma.Decimal(variant.costPrice).mul(item.quantity);
                            totalCogs = totalCogs.plus(currentCost);
                        }
                    }
                }
                const grossProfit = realNetRevenue.minus(totalCogs);

                logger.info(`[Financial] Calculated Revenue for Order ${orderId}`, {
                    total: totalBilledAmount.toString(),
                    net: realNetRevenue.toString(),
                    tax: taxAmount.toString(),
                    cogs: totalCogs.toString()
                });
                // Create Record
                const recog = await tx.revenueRecognition.create({
                    data: {
                        orderId,
                        grossRevenue: totalBilledAmount,
                        discountAmount: discountAmount,
                        taxAmount: taxAmount,
                        netRevenue: realNetRevenue,
                        cogsAmount: totalCogs,
                        grossProfit: grossProfit,
                        recognizedBy: triggeredBy
                    }
                });

                // 5. Create Journal Entries
                // =========================================================================================

                // A. Revenue & Tax Journal
                if (order.paymentMethod === 'cod') {
                    // COD: Debit Cash, Credit Revenue & Tax
                    // Assuming Cash is collected upon delivery

                    await revenueService.createJournalEntry({
                        date: new Date(),
                        description: `Revenue Recognition - Order ${orderId}`,
                        reference: orderRef,
                        orderId: orderId,
                        createdBy: triggeredBy || 'system',
                        lines: [
                            { accountCode: ACCOUNTS.CASH, debit: totalBilledAmount, credit: new Prisma.Decimal(0), description: 'Cash Received' }, // Dr Cash
                            { accountCode: ACCOUNTS.SALES_REVENUE, debit: new Prisma.Decimal(0), credit: realNetRevenue, description: 'Sales Revenue' }, // Cr Sales
                            { accountCode: ACCOUNTS.SALES_TAX_PAYABLE, debit: new Prisma.Decimal(0), credit: taxAmount, description: 'Sales Tax' } // Cr Tax
                        ]
                    });
                } else {
                    // Online (Paymob): Debit Deferred Revenue (Liability), Credit Revenue & Tax
                    // Move from Liability (Deferred) to Revenue

                    await revenueService.createJournalEntry({
                        date: new Date(),
                        description: `Revenue Recognition (Online) - Order ${orderId}`,
                        reference: orderRef,
                        orderId: orderId,
                        createdBy: triggeredBy || 'system',
                        lines: [
                            { accountCode: ACCOUNTS.DEFERRED_REVENUE, debit: totalBilledAmount, credit: new Prisma.Decimal(0), description: 'Deferred Revenue Reversal' }, // Dr Deferred Revenue
                            { accountCode: ACCOUNTS.SALES_REVENUE, debit: new Prisma.Decimal(0), credit: realNetRevenue, description: 'Sales Revenue' }, // Cr Sales
                            { accountCode: ACCOUNTS.SALES_TAX_PAYABLE, debit: new Prisma.Decimal(0), credit: taxAmount, description: 'Sales Tax' } // Cr Tax
                        ]
                    });
                }

                // B. COGS Journal
                // Debit COGS (Expense), Credit Inventory (Asset)
                if (totalCogs.gt(0)) {
                    const cogsJournalEntry = await revenueService.createJournalEntry({
                        date: new Date(),
                        description: `COGS - Order ${orderId}`,
                        reference: orderRef,
                        orderId: orderId,
                        createdBy: triggeredBy || 'system',
                        lines: [
                            { accountCode: ACCOUNTS.COGS, debit: totalCogs, credit: new Prisma.Decimal(0), description: 'Cost of Goods Sold' }, // Dr COGS
                            { accountCode: ACCOUNTS.INVENTORY, debit: new Prisma.Decimal(0), credit: totalCogs, description: 'Inventory Asset Reduction' } // Cr Inventory
                        ]
                    });

                    await tx.revenueRecognition.update({
                        where: { orderId },
                        data: { cogsJournalId: cogsJournalEntry.id }
                    });
                }

                return recog;
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); // End Transaction

            // Post-Commit Actions (Outside TX)
            if (result) {
                // Process Partner Commission
                const order = await prisma.order.findUnique({ where: { id: orderId }, include: { coupon: true } });
                if (order?.coupon?.code) {
                    await partnerService.processCommission(orderId, order.coupon.code, Number(order.totalPrice))
                        .catch(e => logger.error(`Commission failed`, e));
                }
            }

            return result;

        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                return; // Race condition handled
            }
            throw e;
        }
    },

    /**
     * Helper for Journals inside Transaction
     */
    async _createJournal(tx: Prisma.TransactionClient, desc: string, orderId: string, lines: { code: string, debit?: number, credit?: number }[], user: string) {
        const accountMap = new Map<string, string>();

        // Resolve Accounts
        for (const line of lines) {
            if (!accountMap.has(line.code)) {
                const acc = await tx.account.findFirst({ where: { code: line.code } });
                if (!acc) throw new Error(`Account ${line.code} missing`);
                accountMap.set(line.code, acc.id);
            }
        }

        const journal = await tx.journalEntry.create({
            data: {
                description: desc,
                reference: `ORD-${orderId.substring(0, 8)}`,
                date: new Date(),
                status: 'POSTED',
                createdBy: user,
                orderId,
                lines: {
                    create: lines.map(l => ({
                        accountId: accountMap.get(l.code)!,
                        debit: new Decimal(l.debit || 0),
                        credit: new Decimal(l.credit || 0),
                        description: desc
                    }))
                }
            }
        });

        // Update Balances
        for (const line of lines) {
            const accId = accountMap.get(line.code)!;
            const change = (line.debit || 0) - (line.credit || 0); // Simplified check (Asset/Expense logic managed in Service)
            // Wait, revenueService handles Debit/Credit logic for balances based on Account Type. 
            // Here we are doing raw updates. We should ideally respect the Type.
            // BUT, `updateAccountBalance` in original helper just did `increment: amount`.
            // Let's stick to the pattern: Debit is usually (+), Credit (-)? NO. 
            // Previous logic:
            // ASSET/EXPENSE: Debit(+), Credit(-)
            // EQUITY/LIAB/REV: Credit(+), Debit(-)

            const acc = await tx.account.findUnique({ where: { id: accId } });
            const isDebitNormal = ['ASSET', 'EXPENSE'].includes(acc!.type);

            let balanceChange = 0;
            if (isDebitNormal) {
                balanceChange = (line.debit || 0) - (line.credit || 0);
            } else {
                balanceChange = (line.credit || 0) - (line.debit || 0);
            }

            await tx.account.update({
                where: { id: accId },
                data: { balance: { increment: balanceChange } }
            });
        }
        return journal;
    }
};

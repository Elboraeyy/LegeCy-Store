'use server';

import prisma from '@/lib/prisma';
import { ACCOUNTS } from '@/lib/constants/accounts';

export async function getProfitQualityReport() {
    // Fetch Account Balances
    const accounts = await prisma.account.findMany();
    
    const getBalance = (code: string) => {
        const acc = accounts.find(a => a.code === code);
        return Number(acc?.balance || 0);
    };

    // Revenue (Credit Linking)
    const revenue = getBalance(ACCOUNTS.SALES_REVENUE);
    // COGS (Debit)
    const cogs = getBalance(ACCOUNTS.COGS);
    
    // Gross Profit
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Operating Expenses (All Expenses except COGS, Interest, Tax)
    // For now, assuming all "EXPENSE" types (5xxx) except COGS (5000) are OpEx
    const expenses = accounts
        .filter(a => a.type === 'EXPENSE' && a.code !== ACCOUNTS.COGS)
        .reduce((sum, a) => sum + Number(a.balance), 0);

    const operatingProfit = grossProfit - expenses;

    // Cash Flow Proxy (Operating Cash Flow)
    // Simplified: Net Income + Depreciation (ignored) - Change in Working Capital
    // For MVP transparency: Cash vs Accrual Quality
    // Quality Ratio = Operating Cash Flow / Net Income
    // We'll use a simpler metric: "Cash Conversion" -> Cash Balance / Net Income (Rough proxy)
    const cash = getBalance(ACCOUNTS.CASH);
    
    return {
        revenue,
        cogs,
        grossProfit,
        grossMargin,
        expenses,
        operatingProfit,
        netIncome: operatingProfit, // Assuming no tax/interest for now
        cashBalance: cash
    };
}

'use server';

/**
 * Export Service
 * 
 * Universal export capability for all data tables.
 * Supports CSV format with planned Excel support.
 */

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/guards';
import { Account } from '@prisma/client';

/**
 * Convert array of objects to CSV string
 */
function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val?.toString() || '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Format date for export
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Format currency for export
 */
function formatCurrency(amount: unknown): string {
  return Number(amount || 0).toFixed(2);
}

// ===========================================
// Export Functions for Each Entity
// ===========================================

/**
 * Export Orders to CSV
 */
export async function exportOrders(filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ filename: string; content: string }> {
  await requireAdmin();
  
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) (where.createdAt as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.createdAt as Record<string, unknown>).lte = filters.endDate;
  }
  
  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });
  
  const data = orders.map(o => ({
    'Order ID': o.id,
    'Date': formatDate(o.createdAt),
    'Customer': o.customerName || 'N/A',
    'Email': o.customerEmail || 'N/A',
    'Phone': o.customerPhone || 'N/A',
    'Status': o.status,
    'Payment Method': o.paymentMethod,
    'Order Source': o.orderSource,
    'Items Count': o.items.length,
    'Total (EGP)': formatCurrency(o.totalPrice),
    'City': o.shippingCity || 'N/A'
  }));
  
  return {
    filename: `orders_export_${new Date().toISOString().split('T')[0]}.csv`,
    content: toCSV(data)
  };
}

/**
 * Export Products to CSV
 */
export async function exportProducts(): Promise<{ filename: string; content: string }> {
  await requireAdmin();
  
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      categoryRel: true,
      brand: true
    }
  });
  
  const data = products.map(p => ({
    'Product ID': p.id,
    'Name': p.name,
    'Category': p.categoryRel?.name || p.category || 'N/A',
    'Brand': p.brand?.name || 'N/A',
    'Status': p.status,
    'Variants': p.variants.length,
    'Base Price (EGP)': formatCurrency(p.variants[0]?.price),
    'Cost Price (EGP)': formatCurrency(p.variants[0]?.costPrice),
    'Created': formatDate(p.createdAt)
  }));
  
  return {
    filename: `products_export_${new Date().toISOString().split('T')[0]}.csv`,
    content: toCSV(data)
  };
}

/**
 * Export Inventory to CSV
 */
export async function exportInventory(): Promise<{ filename: string; content: string }> {
  await requireAdmin();
  
  const inventory = await prisma.inventory.findMany({
    include: {
      variant: {
        include: { product: true }
      },
      warehouse: true
    }
  });
  
  const data = inventory.map(inv => ({
    'Product': inv.variant?.product?.name || 'N/A',
    'SKU': inv.variant?.sku || 'N/A',
    'Warehouse': inv.warehouse?.name || 'Primary',
    'Available': inv.available,
    'Reserved': inv.reserved,
    'Cost Price (EGP)': formatCurrency(inv.variant?.costPrice),
    'Sale Price (EGP)': formatCurrency(inv.variant?.price),
    'Value at Cost (EGP)': formatCurrency(Number(inv.variant?.costPrice || 0) * inv.available),
    'Value at Sale (EGP)': formatCurrency(Number(inv.variant?.price || 0) * inv.available)
  }));
  
  return {
    filename: `inventory_export_${new Date().toISOString().split('T')[0]}.csv`,
    content: toCSV(data)
  };
}

/**
 * Export Expenses to CSV
 */
export async function exportExpenses(filters?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{ filename: string; content: string }> {
  await requireAdmin();
  
  const where: Record<string, unknown> = {};
  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) (where.date as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.date as Record<string, unknown>).lte = filters.endDate;
  }
  
  const expenses = await prisma.expense.findMany({
    where,
    include: { category: true },
    orderBy: { date: 'desc' }
  });
  
  const data = expenses.map(e => ({
    'Date': formatDate(e.date),
    'Description': e.description,
    'Category': e.category?.name || 'N/A',
    'Amount (EGP)': formatCurrency(e.amount),
    'Status': e.status,
    'Created': formatDate(e.createdAt)
  }));
  
  return {
    filename: `expenses_export_${new Date().toISOString().split('T')[0]}.csv`,
    content: toCSV(data)
  };
}

/**
 * Export Journal Entries to CSV
 */
export async function exportJournalEntries(filters?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{ filename: string; content: string }> {
  await requireAdmin();
  
  const where: Record<string, unknown> = {};
  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) (where.date as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.date as Record<string, unknown>).lte = filters.endDate;
  }
  
  const entries = await prisma.journalEntry.findMany({
    where,
    include: {
      lines: {
        include: { account: true }
      }
    },
    orderBy: { date: 'desc' }
  });
  
  // Flatten journal entries with lines
  const data: Record<string, unknown>[] = [];
  
  for (const entry of entries) {
    for (const line of entry.lines) {
      data.push({
        'Entry ID': entry.id,
        'Date': formatDate(entry.date),
        'Description': entry.description,
        'Reference': entry.reference || '',
        'Account Code': line.account?.code || '',
        'Account Name': line.account?.name || '',
        'Debit (EGP)': formatCurrency(line.debit),
        'Credit (EGP)': formatCurrency(line.credit),
        'Line Description': line.description || ''
      });
    }
  }
  
  return {
    filename: `journal_entries_export_${new Date().toISOString().split('T')[0]}.csv`,
    content: toCSV(data)
  };
}

/**
 * Export Customers to CSV
 */
export async function exportCustomers(): Promise<{ filename: string; content: string }> {
  await requireAdmin();
  
  const customers = await prisma.user.findMany({
    include: {
      _count: { select: { orders: true } }
    }
  });
  
  const data = customers.map(c => ({
    'Customer ID': c.id,
    'Name': c.name || 'N/A',
    'Email': c.email,
    'Phone': c.phone || 'N/A',
    'Orders Count': c._count.orders,
    'Points': c.points,
    'Created': formatDate(c.createdAt)
  }));
  
  return {
    filename: `customers_export_${new Date().toISOString().split('T')[0]}.csv`,
    content: toCSV(data)
  };
}

/**
 * Export Procurement Invoices to CSV
 */
export async function exportProcurementInvoices(): Promise<{ filename: string; content: string }> {
  await requireAdmin();
  
  const invoices = await prisma.purchaseInvoice.findMany({
    include: {
      supplier: true,
      items: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const data = invoices.map(inv => ({
    'Invoice ID': inv.id,
    'Created': formatDate(inv.createdAt),
    'Supplier': inv.supplier?.name || 'N/A',
    'Status': inv.status,
    'Items Count': inv.items.length,
    'Grand Total (EGP)': formatCurrency(inv.grandTotal),
    'Subtotal (EGP)': formatCurrency(inv.subtotal)
  }));
  
  return {
    filename: `procurement_invoices_export_${new Date().toISOString().split('T')[0]}.csv`,
    content: toCSV(data)
  };
}

/**
 * Export Financial Accounts (Chart of Accounts) to CSV
 */
export async function exportChartOfAccounts(): Promise<{ filename: string; content: string }> {
  await requireAdmin();
  
  const accounts = await prisma.account.findMany({
    orderBy: { code: 'asc' }
  });
  
  const data = accounts.map((a: { code: string; name: string; type: string; description: string | null; balance: unknown }) => ({
    'Code': a.code,
    'Name': a.name,
    'Type': a.type,
    'Description': a.description || '',
    'Balance (EGP)': formatCurrency(a.balance)
  }));
  
  return {
    filename: `chart_of_accounts_${new Date().toISOString().split('T')[0]}.csv`,
    content: toCSV(data)
  };
}

/**
 * Export Capital Transactions to CSV
 */
export async function exportCapitalTransactions(): Promise<{ filename: string; content: string }> {
  await requireAdmin();
  
  const transactions = await prisma.capitalTransaction.findMany({
    include: { investor: true },
    orderBy: { date: 'desc' }
  });
  
  const data = transactions.map(tx => ({
    'Transaction ID': tx.id,
    'Date': formatDate(tx.date),
    'Investor': tx.investor?.name || 'N/A',
    'Type': tx.type,
    'Amount (EGP)': formatCurrency(tx.amount),
    'Description': tx.description || '',
    'Created': formatDate(tx.createdAt)
  }));
  
  return {
    filename: `capital_transactions_${new Date().toISOString().split('T')[0]}.csv`,
    content: toCSV(data)
  };
}

/**
 * Export Balance Sheet (Ledger Truth)
 */
export async function exportBalanceSheet(): Promise<{ filename: string; content: string }> {
  await requireAdmin();

  // 1. Get all accounts
  const accounts = await prisma.account.findMany();

  // 2. Group by Type
  const assets = accounts.filter(a => a.type === 'ASSET');
  const liabilities = accounts.filter(a => a.type === 'LIABILITY');
  const equity = accounts.filter(a => a.type === 'EQUITY');

  // 3. Flatten for CSV
  const data: Record<string, unknown>[] = [];

  const addRow = (section: string, a: Account) => {
    data.push({
      'Section': section,
      'Code': a.code,
      'Account Name': a.name,
      'Balance (EGP)': formatCurrency(a.balance)
    });
  };

  assets.forEach(a => addRow('ASSETS', a));
  liabilities.forEach(a => addRow('LIABILITIES', a));
  equity.forEach(a => addRow('EQUITY', a));

  // Summary Rows
  const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalEquity = equity.reduce((sum, a) => sum + Number(a.balance), 0);

  data.push({}); // Spacer
  data.push({ 'Section': 'SUMMARY', 'Account Name': 'TOTAL ASSETS', 'Balance (EGP)': formatCurrency(totalAssets) });
  data.push({ 'Section': 'SUMMARY', 'Account Name': 'TOTAL LIABILITIES', 'Balance (EGP)': formatCurrency(totalLiabilities) });
  data.push({ 'Section': 'SUMMARY', 'Account Name': 'TOTAL EQUITY', 'Balance (EGP)': formatCurrency(totalEquity) });
  data.push({ 'Section': 'SUMMARY', 'Account Name': 'CHECKSUM (A - L - E)', 'Balance (EGP)': formatCurrency(totalAssets - totalLiabilities - totalEquity) });

  return {
    filename: `balance_sheet_${new Date().toISOString().split('T')[0]}.csv`,
    content: toCSV(data)
  };
}

/**
 * Export P&L (Ledger Truth)
 */
export async function exportPnL(startDate?: Date, endDate?: Date): Promise<{ filename: string; content: string }> {
  await requireAdmin();

  // Fetch Revenue and Expense accounts
  const accounts = await prisma.account.findMany({
    where: {
      type: { in: ['REVENUE', 'EXPENSE'] }
    }
  });

  // Calculate Net Movements for period if dates provided, otherwise use current balance
  // Note: P&L is usually period-based. Using current balance implies "since inception".
  // For proper period P&L, we should sum JournalLines.
  
  // Fetch lines if period is strictly needed
  const data: Record<string, unknown>[] = [];
  
  if (startDate || endDate) {
     // TODO: Implement Period-based aggregation from TransactionLine
     // For now, exporting current balances as "Year to Date" proxy or similar
  }

  const revenue = accounts.filter(a => a.type === 'REVENUE');
  const expense = accounts.filter(a => a.type === 'EXPENSE');

  const addRow = (section: string, a: Account) => {
    data.push({
      'Section': section,
      'Code': a.code,
      'Account Name': a.name,
      'Balance (EGP)': formatCurrency(a.balance)
    });
  };

  revenue.forEach(a => addRow('REVENUE', a));
  expense.forEach(a => addRow('EXPENSE', a));

  const totalRevenue = revenue.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalExpense = expense.reduce((sum, a) => sum + Number(a.balance), 0);
  
  data.push({});
  data.push({ 'Section': 'SUMMARY', 'Account Name': 'TOTAL REVENUE', 'Balance (EGP)': formatCurrency(totalRevenue) });
  data.push({ 'Section': 'SUMMARY', 'Account Name': 'TOTAL EXPENSE', 'Balance (EGP)': formatCurrency(totalExpense) });
  data.push({ 'Section': 'SUMMARY', 'Account Name': 'NET INCOME', 'Balance (EGP)': formatCurrency(totalRevenue - totalExpense) });

  return {
    filename: `profit_loss_${new Date().toISOString().split('T')[0]}.csv`,
    content: toCSV(data)
  };
}

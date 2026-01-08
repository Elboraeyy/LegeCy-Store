'use server';

import prisma from '@/lib/prisma';


/**
 * Forecast Service
 * 
 * Provides predictive analytics for sales, cash flow, and inventory.
 * Uses linear regression and velocity metrics.
 */

type ForecastPoint = {
  date: string;
  value: number;
  type: 'historical' | 'forecast';
  confidenceLow?: number;
  confidenceHigh?: number;
};

/**
 * Predict sales for the next N months using historical data
 */
export async function predictSales(monthsToForecast: number = 3): Promise<ForecastPoint[]> {
  // 1. Get historical monthly sales (last 12 months)
  const today = new Date();
  const twelveMonthsAgo = new Date(today.getFullYear() - 1, today.getMonth(), 1);
  

  
  // Aggregate by month (Prisma groupBy by date returns exact timestamps, we need to bucket them)
  // Since we can't easily group by month in Prisma date field, we fetch and aggregate in JS
  // Optimization: Raw query would be better, but explicit aggregation is safer for database compatibility
  
  const aggregated: Record<string, number> = {};
  
  const rawSales = await prisma.revenueRecognition.findMany({
    where: { recognizedAt: { gte: twelveMonthsAgo } },
    select: { recognizedAt: true, netRevenue: true }
  });
  
  rawSales.forEach(s => {
    const key = s.recognizedAt.toISOString().slice(0, 7); // YYYY-MM
    aggregated[key] = (aggregated[key] || 0) + Number(s.netRevenue);
  });
  
  // Convert to array for regression
  const historyPoints = Object.entries(aggregated)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value], index) => ({ index, date, value }));
    
  if (historyPoints.length < 2) {
    return []; // Not enough data
  }
  
  // 2. Linear Regression (Simple: y = mx + b)
  const n = historyPoints.length;
  const sumX = historyPoints.reduce((acc, p) => acc + p.index, 0);
  const sumY = historyPoints.reduce((acc, p) => acc + p.value, 0);
  const sumXY = historyPoints.reduce((acc, p) => acc + (p.index * p.value), 0);
  const sumXX = historyPoints.reduce((acc, p) => acc + (p.index * p.index), 0);
  
  const run = (n * sumXX) - (sumX * sumX);
  if (run === 0) return []; // Vertical line, error
  
  const m = ((n * sumXY) - (sumX * sumY)) / run;
  const b = (sumY - (m * sumX)) / n;
  
  // 3. Generate Forecast
  const forecast: ForecastPoint[] = [];
  
  // Add history
  historyPoints.forEach(p => {
    forecast.push({
      date: p.date,
      value: p.value,
      type: 'historical'
    });
  });
  
  // Add future
  const lastDate = new Date(historyPoints[historyPoints.length - 1].date + '-01');
  
  for (let i = 1; i <= monthsToForecast; i++) {
    const nextIndex = historyPoints.length - 1 + i;
    const nextValue = (m * nextIndex) + b;
    
    // Move to next month
    lastDate.setMonth(lastDate.getMonth() + 1);
    const dateStr = lastDate.toISOString().slice(0, 7);
    
    forecast.push({
      date: dateStr,
      value: Math.max(0, nextValue), // No negative sales
      type: 'forecast',
      confidenceLow: Math.max(0, nextValue * 0.9), // rough estimate
      confidenceHigh: nextValue * 1.1
    });
  }
  
  return forecast;
}

/**
 * Calculates current cash runway based on burn rate
 */
export async function calculateRunway(cashBalance: number) {
  // Get expenses from last 3 months
  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  
  const expenses = await prisma.journalEntry.findMany({
    where: {
      date: { gte: threeMonthsAgo },
      lines: {
        some: {
          account: { type: 'EXPENSE' } // Using explicit account type would be cleaner if we had AccountType enum imported
        }
      }
    },
    include: {
      lines: {
        include: { account: true }
      }
    }
  });

  // Calculate monthly burn (Average)
  // ... Simplified burn rate logic for demo
  const totalBurn = expenses.reduce((sum, entry) => {
    const expenseLines = entry.lines.filter(l => l.account.type === 'EXPENSE');
    const entryTotal = expenseLines.reduce((s, l) => s + Number(l.debit), 0);
    return sum + entryTotal;
  }, 0);
  
  const monthlyBurn = totalBurn / 3;
  
  const monthsLeft = monthlyBurn > 0 ? cashBalance / monthlyBurn : Infinity;
  
  return {
    monthlyBurn,
    monthsLeft: monthsLeft === Infinity ? 999 : monthsLeft,
    cashBalance
  };
}

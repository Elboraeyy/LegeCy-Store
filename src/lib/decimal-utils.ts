/**
 * Decimal Utilities for Money Math
 * 
 * CRITICAL: Never use floating-point arithmetic for money.
 * This module provides exact decimal operations.
 */

import { Decimal } from '@prisma/client/runtime/library';

/**
 * Compare two monetary values for exact equality.
 * NEVER use == or === with floats for money.
 */
export function moneyEquals(a: number | Decimal, b: number | Decimal): boolean {
  const aDecimal = new Decimal(a.toString());
  const bDecimal = new Decimal(b.toString());
  return aDecimal.equals(bDecimal);
}

/**
 * Check if two amounts balance (for ledger entries).
 * Returns true if debit === credit exactly.
 */
export function ledgerBalances(debit: number | Decimal, credit: number | Decimal): boolean {
  return moneyEquals(debit, credit);
}

/**
 * Calculate the difference between two amounts.
 * Returns the absolute difference.
 */
export function moneyDifference(a: number | Decimal, b: number | Decimal): Decimal {
  const aDecimal = new Decimal(a.toString());
  const bDecimal = new Decimal(b.toString());
  return aDecimal.minus(bDecimal).abs();
}

/**
 * Sum an array of monetary values with exact precision.
 */
export function moneySum(amounts: (number | Decimal)[]): Decimal {
  return amounts.reduce<Decimal>(
    (acc, val) => acc.plus(new Decimal(val.toString())),
    new Decimal(0)
  );
}

/**
 * Round a monetary value to 2 decimal places.
 */
export function moneyRound(value: number | Decimal): Decimal {
  const decimal = new Decimal(value.toString());
  return decimal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Convert a monetary value to a number for display.
 * Use this ONLY for display, never for calculations.
 */
export function moneyToNumber(value: Decimal): number {
  return value.toNumber();
}

/**
 * Validate that a journal entry balances exactly.
 * Throws if debit !== credit.
 */
export function validateJournalBalance(
  lines: Array<{ debit: number | Decimal; credit: number | Decimal }>
): void {
  const totalDebit = moneySum(lines.map(l => l.debit));
  const totalCredit = moneySum(lines.map(l => l.credit));
  
  if (!totalDebit.equals(totalCredit)) {
    const diff = totalDebit.minus(totalCredit);
    throw new Error(
      `Journal Entry Unbalanced! Debit: ${totalDebit.toString()}, Credit: ${totalCredit.toString()}, Diff: ${diff.toString()}`
    );
  }
}

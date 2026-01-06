
import { getExpenses, getExpenseCategories } from '@/lib/actions/finance';
import ExpensesClient from './ExpensesClient';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const [expenses, categories] = await Promise.all([
    getExpenses(),
    getExpenseCategories()
  ]);

  return <ExpensesClient expenses={expenses} categories={categories} />;
}

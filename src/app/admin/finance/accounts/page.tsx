import { getAccounts } from '@/lib/actions/finance';
import AccountsClient from './AccountsClient';

export default async function AccountsPage() {
  const rawAccounts = await getAccounts();

  // Transform for client
  const accounts = rawAccounts.map(acc => ({
    ...acc,
    balance: Number(acc.balance),
    // Ensure dates are strings or kept as Date if Client Component handles it. 
    // Usually Server -> Client passes dates as Dates in generic props, 
    // but if we are super safe we can ISO string them. 
    // AccountsClient doesn't use dates, so it's fine.
    // However, we should be careful about other Decimal fields if any.
    // Only balance is Decimal.
  }));

  return <AccountsClient accounts={accounts} />;
}

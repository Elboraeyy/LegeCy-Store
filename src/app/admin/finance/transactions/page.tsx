
import { getJournalEntries } from '@/lib/actions/finance';
import LedgerClient from './LedgerClient';

export const dynamic = 'force-dynamic';

export default async function LedgerPage() {
  const entries = await getJournalEntries();

  return <LedgerClient entries={entries} />;
}

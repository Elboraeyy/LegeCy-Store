
import { getInvestors } from '@/lib/actions/finance';
import EquityClient from './EquityClient';

export const dynamic = 'force-dynamic';

export default async function EquityPage() {
  const investors = await getInvestors();

  return <EquityClient investors={investors} />;
}

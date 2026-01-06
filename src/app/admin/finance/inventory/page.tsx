
import { getInventoryValuation } from '@/lib/actions/finance';
import InventoryValuationClient from './InventoryValuationClient';

export const dynamic = 'force-dynamic';

export default async function InventoryValuationPage() {
  const data = await getInventoryValuation();

  return <InventoryValuationClient data={data} />;
}

'use server';

import { getKillSwitches, KillSwitches } from '@/lib/killSwitches';

/**
 * Get payment methods status for checkout UI
 */
export async function getPaymentMethodsStatus(): Promise<{
  cod: boolean;
  paymob: boolean;
  wallet: boolean;
}> {
  const switches = await getKillSwitches();
  
  return {
    cod: switches.payments_enabled && switches.cod_enabled,
    paymob: switches.payments_enabled && switches.paymob_enabled,
    wallet: switches.payments_enabled && switches.wallet_enabled,
  };
}

/**
 * Get all kill switches for admin UI
 */
export async function getKillSwitchesAction(): Promise<KillSwitches> {
  return getKillSwitches();
}

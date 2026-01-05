'use server';

import { getKillSwitches, KillSwitches } from '@/lib/killSwitches';
import prisma from '@/lib/prisma';

interface PaymentSettings {
  enableCOD?: boolean;
  enablePaymob?: boolean;
  enableFawry?: boolean;
}

/**
 * Get payment methods status for checkout UI
 * Reads from both kill switches AND payment_settings config
 */
export async function getPaymentMethodsStatus(): Promise<{
  cod: boolean;
  paymob: boolean;
  wallet: boolean;
}> {
  const switches = await getKillSwitches();
  
  // Also check payment_settings from admin config
  let paymentSettings: PaymentSettings = {};
  try {
    const config = await prisma.storeConfig.findUnique({
      where: { key: 'payment_settings' }
    });
    if (config?.value) {
      paymentSettings = config.value as PaymentSettings;
    }
  } catch {
    // Use defaults
  }
  
  return {
    // COD: master switch enabled AND payment settings allows it
    cod: switches.payments_enabled && (paymentSettings.enableCOD !== false),
    // Paymob: master switch enabled AND payment settings allows it  
    paymob: switches.payments_enabled && (paymentSettings.enablePaymob === true),
    // Wallet: master switch enabled AND individual kill switch (no settings page yet)
    wallet: switches.payments_enabled && switches.wallet_enabled,
  };
}

/**
 * Get all kill switches for admin UI
 */
export async function getKillSwitchesAction(): Promise<KillSwitches> {
  return getKillSwitches();
}



import prisma from '@/lib/prisma';

/**
 * Kill Switches - Central feature flag system for emergency controls
 * 
 * These can be toggled from admin panel to instantly disable features
 * without code deployment.
 */

export type KillSwitches = {
  payments_enabled: boolean;      // Master payment kill switch
  paymob_enabled: boolean;        // Card payments via Paymob
  wallet_enabled: boolean;        // Mobile wallet payments
  cod_enabled: boolean;           // Cash on delivery
  checkout_enabled: boolean;      // Entire checkout flow
  coupons_enabled: boolean;       // Coupon usage
  registration_enabled: boolean;  // New user signups
  admin_manual_pay: boolean;      // Admin can mark orders as paid
  pos_enabled: boolean;           // POS system access
};

// Safe defaults - online payments disabled until verified
export const DEFAULT_KILL_SWITCHES: KillSwitches = {
  payments_enabled: true,
  paymob_enabled: false,     // DISABLED by default - enable after testing
  wallet_enabled: false,     // DISABLED by default - enable after testing
  cod_enabled: true,         // Safe - no money movement online
  checkout_enabled: true,
  coupons_enabled: false,    // DISABLED until per-user limits verified
  registration_enabled: true,
  admin_manual_pay: false,   // DISABLED - security risk
  pos_enabled: false,        // DISABLED until needed
};

const CACHE_KEY = 'system_kill_switches';
let cachedSwitches: KillSwitches | null = null;
let cacheTime: number = 0;
const CACHE_TTL_MS = 30000; // 30 seconds cache

/**
 * Get current kill switch configuration
 * Caches for 30 seconds to avoid DB hits on every request
 */
export async function getKillSwitches(): Promise<KillSwitches> {
  const now = Date.now();
  
  // Return cached if valid
  if (cachedSwitches && (now - cacheTime) < CACHE_TTL_MS) {
    return cachedSwitches;
  }

  try {
    const config = await prisma.storeConfig.findUnique({
      where: { key: CACHE_KEY }
    });

    if (config && config.value) {
      cachedSwitches = {
        ...DEFAULT_KILL_SWITCHES,
        ...(config.value as Partial<KillSwitches>)
      };
    } else {
      cachedSwitches = DEFAULT_KILL_SWITCHES;
    }
    
    cacheTime = now;
    return cachedSwitches;
  } catch (error) {
    console.error('Failed to load kill switches, using defaults:', error);
    return DEFAULT_KILL_SWITCHES;
  }
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(feature: keyof KillSwitches): Promise<boolean> {
  const switches = await getKillSwitches();
  return switches[feature] ?? false;
}

/**
 * Update kill switches (admin only)
 */
export async function updateKillSwitches(updates: Partial<KillSwitches>): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getKillSwitches();
    const newSwitches = { ...current, ...updates };

    await prisma.storeConfig.upsert({
      where: { key: CACHE_KEY },
      update: { value: newSwitches as object },
      create: { key: CACHE_KEY, value: newSwitches as object }
    });

    // Invalidate cache
    cachedSwitches = newSwitches;
    cacheTime = Date.now();

    return { success: true };
  } catch (error) {
    console.error('Failed to update kill switches:', error);
    return { success: false, error: 'Failed to update kill switches' };
  }
}

/**
 * Feature guard - throws error if feature is disabled
 * Use in server actions and API routes
 */
export async function requireFeature(feature: keyof KillSwitches, errorMessage?: string): Promise<void> {
  const enabled = await isFeatureEnabled(feature);
  if (!enabled) {
    throw new Error(errorMessage || `${feature} is currently disabled`);
  }
}

/**
 * Payment method guard - checks if specific payment method is allowed
 */
export async function isPaymentMethodEnabled(method: 'cod' | 'paymob' | 'wallet'): Promise<boolean> {
  const switches = await getKillSwitches();
  
  if (!switches.payments_enabled) return false;
  
  switch (method) {
    case 'cod':
      return switches.cod_enabled;
    case 'paymob':
      return switches.paymob_enabled;
    case 'wallet':
      return switches.wallet_enabled;
    default:
      return false;
  }
}

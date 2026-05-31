"use server";

import { getStoreConfig, ShippingSettings } from "@/lib/actions/config";
import { EGYPT_LOCATIONS } from "@/data/egypt-locations";

// Default shipping settings (fallback if not configured)
const defaultShippingSettings: ShippingSettings = {
  enableShipping: true,
  freeShippingThreshold: 2000,
  defaultShippingRate: 50,
  shippingZones: [
    { name: 'Cairo & Giza', governorates: ['Cairo', 'Giza'], cities: [], rate: 40 },
    { name: 'Alexandria', governorates: ['Alexandria'], cities: [], rate: 50 },
    { name: 'Other Governorates', governorates: [], cities: [], rate: 70 },
  ],
};

/**
 * Get shipping settings from database
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const settings = await getStoreConfig('shipping_settings');

    // Fetch dynamic threshold override
    const { getStoreSettings } = await import('@/lib/actions/settings');
    const dynamicSettings = await getStoreSettings(['FREE_SHIPPING_THRESHOLD', 'FREE_SHIPPING_ENABLED']);

    const config = settings ? (settings as ShippingSettings) : { ...defaultShippingSettings };

    // Default to false if not explicitly set to "true"
    const isFreeShippingEnabled = dynamicSettings['FREE_SHIPPING_ENABLED'] === 'true';

    if (isFreeShippingEnabled) {
      if (dynamicSettings['FREE_SHIPPING_THRESHOLD']) {
        config.freeShippingThreshold = Number(dynamicSettings['FREE_SHIPPING_THRESHOLD']);
      }
    } else {
      config.freeShippingThreshold = 999999999; // Effectively disable if toggle is off
    }

    return config;
  } catch (error) {
    console.error('[Shipping] Failed to get settings:', error);
    return defaultShippingSettings;
  }
}

/**
 * Get list of all Egyptian governorates for checkout dropdown
 */
export async function getEgyptianGovernorates(): Promise<string[]> {
  return EGYPT_LOCATIONS.map(gov => gov.en);
}

// Deprecated: Use getEgyptianGovernorates instead
export async function getEgyptianCities(): Promise<string[]> {
  return getEgyptianGovernorates();
}

/**
 * Get shipping rate for a specific governorate and city (optional)
 * Priority: 
 * 1. Specific City Match in any zone
 * 2. Governorate Match in any zone
 * 3. Default Shipping Rate
 */
export async function getShippingRateForGovernorate(governorate: string, city?: string): Promise<{
  rate: number;
  zoneName: string;
  isFreeShipping: boolean;
}> {
  const settings = await getShippingSettings();
  
  if (!settings.enableShipping) {
    return { rate: 0, zoneName: 'Shipping Disabled', isFreeShipping: true };
  }
  
  // Normalize names for comparison
  const normalizedGov = governorate.toLowerCase().trim();
  const normalizedCity = city?.toLowerCase().trim();
  
  // 1. Check for specific City Exception across all zones
  if (normalizedCity) {
    for (const zone of settings.shippingZones) {
      const cityMatch = (zone.cities || []).find(
        (c) => c.governorate.toLowerCase().trim() === normalizedGov &&
          c.city.toLowerCase().trim() === normalizedCity
      );
      if (cityMatch) {
        return {
          rate: cityMatch.rate,
          zoneName: `${zone.name} (City Override)`,
          isFreeShipping: false
        };
      }
    }
  }

  // 2. Check for Governorate Match
  for (const zone of settings.shippingZones) {
    const govMatch = (zone.governorates || []).some(
      (g) => g.toLowerCase().trim() === normalizedGov
    );
    if (govMatch) {
      return { 
        rate: zone.rate, 
        zoneName: zone.name,
        isFreeShipping: false
      };
    }
  }
  
  // No matching zone found - use default rate
  return { 
    rate: settings.defaultShippingRate, 
    zoneName: 'Standard Shipping',
    isFreeShipping: false
  };
}

// Backward compatibility alias (still useful as some parts might only pass one)
export async function getShippingRateForCity(city: string) {
  return getShippingRateForGovernorate(city);
}

/**
 * Calculate shipping cost for a governorate and city.
 */
export async function calculateShipping(
  governorate: string,
  subtotal: number,
  city?: string
): Promise<{
  shippingCost: number;
  zoneName: string;
  isFreeShipping: boolean;
}> {
  // Check if subtotal qualifies for free shipping
  const settings = await getShippingSettings();
  if (subtotal >= settings.freeShippingThreshold) {
    return {
      shippingCost: 0,
      zoneName: 'Free Shipping',
      isFreeShipping: true,
    };
  }

  // Get rate for location
  const { rate, zoneName } = await getShippingRateForGovernorate(governorate, city);
  
  return {
    shippingCost: rate,
    zoneName,
    isFreeShipping: rate === 0,
  };
}

/**
 * Get shipping summary for order creation
 */
export async function getShippingSummary(governorate: string, subtotal: number, city?: string) {
  const result = await calculateShipping(governorate, subtotal, city);
  return {
    shippingCost: result.shippingCost,
    shippingMethod: result.zoneName,
    isFreeShipping: result.isFreeShipping,
  };
}

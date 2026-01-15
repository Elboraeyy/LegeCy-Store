"use server";

import { getStoreConfig, ShippingSettings } from "@/lib/actions/config";

// Default shipping settings (fallback if not configured)
const defaultShippingSettings: ShippingSettings = {
  enableShipping: true,
  freeShippingThreshold: 0,
  defaultShippingRate: 50,
  expressShippingRate: 100,
  shippingZones: [
    { name: 'Cairo & Giza', cities: ['Cairo', 'Giza'], rate: 40 },
    { name: 'Alexandria', cities: ['Alexandria'], rate: 50 },
    { name: 'Other Governorates', cities: [], rate: 70 },
  ],
};

/**
 * Get shipping settings from database
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const settings = await getStoreConfig('shipping_settings');
    if (settings) {
      return settings as ShippingSettings;
    }
    return defaultShippingSettings;
  } catch (error) {
    console.error('[Shipping] Failed to get settings:', error);
    return defaultShippingSettings;
  }
}

/**
 * Get list of all Egyptian cities for checkout dropdown
 */
export async function getEgyptianCities(): Promise<string[]> {
  return [
    'Cairo',
    'Giza',
    'Alexandria',
    'Mansoura',
    'Tanta',
    'Zagazig',
    'Assiut',
    'Sohag',
    'Luxor',
    'Aswan',
    'Port Said',
    'Suez',
    'Ismailia',
    'Damietta',
    'Minya',
    'Beni Suef',
    'Fayoum',
    'Qena',
    'Sharm El Sheikh',
    'Hurghada',
    'Marsa Matrouh',
    'Kafr El Sheikh',
    'Beheira',
    'Gharbia',
    'Monufia',
    'Sharqia',
    'Dakahlia',
    'Red Sea',
    'New Valley',
    'North Sinai',
    'South Sinai',
    'Matrouh',
  ];
}

/**
 * Get shipping rate for a specific city
 * Searches through zones to find matching city, falls back to default rate
 */
export async function getShippingRateForCity(city: string): Promise<{
  rate: number;
  zoneName: string;
  isFreeShipping: boolean;
}> {
  const settings = await getShippingSettings();
  
  if (!settings.enableShipping) {
    return { rate: 0, zoneName: 'Shipping Disabled', isFreeShipping: true };
  }
  
  // Normalize city name for comparison
  const normalizedCity = city.toLowerCase().trim();
  
  // Search through zones for matching city
  for (const zone of settings.shippingZones) {
    const cityMatch = zone.cities.some(
      (c) => c.toLowerCase().trim() === normalizedCity
    );
    if (cityMatch) {
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

/**
 * Calculate shipping cost with free shipping threshold
 */
export async function calculateShipping(
  city: string, 
  subtotal: number
): Promise<{
  shippingCost: number;
  zoneName: string;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  amountToFreeShipping: number;
}> {
  const settings = await getShippingSettings();
  
  // Check if subtotal qualifies for free shipping
  if (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) {
    return {
      shippingCost: 0,
      zoneName: 'Free Shipping',
      isFreeShipping: true,
      freeShippingThreshold: settings.freeShippingThreshold,
      amountToFreeShipping: 0,
    };
  }
  
  // Get rate for city
  const { rate, zoneName } = await getShippingRateForCity(city);
  
  return {
    shippingCost: rate,
    zoneName,
    isFreeShipping: rate === 0,
    freeShippingThreshold: settings.freeShippingThreshold,
    amountToFreeShipping: settings.freeShippingThreshold > 0 
      ? Math.max(0, settings.freeShippingThreshold - subtotal) 
      : 0,
  };
}

/**
 * Get shipping summary for order creation
 */
export async function getShippingSummary(city: string, subtotal: number) {
  const result = await calculateShipping(city, subtotal);
  return {
    shippingCost: result.shippingCost,
    shippingMethod: result.zoneName,
    isFreeShipping: result.isFreeShipping,
  };
}

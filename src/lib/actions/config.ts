"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// Get a single config by key
export async function getStoreConfig(key: string) {
  const config = await prisma.storeConfig.findUnique({
    where: { key }
  });
  return config?.value || null;
}

// Get multiple configs by keys (batch fetch)
export async function getMultipleConfigs(keys: string[]) {
  const configs = await prisma.storeConfig.findMany({
    where: { key: { in: keys } }
  });
  
  const result: Record<string, unknown> = {};
  configs.forEach(config => {
    result[config.key] = config.value;
  });
  return result;
}

// Get all configs that start with a prefix (for sections)
export async function getConfigsByPrefix(prefix: string) {
  const configs = await prisma.storeConfig.findMany({
    where: {
      key: { startsWith: prefix }
    }
  });
  
  const result: Record<string, unknown> = {};
  configs.forEach(config => {
    result[config.key] = config.value;
  });
  return result;
}

// Update a single config
export async function updateStoreConfig(key: string, value: Prisma.InputJsonValue) {
  await prisma.storeConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
  revalidatePath('/');
  revalidatePath('/admin/config');
  return { success: true };
}

// Update multiple configs at once
export async function updateMultipleConfigs(configs: Record<string, Prisma.InputJsonValue>) {
  const promises = Object.entries(configs).map(([key, value]) =>
    prisma.storeConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
  );
  
  await Promise.all(promises);
  revalidatePath('/');
  revalidatePath('/admin/config');
  return { success: true };
}

// Delete a config
export async function deleteStoreConfig(key: string) {
  await prisma.storeConfig.delete({
    where: { key }
  }).catch(() => null); // Ignore if not found
  
  revalidatePath('/');
  revalidatePath('/admin/config');
  return { success: true };
}

// Type-safe helpers for common settings
export type GeneralSettings = {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  timezone: string;
  currency: string;
  businessId: string;
};

export type AppearanceSettings = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
  darkMode: boolean;
  customCSS: string;
};

export type SEOSettings = {
  metaTitle: string;
  metaDescription: string;
  googleAnalyticsId: string;
  facebookPixelId: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    tiktok: string;
    youtube: string;
  };
};

export type SecuritySettings = {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  enableTwoFactor: boolean;
  adminIpWhitelist: string[];
  enableCaptcha: boolean;
};

export type ShippingSettings = {
  enableShipping: boolean;
  freeShippingThreshold: number;
  defaultShippingRate: number;
  expressShippingRate: number;
  shippingZones: Array<{
    name: string;
    cities: string[];
    rate: number;
  }>;
};

export type PaymentSettings = {
  enableCOD: boolean;
  enablePaymob: boolean;
  paymobApiKey: string;
  paymobIntegrationId: string;
  enableFawry: boolean;
  fawryMerchantCode: string;
  fawrySecurityKey: string;
  testMode: boolean;
  minOrderAmount: number;
  maxOrderAmount: number;
};

export type TaxSettings = {
  enableTaxes: boolean;
  defaultTaxRate: number;
  pricesIncludeTax: boolean;
  displayTaxInCart: boolean;
  taxRegions: Array<{
    name: string;
    rate: number;
  }>;
};

export type NotificationSettings = {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpEncryption: string;
  fromEmail: string;
  fromName: string;
  orderConfirmation: boolean;
  shippingUpdates: boolean;
  abandonedCartReminders: boolean;
  adminNewOrderAlert: boolean;
  adminLowStockAlert: boolean;
};

export type LocalizationSettings = {
  defaultLanguage: string;
  enableRTL: boolean;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  weightUnit: string;
  dimensionUnit: string;
};

export type MaintenanceSettings = {
  enabled: boolean;
  message: string;
  allowedIPs: string[];
  scheduledStart: string | null;
  scheduledEnd: string | null;
  redirectUrl: string;
};

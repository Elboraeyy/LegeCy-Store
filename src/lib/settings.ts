"use server";

import { cache } from "react";
import prisma from "@/lib/prisma";

// Type definitions for all settings
export type SiteSettings = {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  seo: SEOSettings;
  homepage: HomepageSettings;
  footer: FooterSettings;
  header: HeaderSettings;
};

export type GeneralSettings = {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  businessId: string;
  logoUrl: string;
  faviconUrl: string;
};

export type AppearanceSettings = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headingFont: string;
  borderRadius: number;
  darkMode: boolean;
  customCSS: string;
};

export type SEOSettings = {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  facebookPixelId: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    tiktok: string;
    youtube: string;
    whatsapp: string;
  };
};

export type HomepageSettings = {
  heroEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  heroBackgroundImage: string;
  featuredCategoriesEnabled: boolean;
  featuredProductsEnabled: boolean;
  featuredProductsTitle: string;
  featuredProductsCount: number;
  newArrivalsEnabled: boolean;
  bestSellersEnabled: boolean;
  testimonialsEnabled: boolean;
  brandsEnabled: boolean;
};

export type FooterSettings = {
  companyName: string;
  companyDescription: string;
  copyrightText: string;
  showPaymentIcons: boolean;
  showSocialIcons: boolean;
  showNewsletter: boolean;
  newsletterTitle: string;
  columns: Array<{
    title: string;
    links: Array<{ label: string; url: string }>;
  }>;
  addresses: Array<{
    title: string;
    address: string;
    phone?: string;
  }>;
};

export type HeaderSettings = {
  logoPosition: string;
  showSearch: boolean;
  showCart: boolean;
  showAccount: boolean;
  showWishlist: boolean;
  stickyHeader: boolean;
  announcementEnabled: boolean;
  announcementText: string;
  announcementBgColor: string;
};

// Default values (private, for use in this file only)
const defaultGeneral: GeneralSettings = {
  storeName: "Legacy Store",
  storeEmail: "contact@legacy.com",
  storePhone: "+20 123 456 7890",
  storeAddress: "Cairo, Egypt",
  timezone: "Africa/Cairo",
  currency: "EGP",
  currencySymbol: "EGP",
  businessId: "",
  logoUrl: "",
  faviconUrl: "/favicon.ico",
};

const defaultAppearance: AppearanceSettings = {
  primaryColor: "#1a3c34",
  secondaryColor: "#e8e6e1",
  accentColor: "#d4af37",
  backgroundColor: "#e8e6e1",
  textColor: "#1a3c34",
  fontFamily: "Inter",
  headingFont: "Playfair Display",
  borderRadius: 4,
  darkMode: false,
  customCSS: "",
};

const defaultSEO: SEOSettings = {
  metaTitle: "Legacy Store | Luxury Watches in Egypt",
  metaDescription: "Discover our exclusive collection of premium watches.",
  metaKeywords: "watches, luxury watches, legacy store",
  googleAnalyticsId: "",
  googleTagManagerId: "",
  facebookPixelId: "",
  socialLinks: {
    facebook: "",
    instagram: "",
    twitter: "",
    tiktok: "",
    youtube: "",
    whatsapp: "",
  },
};

const defaultHomepage: HomepageSettings = {
  heroEnabled: true,
  heroTitle: "Built on Time. Made for Legacy.",
  heroSubtitle: "Since our inception, we've remained devoted to one pursuit — crafting timepieces that honour tradition while embracing innovation.",
  heroButtonText: "Unveil Our Legacy",
  heroButtonLink: "/shop",
  heroBackgroundImage: "",
  featuredCategoriesEnabled: true,
  featuredProductsEnabled: true,
  featuredProductsTitle: "Featured Products",
  featuredProductsCount: 8,
  newArrivalsEnabled: true,
  bestSellersEnabled: true,
  testimonialsEnabled: true,
  brandsEnabled: true,
};

const defaultFooter: FooterSettings = {
  companyName: "Legacy Store",
  companyDescription: "",
  copyrightText: "",
  showPaymentIcons: false,
  showSocialIcons: true,
  showNewsletter: false,
  newsletterTitle: "",
  columns: [
    {
      title: "Links",
      links: [
        { label: "Shop", url: "/shop" },
        { label: "About", url: "/about" },
        { label: "Contact", url: "/contact" },
        { label: "FAQ", url: "/faq" },
      ],
    },
  ],
  addresses: [],
};

const defaultHeader: HeaderSettings = {
  logoPosition: "left",
  showSearch: true,
  showCart: true,
  showAccount: true,
  showWishlist: true,
  stickyHeader: true,
  announcementEnabled: false,
  announcementText: "Free shipping on orders over 1000 EGP",
  announcementBgColor: "#1a3c34",
};

// Cached function to get all settings at once
export const getAllSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const configs = await prisma.storeConfig.findMany();
    
    const configMap: Record<string, unknown> = {};
    configs.forEach((c) => {
      configMap[c.key] = c.value;
    });

    return {
      general: { ...defaultGeneral, ...(configMap["general_settings"] as Partial<GeneralSettings> || {}) },
      appearance: { ...defaultAppearance, ...(configMap["appearance_settings_v2"] as Partial<AppearanceSettings> || {}) },
      seo: { ...defaultSEO, ...(configMap["seo_settings"] as Partial<SEOSettings> || {}) },
      homepage: { ...defaultHomepage, ...(configMap["homepage_settings"] as Partial<HomepageSettings> || {}) },
      footer: { ...defaultFooter, ...(configMap["footer_settings"] as Partial<FooterSettings> || {}) },
      header: { ...defaultHeader, ...(configMap["header_settings"] as Partial<HeaderSettings> || {}) },
    };
  } catch (error) {
    console.error("Failed to load settings:", error);
    // Return defaults if DB fails
    return {
      general: defaultGeneral,
      appearance: defaultAppearance,
      seo: defaultSEO,
      homepage: defaultHomepage,
      footer: defaultFooter,
      header: defaultHeader,
    };
  }
});

// Helper to get specific settings sections
export const getGeneralSettings = cache(async () => (await getAllSettings()).general);
export const getAppearanceSettings = cache(async () => (await getAllSettings()).appearance);
export const getSEOSettings = cache(async () => (await getAllSettings()).seo);
export const getHomepageSettings = cache(async () => (await getAllSettings()).homepage);
export const getFooterSettings = cache(async () => (await getAllSettings()).footer);
export const getHeaderSettings = cache(async () => (await getAllSettings()).header);

// CSS Variables generator
export async function getCSSVariables(): Promise<string> {
  const appearance = await getAppearanceSettings();
  
  return `
    :root {
      --primary-color: ${appearance.primaryColor};
      --secondary-color: ${appearance.secondaryColor};
      --accent-color: ${appearance.accentColor};
      --bg-color: ${appearance.backgroundColor};
      --text-color: ${appearance.textColor};
      --font-body: '${appearance.fontFamily}', sans-serif;
      --font-heading: '${appearance.headingFont}', serif;
      --border-radius: ${appearance.borderRadius}px;
    }
  `;
}

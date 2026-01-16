// Default values for settings - can be imported in client components
import type {
  GeneralSettings,
  AppearanceSettings,
  SEOSettings,
  HomepageSettings,
  FooterSettings,
  HeaderSettings,
} from "./settings";

export const defaultGeneral: GeneralSettings = {
  storeName: "Legacy Store",
  storeEmail: "info@legecy.store",
  storePhone: "+20 127 843 2630",
  storeAddress: "Samanoud, Gharbia, Egypt",
  timezone: "Africa/Cairo",
  currency: "EGP",
  currencySymbol: "EGP",
  businessId: "",
  logoUrl: "",
  faviconUrl: "/favicon.ico",
};

export const defaultAppearance: AppearanceSettings = {
  primaryColor: "#12403C",
  secondaryColor: "#F5F0E3",
  accentColor: "#d4af37",
  backgroundColor: "#F5F0E3",
  textColor: "#12403C",
  fontFamily: "Inter",
  headingFont: "Playfair Display",
  borderRadius: 4,
  darkMode: false,
  customCSS: "",
};

export const defaultSEO: SEOSettings = {
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

export const defaultHomepage: HomepageSettings = {
  heroEnabled: true,
  heroTitle: "Built on Time. Made for Legacy.",
  heroSubtitle: "Since our inception, we've remained devoted to one pursuit — crafting timepieces that honour tradition while embracing innovation.",
  heroButtonText: "Discover Our Legacy",
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

export const defaultFooter: FooterSettings = {
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

export const defaultHeader: HeaderSettings = {
  logoPosition: "left",
  showSearch: true,
  showCart: true,
  showAccount: true,
  showWishlist: true,
  stickyHeader: true,
  announcementEnabled: false,
  announcementText: "Free shipping on orders over 1500 EGP to Gharbia & Dakahlia",
  announcementBgColor: "#12403C",
  announcementTextColor: "#ffffff",
};

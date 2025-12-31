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

export const defaultAppearance: AppearanceSettings = {
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
  announcementText: "Free shipping on orders over 1000 EGP",
  announcementBgColor: "#1a3c34",
};

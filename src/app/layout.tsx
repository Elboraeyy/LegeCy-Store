import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
import Footer from "@/components/Footer";
import ClientLayout from "@/components/ClientLayout";
import { getGeneralSettings, getSEOSettings, getCSSVariables, getAppearanceSettings } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const [general, seo] = await Promise.all([
    getGeneralSettings(),
    getSEOSettings(),
  ]);

  return {
    title: seo.metaTitle || general.storeName,
    description: seo.metaDescription,
    keywords: seo.metaKeywords,
    icons: {
      icon: general.faviconUrl || "/favicon.ico",
    },
    openGraph: {
      title: seo.metaTitle || general.storeName,
      description: seo.metaDescription,
      siteName: general.storeName,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.metaTitle || general.storeName,
      description: seo.metaDescription,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cssVars, appearance] = await Promise.all([
    getCSSVariables(),
    getAppearanceSettings()
  ]);

  return (
    <html lang="en" className={appearance.darkMode ? 'dark' : ''}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${playfair.variable}`}>
        <ClientLayout navbar={<NavbarWrapper />} footer={<Footer />}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}

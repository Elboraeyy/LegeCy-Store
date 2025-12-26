import type { Metadata } from "next";
import { HomeContent, HeroConfig } from "@/components/home/HomeContent";
import { getStoreConfig } from "@/lib/actions/config";

export const metadata: Metadata = {
  title: "Legacy Store | Luxury Watches in Egypt",
  description: "Discover our exclusive collection of premium men's watches. Classic and modern designs available in Egypt.",
  keywords: "watches, luxury watches, men's watches, legacy store, egypt watches",
};

export default async function Home() {
  const config = await getStoreConfig('homepage_hero');
  // Cast Prisma JSON to our interface. Safe because we validate structure elsewhere or treat as partial.
  const heroConfig = config ? (config as unknown as HeroConfig) : undefined;
  
  return <HomeContent heroConfig={heroConfig} />;
}

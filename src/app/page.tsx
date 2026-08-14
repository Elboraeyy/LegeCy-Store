import type { Metadata } from "next";
import { HomeContent } from "@/components/home/HomeContent";

export const metadata: Metadata = {
  title: "Legacy Store | Luxury Accessories in Egypt",
  description: "Discover our exclusive collection of premium accessories - watches, wallets, sunglasses, perfumes, handbags and more.",
  keywords: "accessories, watches, wallets, sunglasses, perfumes, handbags, belts, bracelets, legacy store, egypt",
};

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export default function Home() {
  return <HomeContent />;
}

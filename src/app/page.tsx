import type { Metadata } from "next";
import { HomeContent } from "@/components/home/HomeContent";

export const metadata: Metadata = {
  title: "Legacy Store | Luxury Watches in Egypt",
  description: "Discover our exclusive collection of premium men's watches. Classic and modern designs available in Egypt.",
  keywords: "watches, luxury watches, men's watches, legacy store, egypt watches",
};

export default function Home() {
  return <HomeContent />;
}

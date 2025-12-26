import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export const metadata: Metadata = {
  title: "Shop Luxury Watches | Legacy Store",
  description: "Browse our full collection of luxury, classic, and sport watches.",
};

export default function Shop() {
  return <ShopClient />;
}

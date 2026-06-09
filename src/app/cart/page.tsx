import type { Metadata } from "next";
import CartClient from "./CartClient";
import { fetchRandomProducts } from "@/lib/actions/shop";

export const metadata: Metadata = {
  title: "Shopping Cart | Legacy Store",
  description: "Review and purchase your selected timepieces in your cart.",
};

export default async function Cart() {
  const initialRecommendations = await fetchRandomProducts(8);
  return (
    <CartClient initialRecommendations={initialRecommendations} />
  );
}

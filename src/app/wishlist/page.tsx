import type { Metadata } from "next";
import WishlistClient from "./WishlistClient";

export const metadata: Metadata = {
  title: "Your Wishlist | Legacy Store",
  description: "View and manage your saved timepieces.",
};

export default function Wishlist() {
  return <WishlistClient />;
}

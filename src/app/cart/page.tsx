import type { Metadata } from "next";
import CartClient from "./CartClient";
import { getStoreSettings } from "@/lib/actions/settings";

export const metadata: Metadata = {
  title: "Shopping Cart | Legacy Store",
  description: "Review and purchase your selected timepieces in your cart.",
};

export default async function Cart() {
  const settings = await getStoreSettings(['FREE_SHIPPING_THRESHOLD', 'FREE_SHIPPING_ENABLED']);

  return (
    <CartClient
      freeShippingThreshold={Number(settings['FREE_SHIPPING_THRESHOLD']) || 2000}
      isFreeShippingEnabled={settings['FREE_SHIPPING_ENABLED'] !== 'false'}
    />
  );
}

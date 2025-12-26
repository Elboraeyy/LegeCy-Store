import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout | Legacy Store",
  description: "Complete your order and enter shipping details.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}

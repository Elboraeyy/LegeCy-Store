import type { Metadata } from "next";
import FAQClient from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ | Legacy Store",
  description: "Frequently Asked Questions about Legacy Store - Shipping, Returns, Payments, and more.",
};

export default function FAQPage() {
  return <FAQClient />;
}

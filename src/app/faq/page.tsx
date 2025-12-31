import type { Metadata } from "next";
import FAQClient from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ | LegeCy Store",
  description: "Frequently Asked Questions about LegeCy Store - Shipping, Returns, Payments, and more.",
};

export default function FAQPage() {
  return <FAQClient />;
}

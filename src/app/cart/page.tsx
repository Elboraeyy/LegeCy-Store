import type { Metadata } from "next";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Shopping Cart | Legacy Store",
  description: "Review and purchase your selected timepieces in your cart.",
};

export default function Cart() {
  return <CartClient />;
}

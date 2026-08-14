import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "Our Heritage | Legacy Store",
  description: "Discover Legacy Store - Egypt's destination for premium accessories, watches, wallets, and more.",
};

export const revalidate = 300;

export default function About() {
  return <AboutClient />;
}

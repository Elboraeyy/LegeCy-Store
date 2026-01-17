import React from "react";
import CompareClient from "./CompareClient";
import { fetchFeaturedProducts } from "@/lib/actions/shop";

export const metadata = {
  title: "Compare Watches | Legacy Store",
  description: "Compare luxury watches side by side.",
};

export default async function ComparePage() {
  const suggestions = await fetchFeaturedProducts(4);

  return <CompareClient suggestions={suggestions} />;
}

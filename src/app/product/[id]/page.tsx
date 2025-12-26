import type { Metadata } from "next";
import ProductDetailsClient from "./ProductDetailsClient";
import prisma from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true, description: true }
  });

  if (!product) {
    return {
      title: "Product Not Found | Legacy Store",
    };
  }

  return {
    title: `${product.name} | Legacy Store`,
    description: product.description || `Buy ${product.name}. Premium luxury timepiece.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  return <ProductDetailsClient id={id} />;
}

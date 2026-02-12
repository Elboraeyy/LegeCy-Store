
import React from 'react';
import { notFound } from 'next/navigation';
import { getSharedWishlist } from '@/lib/actions/wishlist';
import WishlistClient from '../../WishlistClient';
import { Metadata } from 'next';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Shared Wishlist | Legacy Store',
    description: 'Check out this wishlist shared from Legacy Store.',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function SharedWishlistPage({ params }: Props) {
  const products = await getSharedWishlist(params.id);

  if (!products) {
    notFound();
  }

  return (
    <WishlistClient initialProducts={products.map(p => ({
      ...p,
      img: p.img || undefined,
      imageUrl: p.imageUrl || undefined
    }))} />
  );
}

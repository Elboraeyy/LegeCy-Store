'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';

export async function getAddresses() {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return addresses;
  } catch (error) {
    console.error('Failed to fetch addresses:', error);
    return [];
  }
}

export async function addAddress(data: {
  type: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  isDefault?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    // If setting as default, unset others first
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    await prisma.address.create({
      data: {
        userId: user.id,
        type: data.type,
        name: data.name,
        phone: data.phone,
        street: data.street,
        city: data.city,
        isDefault: data.isDefault || false,
      },
    });

    revalidatePath('/account/addresses');
    return { success: true };
  } catch (error) {
    console.error('Failed to add address:', error);
    return { success: false, error: 'Failed to add address' };
  }
}

export async function deleteAddress(addressId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.address.delete({
      where: { 
        id: addressId,
        userId: user.id // Security check
      },
    });

    revalidatePath('/account/addresses');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete address:', error);
    return { success: false, error: 'Failed to delete address' };
  }
}

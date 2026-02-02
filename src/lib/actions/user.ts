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

export async function getCheckoutProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    // Get user details
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, phone: true }
    });

    // Get default address
    const defaultAddress = await prisma.address.findFirst({
      where: { userId: user.id, isDefault: true },
    });

    // Get most recent address if no default
    const recentAddress = !defaultAddress ? await prisma.address.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    }) : null;

    return {
      contact: {
        name: userDetails?.name || '',
        email: userDetails?.email || '',
        phone: userDetails?.phone || '',
      },
      address: defaultAddress || recentAddress || null
    };
  } catch (error) {
    console.error('Failed to get checkout profile:', error);
    return null;
  }
}

export async function saveCheckoutProfile(data: {
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  shippingGovernorate: string;
  shippingCity: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  try {
    // 1. Update User Contact Info (Name/Phone)
    // We don't update email here as it is sensitive
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.customerName,
        phone: data.customerPhone
      }
    });

    // 2. Save Address logic
    // Check if this address already exists to avoid duplicates
    const existingAddress = await prisma.address.findFirst({
      where: {
        userId: user.id,
        street: data.shippingAddress,
        city: data.shippingCity,
        // Governorates might need mapping if stored differently, but usually they match
      }
    });

    if (!existingAddress) {
      // Create new address and set as default
      // First unset other defaults
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      });

      await prisma.address.create({
        data: {
          userId: user.id,
          type: 'Home', // Default type
          name: data.customerName,
          phone: data.customerPhone,
          street: data.shippingAddress,
          city: `${data.shippingCity}, ${data.shippingGovernorate}`, // Storing composite or just city depending on schema. 
          // Note: Schema seems to have 'city' and 'street'. 
          // AddressClient shows city input. Checkout has gov + city.
          // We'll combine or just use city. Let's use city.
          isDefault: true,
        }
      });
    } else {
      // If exists, just make sure it's default
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      });

      await prisma.address.update({
        where: { id: existingAddress.id },
        data: { isDefault: true }
      });
    }

    revalidatePath('/account/addresses');
    return { success: true };

  } catch (error) {
    console.error('Failed to save checkout profile:', error);
    return { success: false, error: 'Failed to save profile' };
  }
}

export async function updateContactInfo(data: { name: string; phone: string }) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        phone: data.phone
      }
    });
    revalidatePath('/account/addresses');
    return { success: true };
  } catch (error) {
    console.error('Failed to update contact info:', error);
    return { success: false, error: 'Failed to update contact info' };
  }
}

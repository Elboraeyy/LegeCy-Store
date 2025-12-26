"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function getStoreConfig(key: string) {
  const config = await prisma.storeConfig.findUnique({
    where: { key }
  });
  return config?.value || null;
}

export async function updateStoreConfig(key: string, value: Prisma.InputJsonValue) {
  await prisma.storeConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
  revalidatePath('/');
  revalidatePath('/admin/config');
  return { success: true };
}

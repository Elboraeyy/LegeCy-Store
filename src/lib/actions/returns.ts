"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function createReturnRequest(orderId: string, reason: string, items: { id: string; quantity: number }[]) {
  try {
    // Check if order exists and is eligible
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new Error("Order not found");
    if (order.status !== 'delivered') throw new Error("Only delivered orders can be returned");

    // Check if return already exists
    const existing = await prisma.returnRequest.findUnique({
        where: { orderId }
    });
    if (existing) throw new Error("A return request already exists for this order");

    // Create Request
    await prisma.returnRequest.create({
      data: {
        orderId,
        reason,
        items: items as unknown as Prisma.InputJsonValue, // Cast needed for JSON types in server actions
        status: 'pending'
      }
    });

    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Return Request Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

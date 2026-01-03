import { Metadata } from "next";
import { redirect } from "next/navigation";
import { validateCustomerSession } from "@/lib/auth/session";
import MyOrdersClient from "./MyOrdersClient";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "My Orders | Legacy Store",
  description: "View and track all your orders",
};

async function getUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      returnRequest: true
    }
  });

  return orders.map(order => ({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    totalPrice: Number(order.totalPrice),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    items: order.items.map(item => ({
      id: item.id, // OrderItem ID
      name: item.name,
      quantity: item.quantity,
      productId: item.productId,
      price: Number(item.price)
    })),
    returnStatus: order.returnRequest?.status
  }));
}

export default async function MyOrdersPage() {
  const { user } = await validateCustomerSession();

  if (!user) {
    redirect('/login?redirect=/account/orders');
  }

  const orders = await getUserOrders(user.id);

  return <MyOrdersClient orders={orders} />;
}

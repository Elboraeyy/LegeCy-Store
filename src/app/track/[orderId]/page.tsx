import { Metadata } from "next";
import { notFound } from "next/navigation";
import TrackOrderClient from "./TrackOrderClient";
import prisma from "@/lib/prisma";

interface Props {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Track Order #${orderId.slice(0, 8).toUpperCase()} | LegeCy Store`,
    description: "Track your order status and shipping updates.",
  };
}

async function getOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      history: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  
  if (!order) return null;

  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    totalPrice: Number(order.totalPrice),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    paymentMethod: order.paymentMethod,
    items: order.items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price)
    })),
    history: order.history.map(h => ({
      id: h.id,
      from: h.from,
      to: h.to,
      reason: h.reason,
      createdAt: h.createdAt.toISOString()
    }))
  };
}

export default async function TrackOrderPage({ params }: Props) {
  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order) {
    notFound();
  }

  return <TrackOrderClient order={order} />;
}

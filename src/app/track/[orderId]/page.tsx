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
    title: `Track Order #${orderId.slice(0, 8).toUpperCase()} | Legacy Store`,
    description: "Track your order status, view order details, and get shipping updates.",
  };
}

async function getOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      history: {
        orderBy: { createdAt: 'desc' }
      },
      coupon: {
        select: {
          code: true,
          discountType: true,
          discountValue: true
        }
      }
    }
  });
  
  if (!order) return null;

  // Fetch product images separately for items
  const productIds = order.items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      imageUrl: true
    }
  });
  const productMap = new Map(products.map(p => [p.id, p]));

  // Calculate subtotal (before discount)
  const subtotal = order.items.reduce((sum: number, item) =>
    sum + (Number(item.price) * item.quantity), 0
  );

  // Calculate discount amount
  let discountAmount = 0;
  if (order.coupon) {
    if (order.coupon.discountType === 'percentage') {
      discountAmount = (subtotal * Number(order.coupon.discountValue)) / 100;
    } else {
      discountAmount = Number(order.coupon.discountValue);
    }
  }

  // Estimate delivery (simple logic based on order date + 3-5 days)
  const orderDate = new Date(order.createdAt);
  const estimatedDelivery = new Date(orderDate);
  estimatedDelivery.setDate(orderDate.getDate() + 4); // Average 4 days

  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    deliveredAt: order.deliveredAt?.toISOString() || null,
    totalPrice: Number(order.totalPrice),
    subtotal,
    discountAmount,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddress,
    shippingGovernorate: order.shippingGovernorate,
    shippingCity: order.shippingCity,
    shippingNotes: order.shippingNotes,
    paymentMethod: order.paymentMethod,
    orderSource: order.orderSource,
    pointsEarned: order.pointsEarned,
    pointsRedeemed: order.pointsRedeemed,
    couponCode: order.coupon?.code || null,
    estimatedDelivery: estimatedDelivery.toISOString(),
    items: order.items.map(item => {
      const product = productMap.get(item.productId);
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        image: product?.imageUrl || null,
        productSlug: null
      };
    }),
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

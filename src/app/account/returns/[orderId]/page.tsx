import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ReturnRequestClient from "./ReturnRequestClient";
import prisma from "@/lib/prisma";
import { validateCustomerSession } from "@/lib/auth/session";

interface Props {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Return Request - Order #${orderId.slice(0, 8).toUpperCase()} | Legacy Store`,
    description: "Submit a return request for your order.",
  };
}

async function getOrderForReturn(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { 
      id: orderId,
      userId: userId
    },
    include: {
      items: true,
      returnRequest: true
    }
  });
  
  if (!order) return null;

  // Fetch product images
  const productIds = order.items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, imageUrl: true }
  });
  const productMap = new Map(products.map(p => [p.id, p]));

  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    deliveredAt: order.deliveredAt?.toISOString() || null,
    totalPrice: Number(order.totalPrice),
    customerName: order.customerName,
    hasExistingReturn: !!order.returnRequest,
    existingReturnStatus: order.returnRequest?.status || null,
    items: order.items.map(item => {
      const product = productMap.get(item.productId);
      return {
        id: item.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        image: product?.imageUrl || null
      };
    })
  };
}

export default async function ReturnRequestPage({ params }: Props) {
  const { orderId } = await params;
  
  // Validate user session
  const { user } = await validateCustomerSession();
  if (!user) {
    redirect(`/auth/login?redirect=/account/returns/${orderId}`);
  }

  const order = await getOrderForReturn(orderId, user.id);

  if (!order) {
    notFound();
  }

  // Check if order can be returned
  if (order.status !== 'delivered') {
    return (
      <main style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1>Cannot Process Return</h1>
        <p>Only delivered orders can be returned.</p>
        <p>Current order status: <strong>{order.status}</strong></p>
      </main>
    );
  }

  // Check if return already exists
  if (order.hasExistingReturn) {
    return (
      <main style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1>Return Already Requested</h1>
        <p>A return request already exists for this order.</p>
        <p>Status: <strong>{order.existingReturnStatus}</strong></p>
      </main>
    );
  }

  // Check return window (14 days)
  if (order.deliveredAt) {
    const deliveredDate = new Date(order.deliveredAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelivery > 14) {
      return (
        <main style={{ padding: '100px 20px', textAlign: 'center' }}>
          <h1>Return Window Expired</h1>
          <p>Returns must be requested within 14 days of delivery.</p>
          <p>This order was delivered {daysSinceDelivery} days ago.</p>
        </main>
      );
    }
  }

  return <ReturnRequestClient order={order} />;
}

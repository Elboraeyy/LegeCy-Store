import { Metadata } from "next";
import { redirect } from "next/navigation";
import { validateCustomerSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import AccountClient from "./AccountClient";

export const metadata: Metadata = {
  title: "My Account | Legacy Store",
  description: "Manage your account, view orders, and update your profile",
};

export default async function AccountPage() {
  const { user } = await validateCustomerSession();

  if (!user) {
    redirect('/login?redirect=/account');
  }

  // Fetch full user data with counts and recent orders
  const [fullUser, recentOrders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        points: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            addresses: true
          }
        }
      }
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        status: true,
        createdAt: true,
        totalPrice: true,
        items: {
          select: { id: true }
        }
      }
    })
  ]);

  if (!fullUser) {
    redirect('/login?redirect=/account');
  }

  // Transform data for client component
  const userData = {
    id: fullUser.id,
    name: fullUser.name,
    email: fullUser.email,
    phone: fullUser.phone,
    image: fullUser.image,
    points: fullUser.points,
    createdAt: fullUser.createdAt.toISOString(),
    orderCount: fullUser._count.orders,
    addressCount: fullUser._count.addresses
  };

  const ordersData = recentOrders.map(order => ({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    totalPrice: Number(order.totalPrice),
    itemCount: order.items.length
  }));

  return <AccountClient user={userData} recentOrders={ordersData} />;
}

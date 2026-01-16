import { NextRequest, NextResponse } from 'next/server';
import { validateCustomerSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

interface ReturnItem {
  id: string;
  quantity: number;
  images: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Validate customer session
    const { user } = await validateCustomerSession();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, reason, description, returnType, items, images } = body as {
      orderId: string;
      reason: string;
      description?: string;
      returnType: string;
      items: ReturnItem[];
      images: string[];
    };

    // Validate required fields
    if (!orderId || !reason || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify order belongs to user and is delivered
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id
      },
      include: {
        returnRequest: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Only delivered orders can be returned' },
        { status: 400 }
      );
    }

    if (order.returnRequest) {
      return NextResponse.json(
        { error: 'A return request already exists for this order' },
        { status: 400 }
      );
    }

    // Check return window (14 days)
    if (order.deliveredAt) {
      const daysSinceDelivery = Math.floor(
        (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceDelivery > 14) {
        return NextResponse.json(
          { error: 'Return window has expired (14 days)' },
          { status: 400 }
        );
      }
    }

    // Create return request
    await prisma.returnRequest.create({
      data: {
        orderId,
        reason,
        description: description || null,
        returnType: returnType || 'refund',
        items: items as unknown as Prisma.InputJsonValue,
        images: images || [],
        status: 'pending'
      }
    });

    // Revalidate paths
    revalidatePath('/account/orders');
    revalidatePath(`/track/${orderId}`);
    revalidatePath('/admin/orders/returns');

    return NextResponse.json({
      success: true,
      message: 'Return request submitted successfully'
    });

  } catch (error) {
    console.error('Create return request error:', error);
    return NextResponse.json(
      { error: 'Failed to create return request' },
      { status: 500 }
    );
  }
}

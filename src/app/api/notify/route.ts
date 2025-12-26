import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const notifySchema = z.object({
  email: z.string().email(),
  productId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = notifySchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if already subscribed
    const existing = await prisma.stockNotification.findFirst({
        where: {
            email: data.email,
            productId: data.productId,
            status: 'pending'
        }
    });

    if (existing) {
        return NextResponse.json({ message: 'Already subscribed' });
    }

    await prisma.stockNotification.create({
      data: {
        email: data.email,
        productId: data.productId,
        status: 'pending'
      }
    });

    return NextResponse.json({ success: true, message: 'Notification scheduled' });

  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    console.error('Notify API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

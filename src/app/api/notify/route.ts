import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const notifySchema = z.object({
  email: z.string().email().optional(),
  whatsapp: z.string().min(10).optional(),
  productId: z.string().min(1),
  channel: z.enum(['email', 'whatsapp']),
}).refine(data => {
  if (data.channel === 'email') return !!data.email;
  if (data.channel === 'whatsapp') return !!data.whatsapp;
  return false;
}, { message: 'Contact info is required for selected channel' });

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
    if (data.channel === 'email' && data.email) {
      const existing = await prisma.stockNotification.findFirst({
        where: {
          email: data.email,
          productId: data.productId,
          status: 'pending'
        }
      });

      if (existing) {
        return NextResponse.json({ message: 'already_subscribed' });
      }

      await prisma.stockNotification.create({
        data: {
          email: data.email,
          channel: 'email',
          productId: data.productId,
          status: 'pending'
        }
      });
    } else if (data.channel === 'whatsapp' && data.whatsapp) {
      const existing = await prisma.stockNotification.findFirst({
        where: {
          whatsapp: data.whatsapp,
          productId: data.productId,
          status: 'pending'
        }
      });

      if (existing) {
        return NextResponse.json({ message: 'already_subscribed' });
      }

      await prisma.stockNotification.create({
        data: {
          whatsapp: data.whatsapp,
          channel: 'whatsapp',
          productId: data.productId,
          status: 'pending'
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Notification scheduled' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Notify API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

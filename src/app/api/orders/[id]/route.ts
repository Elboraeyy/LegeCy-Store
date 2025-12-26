import { NextResponse } from 'next/server';
import { getOrderFromDb } from '@/lib/db/orders';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  props: RouteParams
) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await getOrderFromDb(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('Error retrieving order:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
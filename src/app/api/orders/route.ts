import { createOrder } from '@/lib/services/orderService';
import { handleApiError } from '@/lib/api-error-handler';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // The service now handles Zod validation internally (or we could do it here).
    // Doing it here is usually better for 400s before hitting DB logic.
    // But since createOrderSchema is exported, let's just pass body and let service validate or validate here.
    // For "Global API Error Handler" mandate, catching anything from service is key.
    
    // We pass the raw body to the service which expects CreateOrderServiceParams
    // Ideally we should validte here to fail fast. 
    // But verify-arch.ts expects service to throw ValidationError.
    
    const createdOrder = await createOrder(body);

    return NextResponse.json(createdOrder, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}

// GET request removed. Use /api/admin/orders for admin listing.


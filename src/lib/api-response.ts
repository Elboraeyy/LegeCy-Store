import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { DomainError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export type APIErrorResponse = {
  success: false;
  error: string;
  details?: unknown;
};

export type APISuccessResponse<T> = {
  success: true;
  data: T;
};

export function handleApiError(error: unknown) {
  logger.error('[API Error]', { error });

  // 1. Handle DomainError (formerly AppError)
  if (error instanceof DomainError) {
    return NextResponse.json<APIErrorResponse>(
      { success: false, error: error.message, details: error.details },
      { status: error.httpStatus }
    );
  }

  // 2. Handle Zod Validation Errors
  if (error instanceof ZodError) {
    return NextResponse.json<APIErrorResponse>(
      { success: false, error: 'Validation Error', details: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // 3. Handle Prisma Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed
    if (error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || 'Field';
        return NextResponse.json<APIErrorResponse>(
            { success: false, error: `Duplicate value for ${target}` },
            { status: 409 }
        );
    }
    // P2025: Record not found
    if (error.code === 'P2025') {
        return NextResponse.json<APIErrorResponse>(
            { success: false, error: 'Resource not found' },
            { status: 404 }
        );
    }
  }

  // 4. Default Internal Server Error
  const message = error instanceof Error ? error.message : 'Internal Server Error';
  return NextResponse.json<APIErrorResponse>(
    { success: false, error: message },
    { status: 500 }
  );
}

export function apiResponse<T>(data: T, status: number = 200) {
  return NextResponse.json<APISuccessResponse<T>>(
    { success: true, data },
    { status }
  );
}

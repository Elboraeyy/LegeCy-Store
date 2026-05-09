import { NextRequest, NextResponse } from "next/server";
import prismaClient from "@/lib/prisma";
const prisma = prismaClient!;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Check if it exists
    const existing = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Check if new code conflicts
    if (body.code && body.code.toUpperCase() !== existing.code) {
      const conflict = await prisma.coupon.findUnique({
        where: { code: body.code.toUpperCase() }
      });
      if (conflict) {
        return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
      }
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (body.code !== undefined) dataToUpdate.code = body.code.toUpperCase();
    if (body.discountType !== undefined) dataToUpdate.discountType = body.discountType;
    if (body.discountValue !== undefined) dataToUpdate.discountValue = Number(body.discountValue);
    if (body.minOrderValue !== undefined) dataToUpdate.minOrderValue = body.minOrderValue === null ? null : Number(body.minOrderValue);
    if (body.maxDiscount !== undefined) dataToUpdate.maxDiscount = body.maxDiscount === null ? null : Number(body.maxDiscount);
    if (body.startDate !== undefined) dataToUpdate.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) dataToUpdate.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.usageLimit !== undefined) dataToUpdate.usageLimit = body.usageLimit === null ? null : Number(body.usageLimit);
    if (body.isActive !== undefined) dataToUpdate.isActive = body.isActive;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ coupon, message: "Coupon updated successfully" });
  } catch (error) {
    console.error("Coupon update error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check usage
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: { select: { orders: true, usages: true } }
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (coupon._count.orders > 0 || coupon._count.usages > 0) {
      // Cannot delete a coupon that has been used. Soft delete/deactivate instead
      await prisma.coupon.update({
        where: { id },
        data: { isActive: false }
      });
      return NextResponse.json({ message: "Coupon is in use, deactivated instead." });
    }

    await prisma.coupon.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Coupon delete error:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}

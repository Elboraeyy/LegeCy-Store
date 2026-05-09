import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all coupons
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where: any = {};
    
    if (search) {
      where.code = { contains: search, mode: 'insensitive' };
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Coupons GET error:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

// POST create a new coupon
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      code, 
      discountType, 
      discountValue, 
      minOrderValue, 
      maxDiscount, 
      startDate, 
      endDate, 
      usageLimit, 
      isActive 
    } = body;

    // Validate
    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if code exists
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType, // 'percentage' or 'fixed'
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        isActive: isActive !== undefined ? isActive : true,
      }
    });

    return NextResponse.json({ coupon, message: "Coupon created successfully" });
  } catch (error) {
    console.error("Coupon create error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

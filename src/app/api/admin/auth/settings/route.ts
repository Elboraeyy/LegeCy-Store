import { NextRequest, NextResponse } from "next/server";
import prismaClient from "@/lib/prisma";
const prisma = prismaClient!;

export async function GET() {
  try {
    const configs = await prisma.storeConfig.findMany();
    return NextResponse.json({ configs });
  } catch (error) {
    console.error("Store config GET error:", error);
    return NextResponse.json({ error: "Failed to fetch configs" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    const config = await prisma.storeConfig.upsert({
      where: { key },
      update: {
        value,
        description: description !== undefined ? description : undefined,
      },
      create: {
        key,
        value,
        description,
      }
    });

    return NextResponse.json({ config, message: "Configuration saved successfully" });
  } catch (error) {
    console.error("Store config PUT error:", error);
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
  }
}

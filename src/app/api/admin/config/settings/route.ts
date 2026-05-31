import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prismaClient from "@/lib/prisma";
import { validateMobileToken, unauthorizedResponse } from "@/lib/auth/mobile-auth";

const prisma = prismaClient!;

export async function GET(req: NextRequest) {
  const admin = await validateMobileToken(req);
  if (!admin) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const keysParam = searchParams.get("keys");
    let whereClause = {};

    if (keysParam) {
      const keys = keysParam.split(",");
      whereClause = { key: { in: keys } };
    }

    const configs = await prisma.storeConfig.findMany({
      where: whereClause,
    });

    // The flutter app expects: { "header_settings": "{\"announcementEnabled\":true,...}" }
    // Note: Prisma stores Json. We need to convert it to a JSON string because the flutter app uses jsonDecode(data['header_settings']).
    const result: Record<string, string> = {};
    configs.forEach((c) => {
      // Prisma Json is returned as an object. We must stringify it.
      result[c.key] = typeof c.value === 'string' ? c.value : JSON.stringify(c.value);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Store config GET error:", error);
    return NextResponse.json({ error: "Failed to fetch configs" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await validateMobileToken(req);
  if (!admin) return unauthorizedResponse();

  try {
    const body = await req.json();
    const settings = body.settings;

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: "Settings array is required" }, { status: 400 });
    }

    for (const item of settings) {
      const { key, value } = item;
      if (!key || value === undefined) continue;

      // The flutter app sends value as a JSON string (e.g. jsonEncode(config))
      // Prisma expects a JSON object for Json fields, so we need to parse it if it's a string
      let parsedValue = value;
      if (typeof value === "string") {
        try {
          parsedValue = JSON.parse(value);
        } catch (_) {
          // If it fails to parse, just save as string (though it should be valid JSON)
        }
      }

      await prisma.storeConfig.upsert({
        where: { key },
        update: { value: parsedValue },
        create: { key, value: parsedValue },
      });
    }

    // Invalidate the cache for the entire site so the layout picks up new settings immediately
    revalidatePath('/', 'layout');

    return NextResponse.json({ message: "Configuration saved successfully" });
  } catch (error) {
    console.error("Store config PUT error:", error);
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
  }
}

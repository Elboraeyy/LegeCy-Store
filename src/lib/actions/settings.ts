"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type StoreSettingsMap = {
    [key: string]: string;
};

/**
 * Fetch specific store settings by keys.
 * If a key doesn't exist, it returns null for that key.
 */
export async function getStoreSettings(keys: string[]): Promise<StoreSettingsMap> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const settings = await (prisma as any).storeSetting.findMany({
            where: {
                key: { in: keys },
            },
        });

        // Convert array to map for easier access
        const settingsMap: StoreSettingsMap = {};
        keys.forEach((key) => {
            const setting = settings.find((s: { key: string; value: string }) => s.key === key);
            settingsMap[key] = setting ? setting.value : "";
        });

        return settingsMap;
    } catch (error) {
        console.error("Failed to fetch store settings:", error);
        return {};
    }
}

/**
 * Fetch all store settings.
 */
export async function getAllStoreSettings(): Promise<StoreSettingsMap> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const settings = await (prisma as any).storeSetting.findMany();
        const settingsMap: StoreSettingsMap = {};
        settings.forEach((s: { key: string; value: string }) => {
            settingsMap[s.key] = s.value;
        });
        return settingsMap;
    } catch (error) {
        console.error("Failed to fetch all store settings:", error);
        return {};
    }
}

/**
 * Update or create a store setting.
 */
export async function updateStoreSetting(key: string, value: string, description?: string) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).storeSetting.upsert({
            where: { key },
            update: {
                value,
                ...(description && { description }),
            },
            create: {
                key,
                value,
                description,
            },
        });

        revalidatePath("/");
        revalidatePath("/cart");
        revalidatePath("/admin/promos");

        return { success: true };
    } catch (error) {
        console.error(`Failed to update setting ${key}:`, error);
        return { success: false, error: "Failed to update setting" };
    }
}
